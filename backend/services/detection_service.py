"""
Detection service for traffic violation detection pipeline.
Integrates YOLOv8 model with violation business logic.
"""
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from ultralytics import YOLO

from config import settings
from core.exceptions import DetectionError
from core.logger import get_logger
from utils.yolo import resolve_label

logger = get_logger(__name__)


class DetectionService:
    """Service for video processing and violation detection."""

    def __init__(self):
        """Initialize detection service with YOLO model."""
        self.model = None
        self.helmet_model = None
        self._load_models()

    def _load_models(self) -> None:
        """Load YOLO models for detection."""
        try:
            if os.path.exists(settings.YOLO_MODEL_PATH):
                self.model = YOLO(settings.YOLO_MODEL_PATH)
                logger.info(f"Loaded main model: {settings.YOLO_MODEL_PATH}")
            else:
                logger.warning(f"Model not found: {settings.YOLO_MODEL_PATH}")
                self.model = YOLO("yolov8n.pt")  # Auto-download if available

            # Load helmet model if specified
            if settings.HELMET_MODEL_PATH and os.path.exists(
                settings.HELMET_MODEL_PATH
            ):
                self.helmet_model = YOLO(settings.HELMET_MODEL_PATH)
                logger.info(f"Loaded helmet model: {settings.HELMET_MODEL_PATH}")

        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise DetectionError(f"Model loading failed: {e}")

    def process_video(
        self,
        video_path: str,
        confidence_threshold: float = 0.5,
        frame_skip: int = 5,
        camera_location: str = "Unknown",
    ) -> Dict:
        """Process video and detect violations.

        Args:
            video_path: Path to video file
            confidence_threshold: YOLO confidence threshold
            frame_skip: Process every Nth frame
            camera_location: Camera location for context

        Returns:
            Dict with violations, stats, and evidence paths
        """
        if not self.model:
            raise DetectionError("Detection model not initialized")

        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise DetectionError(f"Cannot open video: {video_path}")

            violations = []
            frame_count = 0
            processed_frames = 0

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1

                # Skip frames for performance
                if frame_count % frame_skip != 0:
                    continue

                processed_frames += 1

                # Run detection
                frame_violations = self._detect_violations_in_frame(
                    frame,
                    confidence_threshold,
                    frame_count,
                    camera_location,
                )
                violations.extend(frame_violations)

            # Deduplicate violations
            violations = self._deduplicate_violations(violations)

            logger.info(
                f"Video processed: {frame_count} frames, {processed_frames} processed, "
                f"{len(violations)} unique violations"
            )

            return {
                "status": "success",
                "total_frames": frame_count,
                "processed_frames": processed_frames,
                "violations_count": len(violations),
                "violations": violations,
            }

        except Exception as e:
            logger.error(f"Video processing failed: {e}")
            raise DetectionError(str(e))
        finally:
            if "cap" in locals() and cap is not None:
                cap.release()

    def _detect_violations_in_frame(
        self,
        frame: np.ndarray,
        confidence_threshold: float,
        frame_number: int,
        camera_location: str,
    ) -> List[Dict]:
        """Detect violations in a single frame.

        Args:
            frame: Video frame (image array)
            confidence_threshold: Confidence threshold
            frame_number: Frame number in video
            camera_location: Camera location

        Returns:
            List of violation dicts
        """
        violations = []

        try:
            # Run YOLO detection
            results = self.model(frame, conf=confidence_threshold, verbose=False)

            if not results or len(results) == 0:
                return violations

            result = results[0]
            boxes = result.boxes

            # Extract persons and motorcycles
            persons = []
            motorcycles = []

            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                label = resolve_label(self.model.names, cls)

                if label == "person":
                    persons.append((x1, y1, x2, y2, conf))
                elif label in ("motorcycle", "motorbike", "bike"):
                    motorcycles.append((x1, y1, x2, y2, conf))

            # Detect triple riding
            triple_riding = self._detect_triple_riding(persons, motorcycles)
            for violation_data in triple_riding:
                violations.append(
                    {
                        "type": "Triple Riding",
                        "location": camera_location,
                        "frame": frame_number,
                        "timestamp": datetime.utcnow().isoformat(),
                        "confidence": violation_data["confidence"],
                        "details": {
                            "rider_count": violation_data["rider_count"],
                            "bike_box": violation_data["bike_box"],
                        },
                    }
                )

            # Detect no helmet (if helmet model available)
            if self.helmet_model and persons:
                no_helmet = self._detect_no_helmet(frame, persons)
                for violation_data in no_helmet:
                    violations.append(
                        {
                            "type": "No Helmet",
                            "location": camera_location,
                            "frame": frame_number,
                            "timestamp": datetime.utcnow().isoformat(),
                            "confidence": violation_data["confidence"],
                            "details": violation_data,
                        }
                    )

        except Exception as e:
            logger.warning(f"Error processing frame {frame_number}: {e}")

        return violations

    @staticmethod
    def _detect_triple_riding(
        persons: List[Tuple[int, int, int, int, float]],
        motorcycles: List[Tuple[int, int, int, int, float]],
    ) -> List[Dict]:
        """Detect triple riding violations.

        Uses geometric intersection: if 3+ person centroids are inside a bike's bounding box.

        Args:
            persons: List of (x1, y1, x2, y2, confidence) tuples
            motorcycles: List of (x1, y1, x2, y2, confidence) tuples

        Returns:
            List of violation dicts
        """
        violations = []

        for bike in motorcycles:
            bx1, by1, bx2, by2, bike_conf = bike
            rider_count = 0
            riders_in_bike = []

            for person in persons:
                px1, py1, px2, py2, person_conf = person
                cx = (px1 + px2) // 2  # Person centroid
                cy = (py1 + py2) // 2

                # Check if person is inside bike bounding box
                if bx1 < cx < bx2 and by1 < cy < by2:
                    rider_count += 1
                    riders_in_bike.append((px1, py1, px2, py2))

            # Triple riding if 3+ riders
            if rider_count >= 3:
                violations.append(
                    {
                        "bike_box": [bx1, by1, bx2, by2],
                        "rider_count": rider_count,
                        "riders": riders_in_bike,
                        "confidence": float(bike_conf),
                    }
                )

        return violations

    def _detect_no_helmet(
        self, frame: np.ndarray, persons: List[Tuple[int, int, int, int, float]]
    ) -> List[Dict]:
        """Detect riders without helmets.

        Uses specialized helmet model if available.

        Args:
            frame: Video frame
            persons: List of (x1, y1, x2, y2, confidence) tuples

        Returns:
            List of violation dicts
        """
        violations = []

        if not self.helmet_model:
            return violations

        try:
            for person in persons:
                x1, y1, x2, y2, person_conf = person

                # Crop person region
                person_crop = frame[y1:y2, x1:x2]
                if person_crop.size == 0:
                    continue

                # Run helmet detection on cropped region
                results = self.helmet_model(
                    person_crop, conf=0.5, verbose=False
                )

                if not results:
                    continue

                result = results[0]

                # Check if helmet detected
                helmet_detected = False
                for box in result.boxes:
                    cls = int(box.cls[0])
                    label = resolve_label(self.helmet_model.names, cls)
                    if label.lower() in ("helmet", "with_helmet"):
                        helmet_detected = True
                        break

                if not helmet_detected:
                    violations.append(
                        {
                            "person_box": [x1, y1, x2, y2],
                            "confidence": float(person_conf),
                        }
                    )

        except Exception as e:
            logger.warning(f"Helmet detection error: {e}")

        return violations

    @staticmethod
    def _deduplicate_violations(
        violations: List[Dict],
        time_window_frames: int = 10,
    ) -> List[Dict]:
        """Deduplicate similar violations across nearby frames.

        Args:
            violations: List of violations
            time_window_frames: Frames to consider as same event

        Returns:
            Deduplicated list
        """
        if not violations:
            return []

        # Group violations by type and location
        groups = {}
        for v in violations:
            key = (v["type"], v["location"])
            if key not in groups:
                groups[key] = []
            groups[key].append(v)

        # Keep earliest event, then keep another only if far enough in time.
        # This avoids dropping distinct events while still reducing duplicate bursts.
        deduplicated = []
        for group in groups.values():
            if group:
                group.sort(key=lambda x: x.get("frame", 0))
                kept_frames = []

                for violation in group:
                    frame = int(violation.get("frame", 0))
                    if not kept_frames:
                        deduplicated.append(violation)
                        kept_frames.append(frame)
                        continue

                    if frame - kept_frames[-1] >= time_window_frames:
                        deduplicated.append(violation)
                        kept_frames.append(frame)

        return deduplicated

    def save_evidence_frame(
        self,
        frame: np.ndarray,
        output_dir: str,
        prefix: str = "violation",
    ) -> str:
        """Save evidence frame image.

        Args:
            frame: Video frame to save
            output_dir: Output directory
            prefix: Filename prefix

        Returns:
            Path to saved file
        """
        try:
            os.makedirs(output_dir, exist_ok=True)

            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{prefix}_{timestamp}.jpg"
            filepath = os.path.join(output_dir, filename)

            cv2.imwrite(filepath, frame)
            logger.info(f"Evidence frame saved: {filepath}")

            return filepath

        except Exception as e:
            logger.error(f"Failed to save evidence frame: {e}")
            raise DetectionError(f"Frame save failed: {e}")


# Global instance
detection_service = DetectionService()
