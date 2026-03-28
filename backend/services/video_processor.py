"""
Video Processing Service for TrafficVision.
Processes video files to detect violations and store them in database.
"""
import logging
import os
from datetime import datetime
from pathlib import Path

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

from config import settings
from fastapi_db import SessionLocal
from fastapi_models import Camera, Challan, Evidence, Violation, Zone
from violation_logic import (
    detect_triple_riding,
    detect_no_helmet,
    detect_wrong_side,
)

logger = logging.getLogger(__name__)


class VideoProcessor:
    """Process video files for violation detection."""

    def __init__(self, model_path: str = None):
        """Initialize with YOLO model."""
        if not YOLO_AVAILABLE or not OPENCV_AVAILABLE:
            logger.warning("Video processing dependencies not available")
            self.model = None
            return

        if model_path is None:
            model_path = os.path.join(settings.BASE_DIR, "models", "yolov8n.pt")
        
        try:
            self.model = YOLO(model_path)
            logger.info(f"YOLO model loaded: {model_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None

        # Load separate helmet model if configured
        self.helmet_model = None
        if settings.HELMET_MODEL_PATH:
            helmet_path = os.path.join(settings.BASE_DIR, settings.HELMET_MODEL_PATH)
            if os.path.exists(helmet_path):
                try:
                    self.helmet_model = YOLO(helmet_path)
                    logger.info(f"Helmet model loaded: {helmet_path}")
                except Exception as e:
                    logger.error(f"Failed to load helmet model: {e}")
                    self.helmet_model = None
            else:
                logger.warning(f"Helmet model path does not exist: {helmet_path}")

        # Default to main model if no helmet model specified
        if self.helmet_model is None:
            self.helmet_model = self.model

    def process_video(
        self,
        video_path: str,
        camera_code: str = "CAM-01",
        save_frames: bool = True,
    ) -> dict:
        """
        Process video and create violation records.
        
        Args:
            video_path: Path to video file
            camera_code: Camera identifier
            save_frames: Whether to save frame images
            
        Returns:
            Dict with processing results
        """
        if not OPENCV_AVAILABLE or not YOLO_AVAILABLE:
            return {"success": False, "error": "Video processing not available"}

        if self.model is None:
            return {"success": False, "error": "YOLO model not loaded"}

        if not os.path.exists(video_path):
            logger.error(f"Video not found: {video_path}")
            return {"success": False, "error": "Video not found"}

        try:
            db = SessionLocal()
            cap = cv2.VideoCapture(video_path)

            frame_count = 0
            violations_count = 0
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_skip = max(1, int(fps // 5))  # Process 5 frames per second

            # Get or create camera
            camera = db.query(Camera).filter(Camera.code == camera_code).first()
            if not camera:
                logger.error(f"Camera not found: {camera_code}")
                return {"success": False, "error": "Camera not found"}

            logger.info(f"Processing video: {video_path} (Camera: {camera_code})")

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1

                # Skip frames for efficiency
                if frame_count % frame_skip != 0:
                    continue

                # Run YOLO detection
                results = self.model(frame, verbose=False)
                boxes = results[0].boxes

                persons = []
                bikes = []
                helmets = []
                vehicles = []

                # Extract detections
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    label = self.model.names[cls]

                    if conf <= 0.5:
                        continue

                    if label == "person":
                        persons.append((x1, y1, x2, y2))
                        vehicles.append((x1, y1, x2, y2))
                    elif label == "motorcycle":
                        bikes.append((x1, y1, x2, y2))
                        vehicles.append((x1, y1, x2, y2))
                    elif label in {"car", "truck", "bus", "bicycle"}:
                        vehicles.append((x1, y1, x2, y2))
                    elif label == "helmet":
                        helmets.append((x1, y1, x2, y2))

                # Detect violations
                violations = []
                violations.extend(detect_triple_riding(persons, bikes))

                if self.helmet_model and self.helmet_model != self.model:
                    violations.extend(self._detect_no_helmet(frame, persons))
                else:
                    violations.extend(detect_no_helmet(persons, bikes, helmets))

                violations.extend(
                    detect_wrong_side(
                        vehicles,
                        frame.shape[1],
                        direction=getattr(settings, "TRAFFIC_DIRECTION", "right"),
                    )
                )

                for violation in violations:
                    # Save frame if enabled
                    frame_path = None
                    if save_frames:
                        frame_name = f"video_frame_{camera_code}_{frame_count}.jpg"
                        frame_path = os.path.join(settings.OUTPUT_DIR, frame_name)
                        cv2.imwrite(frame_path, frame)

                    violation_type = violation.get("type", "Unknown")

                    # Create violation record
                    db_violation = Violation(
                        violation_type=violation_type,
                        plate="",
                        confidence=85.0,
                        detected_at=datetime.utcnow(),
                        location=camera.location,
                        ward=camera.ward,
                        zone=camera.zone.name if camera.zone else "Unknown",
                        model_version="yolov8n",
                        camera_id=camera.id,
                    )
                    db.add(db_violation)
                    db.flush()

                    # Add evidence
                    image_url = f"http://localhost:8000/images/{frame_name}" if frame_path else ""
                    evidence = Evidence(
                        violation_id=db_violation.id,
                        image_url=image_url,
                        frame_ref=f"frame_{frame_count}",
                    )
                    db.add(evidence)

                    # Create challan
                    challan = Challan(
                        violation_id=db_violation.id,
                        status="pending",
                        fine=2000,
                    )
                    db.add(challan)

                    violations_count += 1
                    logger.info(
                        f"Violation detected at frame {frame_count}: {violation_type}"
                    )

            cap.release()
            db.commit()
            db.close()

            logger.info(
                f"Video processing complete: {violations_count} violations detected"
            )
            return {
                "success": True,
                "frames_processed": frame_count,
                "violations_detected": violations_count,
                "camera_code": camera_code,
            }

        except Exception as e:
            logger.error(f"Video processing error: {e}")
            db.rollback()
            db.close()
            return {
                "success": False,
                "error": str(e),
            }

    def _detect_no_helmet(self, frame, persons):
        """Detect no-helmet violations using the helmet model."""
        violations = []

        # If helmet model is the same as main model, assume helmet is detected by main model output.
        if not self.helmet_model or self.helmet_model == self.model:
            return violations

        try:
            for person_box in persons:
                x1, y1, x2, y2 = person_box

                # Crop upper body region from person box
                person_crop = frame[y1:y2, x1:x2]
                if person_crop.size == 0:
                    continue

                # Run helmet model on cropped region
                result = self.helmet_model(person_crop, conf=0.3, verbose=False)
                helmet_found = False

                if result and len(result) > 0:
                    for box in result[0].boxes:
                        cls = int(box.cls[0])
                        label = self.helmet_model.names.get(cls, "unknown").lower()
                        if label in ("helmet", "with_helmet", "hardhat"):
                            helmet_found = True
                            break

                if not helmet_found:
                    violations.append({
                        "person_box": person_box,
                        "type": "No Helmet",
                    })

        except Exception as e:
            logger.warning(f"Helmet detection failed: {e}")

        return violations

    def process_video_batch(self, videos_dir: str) -> list:
        """Process all videos in a directory."""
        results = []
        videos = list(Path(videos_dir).glob("*.mp4"))

        for video_path in videos:
            result = self.process_video(str(video_path))
            results.append(result)

        return results


# Global processor instance
_processor = None


def get_processor():
    """Get or create video processor."""
    global _processor
    if _processor is None:
        _processor = VideoProcessor()
    return _processor
