"""
Firebase integration service for TrafficVision backend.
Handles Firestore, Cloud Storage, and admin operations.
"""
import json
import os
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore, storage

from config import settings
from core.exceptions import (
    FirebaseError,
    FirebaseUnavailable,
    InvalidToken,
)
from core.logger import get_logger

logger = get_logger(__name__)


class FirebaseService:
    """Singleton Firebase service for all Firebase operations."""

    _instance = None
    _initialized = False

    def __new__(cls):
        """Ensure singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize Firebase service."""
        if self._initialized:
            return

        self._db = None
        self._storage_bucket = None
        self._app = None

        self._initialize_firebase()
        self.__class__._initialized = True

    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK."""
        try:
            # Check if already initialized
            if firebase_admin._apps:
                self._app = firebase_admin._apps.get(None)
                if self._app:
                    logger.info("Firebase already initialized")
                    self._db = firestore.client()
                    if settings.FIREBASE_STORAGE_BUCKET:
                        self._storage_bucket = storage.bucket(
                            settings.FIREBASE_STORAGE_BUCKET
                        )
                    return

            # Load credentials
            cred = self._load_credentials()
            if not cred:
                logger.warning("Firebase credentials not available - features will be limited")
                return

            # Initialize Firebase Admin
            self._app = firebase_admin.initialize_app(cred)
            self._db = firestore.client()

            if settings.FIREBASE_STORAGE_BUCKET:
                self._storage_bucket = storage.bucket(
                    settings.FIREBASE_STORAGE_BUCKET
                )

            logger.info(
                "Firebase initialized successfully",
                extra={
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "storage_bucket": settings.FIREBASE_STORAGE_BUCKET,
                },
            )

        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            if not settings.is_development():
                raise FirebaseUnavailable()

    def _load_credentials(self) -> Optional[Any]:
        """Load Firebase credentials from JSON string or file."""
        try:
            # Try JSON string first
            if settings.FIREBASE_CREDENTIALS_JSON:
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                return credentials.Certificate(cred_dict)

            # Try file path
            if settings.FIREBASE_CREDENTIALS_PATH:
                if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
                    return credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                logger.warning(
                    f"Credentials file not found: {settings.FIREBASE_CREDENTIALS_PATH}"
                )

            logger.warning("No Firebase credentials available")
            return None

        except json.JSONDecodeError as e:
            logger.error(f"Invalid Firebase credentials JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Error loading Firebase credentials: {e}")
            return None

    def is_available(self) -> bool:
        """Check if Firebase is properly initialized."""
        return self._app is not None and self._db is not None

    # ========================================================================
    # FIRESTORE OPERATIONS
    # ========================================================================

    def save_violation(self, violation_data: Dict[str, Any]) -> str:
        """Save violation to Firestore.

        Args:
            violation_data: Violation document data

        Returns:
            Document ID

        Raises:
            FirebaseError: If save fails
        """
        if not self.is_available():
            raise FirebaseUnavailable()

        try:
            _, doc_ref = self._db.collection("violations").add(violation_data)
            logger.info(f"Violation saved: {doc_ref.id}")
            return doc_ref.id

        except Exception as e:
            logger.error(f"Failed to save violation: {e}")
            raise FirebaseError(str(e))

    def get_violation(self, violation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve violation from Firestore.

        Args:
            violation_id: Firestore document ID

        Returns:
            Violation document or None if not found
        """
        if not self.is_available():
            raise FirebaseUnavailable()

        try:
            doc = self._db.collection("violations").document(violation_id).get()
            if not doc.exists:
                return None

            data = doc.to_dict()
            data["id"] = doc.id
            return data

        except Exception as e:
            logger.error(f"Failed to get violation {violation_id}: {e}")
            raise FirebaseError(str(e))

    def query_violations(
        self,
        filters: Dict[str, Any] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Query violations from Firestore.

        Args:
            filters: Query filters (e.g., {"status": "pending"})
            limit: Result limit
            offset: Number of results to skip

        Returns:
            List of violation documents
        """
        if not self.is_available():
            raise FirebaseUnavailable()

        try:
            query = self._db.collection("violations")

            # Apply filters
            if filters:
                for key, value in filters.items():
                    query = query.where(key, "==", value)

            # Apply pagination
            query = query.offset(offset).limit(limit)

            docs = query.stream()
            results = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                results.append(data)

            return results

        except Exception as e:
            logger.error(f"Failed to query violations: {e}")
            raise FirebaseError(str(e))

    def update_violation(
        self, violation_id: str, update_data: Dict[str, Any]
    ) -> None:
        """Update violation in Firestore.

        Args:
            violation_id: Firestore document ID
            update_data: Fields to update

        Raises:
            FirebaseError: If update fails
        """
        if not self.is_available():
            raise FirebaseUnavailable()

        try:
            self._db.collection("violations").document(violation_id).update(
                update_data
            )
            logger.info(f"Violation updated: {violation_id}")

        except Exception as e:
            logger.error(f"Failed to update violation {violation_id}: {e}")
            raise FirebaseError(str(e))

    def save_challan(self, challan_data: Dict[str, Any]) -> str:
        """Save challan to Firestore.

        Args:
            challan_data: Challan document data

        Returns:
            Document ID
        """
        if not self.is_available():
            raise FirebaseUnavailable()

        try:
            _, doc_ref = self._db.collection("challans").add(challan_data)
            logger.info(f"Challan saved: {doc_ref.id}")
            return doc_ref.id

        except Exception as e:
            logger.error(f"Failed to save challan: {e}")
            raise FirebaseError(str(e))

    # ========================================================================
    # FIREBASE STORAGE OPERATIONS
    # ========================================================================

    def upload_file(
        self, file_path: str, storage_path: str, content_type: str = None
    ) -> str:
        """Upload file to Firebase Storage.

        Args:
            file_path: Local file path
            storage_path: Path in Cloud Storage (e.g., "violations/image.jpg")
            content_type: MIME type (optional)

        Returns:
            Public URL

        Raises:
            FirebaseError: If upload fails
        """
        if not self._storage_bucket:
            raise FirebaseError("Cloud Storage not configured")

        try:
            blob = self._storage_bucket.blob(storage_path)
            blob.upload_from_filename(file_path, content_type=content_type)
            blob.make_public()

            public_url = blob.public_url
            logger.info(f"File uploaded to Cloud Storage: {storage_path}")
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload file {storage_path}: {e}")
            raise FirebaseError(str(e))

    def generate_download_url(self, storage_path: str, expiration_hours: int = 24) -> str:
        """Generate signed download URL for file in Cloud Storage.

        Args:
            storage_path: Path in Cloud Storage
            expiration_hours: URL expiration time in hours

        Returns:
            Signed URL

        Raises:
            FirebaseError: If generation fails
        """
        if not self._storage_bucket:
            raise FirebaseError("Cloud Storage not configured")

        try:
            from datetime import timedelta

            blob = self._storage_bucket.blob(storage_path)
            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(hours=expiration_hours),
                method="GET",
            )
            return url

        except Exception as e:
            logger.error(f"Failed to generate URL for {storage_path}: {e}")
            raise FirebaseError(str(e))

    # ========================================================================
    # AUTHENTICATION OPERATIONS
    # ========================================================================

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify Firebase ID token.

        Args:
            token: Firebase ID token

        Returns:
            Decoded token claims

        Raises:
            InvalidToken: If token is invalid
        """
        try:
            claims = firebase_auth.verify_id_token(token)
            return claims

        except Exception as e:
            logger.warning(f"Invalid token: {e}")
            raise InvalidToken()

    def get_user(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user info from Firebase Auth.

        Args:
            uid: Firebase UID

        Returns:
            User info dict or None
        """
        try:
            user = firebase_auth.get_user(uid)
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "email_verified": user.email_verified,
                "disabled": user.disabled,
            }

        except Exception as e:
            logger.warning(f"Failed to get user {uid}: {e}")
            return None


# Global instance
firebase_service = FirebaseService()
