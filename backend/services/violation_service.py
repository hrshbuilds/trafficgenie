"""
Violation service - orchestrates business logic for violation processing.
Integrates detection, storage, AI insights, and database operations.
"""
import os
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from core.exceptions import (
    DetectionError,
    InvalidViolationData,
    StorageError,
    ViolationNotFound,
)
from core.logger import get_logger
from fastapi_models import Camera, Challan, Evidence, Violation, Zone
from services.detection_service import detection_service
from services.firebase_service import firebase_service
from services.gemini_service import gemini_service

logger = get_logger(__name__)


class ViolationService:
    """Service for violation processing and management."""

    @staticmethod
    def create_violation_from_detection(
        detection_result: Dict,
        db: Session,
        camera_code: Optional[str] = None,
    ) -> Violation:
        """Create violation record from detection result.

        Args:
            detection_result: Dict from detection pipeline
            db: Database session
            camera_code: Camera identifier

        Returns:
            Created Violation record
        """
        try:
            # Validate required fields
            required_fields = ["type", "location"]
            for field in required_fields:
                if field not in detection_result:
                    raise InvalidViolationData({field: "required"})

            # Get or create camera
            camera = None
            if camera_code:
                camera = (
                    db.query(Camera)
                    .filter(Camera.code == camera_code)
                    .first()
                )

            # Create violation
            violation = Violation(
                violation_type=detection_result.get("type"),
                plate=detection_result.get("plate", "UNKNOWN"),
                confidence=detection_result.get("confidence", 0.0),
                detected_at=datetime.utcnow(),
                location=detection_result.get("location"),
                ward=detection_result.get("ward", "Unknown"),
                zone=detection_result.get("zone", "Unknown"),
                model_version="yolov8n",
                camera_id=camera.id if camera else None,
            )

            db.add(violation)
            db.flush()

            # Add evidence
            if "evidence_path" in detection_result:
                evidence = Evidence(
                    violation_id=violation.id,
                    image_url=detection_result["evidence_path"],
                    frame_ref=str(detection_result.get("frame", "")),
                )
                db.add(evidence)

            # Create auto-generated challan
            challan = Challan(
                violation_id=violation.id,
                status="pending",
                fine=ViolationService._get_default_fine(detection_result.get("type")),
            )
            db.add(challan)

            db.commit()
            db.refresh(violation)

            logger.info(f"Violation created: {violation.id} ({violation.violation_type})")
            return violation

        except Exception as e:
            logger.error(f"Failed to create violation: {e}")
            db.rollback()
            raise

    @staticmethod
    def process_and_store_violation(
        detection_result: Dict,
        evidence_file_path: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict:
        """End-to-end violation processing.

        1. Upload evidence to Firebase Storage
        2. Save violation to database
        3. Generate AI insight
        4. Return complete record

        Args:
            detection_result: Detection pipeline output
            evidence_file_path: Path to evidence image
            db: Database session (optional for Firebase-only mode)

        Returns:
            Complete violation dict with insights
        """
        try:
            # Upload evidence to Firebase Storage if available
            evidence_url = None
            if evidence_file_path and firebase_service.is_available():
                try:
                    storage_path = f"violations/{os.path.basename(evidence_file_path)}"
                    evidence_url = firebase_service.upload_file(
                        evidence_file_path,
                        storage_path,
                        content_type="image/jpeg",
                    )
                except Exception as e:
                    logger.warning(f"Failed to upload evidence: {e}")
            elif evidence_file_path:
                # Fallback: use local file path
                evidence_url = f"file://{os.path.abspath(evidence_file_path)}"

            # Prepare violation data
            violation_data = {
                "type": detection_result.get("type"),
                "location": detection_result.get("location"),
                "plate": detection_result.get("plate", "UNKNOWN"),
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": detection_result.get("confidence", 0.0),
                "evidence_url": evidence_url,
                "frame": detection_result.get("frame"),
                "details": detection_result.get("details", {}),
            }

            # Save to database if session provided
            violation_db = None
            if db:
                violation_db = ViolationService.create_violation_from_detection(
                    detection_result=detection_result,
                    db=db,
                    camera_code=detection_result.get("camera_code"),
                )
                violation_data["db_id"] = violation_db.id

            # Save to Firestore if available
            firestore_id = None
            if firebase_service.is_available():
                firestore_id = firebase_service.save_violation(violation_data)
                violation_data["firestore_id"] = firestore_id

            # Generate AI insight if enabled
            if settings.ENABLE_GEMINI_INSIGHTS and gemini_service.is_available():
                try:
                    insight = gemini_service.generate_violation_insight(
                        violation_type=violation_data["type"],
                        location=violation_data["location"],
                        vehicle_plate=violation_data["plate"],
                        timestamp=violation_data["timestamp"],
                        confidence=violation_data["confidence"],
                    )
                    violation_data["ai_insight"] = insight
                except Exception as e:
                    logger.warning(f"Failed to generate AI insight: {e}")

            return violation_data

        except Exception as e:
            logger.error(f"Failed to process violation: {e}")
            raise

    @staticmethod
    def get_violation_detail(
        violation_id: int,
        db: Session,
        include_insights: bool = True,
    ) -> Dict:
        """Get detailed violation information.

        Args:
            violation_id: Database violation ID
            db: Database session
            include_insights: Whether to generate insights

        Returns:
            Detailed violation dict
        """
        violation = (
            db.query(Violation)
            .filter(Violation.id == violation_id)
            .first()
        )

        if not violation:
            raise ViolationNotFound(violation_id)

        result = {
            "id": violation.id,
            "type": violation.violation_type,
            "plate": violation.plate,
            "location": violation.location,
            "confidence": violation.confidence,
            "detected_at": violation.detected_at.isoformat(),
            "evidence": [e.image_url for e in violation.evidence],
        }

        # Add AI insight if requested and not already in DB
        if include_insights and gemini_service.is_available():
            result["ai_insight"] = gemini_service.generate_violation_insight(
                violation_type=violation.violation_type,
                location=violation.location,
                vehicle_plate=violation.plate,
                timestamp=violation.detected_at.isoformat(),
                confidence=violation.confidence,
            )

        return result

    @staticmethod
    def _get_default_fine(violation_type: str) -> int:
        """Get default fine amount for violation type."""
        fines = {
            "Triple Riding": 2000,
            "No Helmet": 1500,
            "Red Light Jump": 2500,
            "Wrong Way": 3000,
        }
        return fines.get(violation_type, 2000)


from config import settings
