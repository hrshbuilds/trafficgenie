"""
Video Processing Service for TrafficGenie.
Processes video files to detect violations and store them in database.
"""
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple

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
from violation_logic import detect_triple_riding
from utils.yolo import resolve_label

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

        db = None
        cap = None
        try:
            db = SessionLocal()
            cap = cv2.VideoCapture(video_path)

            frame_count = 0
            processed_frames = 0
            violations_count = 0
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_skip = self._calculate_frame_skip(fps)  # ~5 fps processing target
            min_gap_frames = max(frame_skip * 3, 10)
            recent_events: Dict[Tuple[str, int, int], int] = {}

            # Get or create camera
            camera = db.query(Camera).filter(Camera.code == camera_code).first()
            if not camera:
                logger.error(f"Camera not found: {camera_code}")
                cap.release()
                db.close()
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
                processed_frames += 1

                # Run YOLO detection
                results = self.model(frame, verbose=False)
                boxes = results[0].boxes

                persons = []
                bikes = []

                # Extract detections
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    label = resolve_label(self.model.names, cls).lower()

                    if label == "person" and conf > 0.5:
                        persons.append((x1, y1, x2, y2))
                    elif label in ("motorcycle", "motorbike", "bike") and conf > 0.5:
                        bikes.append((x1, y1, x2, y2))

                # Detect triple riding
                violations = detect_triple_riding(persons, bikes)

                for violation in violations:
                    signature = self._event_signature("Triple Riding", violation["bike_box"])
                    if not self._should_emit_event(
                        signature=signature,
                        frame_number=frame_count,
                        recent_events=recent_events,
                        min_gap_frames=min_gap_frames,
                    ):
                        continue

                    # Save frame if enabled
                    frame_path = None
                    frame_name = None
                    if save_frames:
                        frame_name = f"video_frame_{camera_code}_{frame_count}.jpg"
                        frame_path = os.path.join(settings.OUTPUT_DIR, frame_name)
                        cv2.imwrite(frame_path, frame)

                    # Create violation record
                    db_violation = Violation(
                        violation_type="Triple Riding",
                        plate="",  # Would need OCR for real plate
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
                    image_url = (
                        f"http://localhost:8000/images/{frame_name}" if frame_path else ""
                    )
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
                        f"Violation detected at frame {frame_count}: Triple Riding"
                    )

            cap.release()
            db.commit()
            db.close()

            logger.info(
                f"Video processing complete: {violations_count} violations detected"
            )
            return {
                "success": True,
                "frames_processed": processed_frames,
                "violations_detected": violations_count,
                "camera_code": camera_code,
            }

        except Exception as e:
            logger.error(f"Video processing error: {e}")
            if cap is not None:
                cap.release()
            if db is not None:
                db.rollback()
                db.close()
            return {
                "success": False,
                "error": str(e),
            }

    def process_video_batch(self, videos_dir: str) -> list:
        """Process all videos in a directory."""
        results = []
        videos = list(Path(videos_dir).glob("*.mp4"))

        for video_path in videos:
            result = self.process_video(str(video_path))
            results.append(result)

        return results

    @staticmethod
    def _calculate_frame_skip(fps: float, target_fps: int = 5) -> int:
        """Calculate frame skip count from source FPS safely."""
        if not fps or fps <= 0:
            return 5
        return max(1, int(round(fps / target_fps)))

    @staticmethod
    def _event_signature(violation_type: str, bike_box: Tuple[int, int, int, int]) -> Tuple[str, int, int]:
        """Build spatial signature to deduplicate repeated frame hits for same event."""
        x1, y1, x2, y2 = map(int, bike_box[:4])
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        # Quantize to reduce detector jitter across nearby frames.
        return violation_type, cx // 40, cy // 40

    @staticmethod
    def _should_emit_event(
        signature: Tuple[str, int, int],
        frame_number: int,
        recent_events: Dict[Tuple[str, int, int], int],
        min_gap_frames: int,
    ) -> bool:
        """Return True when event should be stored as a new violation."""
        last_frame = recent_events.get(signature)
        if last_frame is not None and (frame_number - last_frame) < min_gap_frames:
            return False
        recent_events[signature] = frame_number
        return True


# Global processor instance
_processor = None


def get_processor():
    """Get or create video processor."""
    global _processor
    if _processor is None:
        _processor = VideoProcessor()
    return _processor
