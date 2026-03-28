"""
Custom exception hierarchy for TrafficVision backend.
All business logic errors should raise these exceptions.
"""


class TrafficVisionException(Exception):
    """Base exception for all TrafficGenie errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: dict = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self):
        """Convert exception to error response dict."""
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "details": self.details,
            }
        }


# ============================================================================
# VALIDATION ERRORS (400)
# ============================================================================


class ValidationError(TrafficVisionException):
    """Invalid request data."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            details=details,
        )


class InvalidViolationData(ValidationError):
    """Violation data is invalid."""

    def __init__(self, details: dict = None):
        super().__init__(
            message="Invalid violation data",
            details=details,
        )


class InvalidChallanData(ValidationError):
    """Challan data is invalid."""

    def __init__(self, details: dict = None):
        super().__init__(
            message="Invalid challan data",
            details=details,
        )


# ============================================================================
# AUTHENTICATION/AUTHORIZATION ERRORS (401/403)
# ============================================================================


class AuthenticationError(TrafficVisionException):
    """Authentication failed."""

    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=401,
        )


class AuthorizationError(TrafficVisionException):
    """User lacks required permissions."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=403,
        )


class InvalidToken(AuthenticationError):
    """Firebase token is invalid or expired."""

    def __init__(self):
        super().__init__("Invalid or expired authentication token")


# ============================================================================
# NOT FOUND ERRORS (404)
# ============================================================================


class NotFoundError(TrafficVisionException):
    """Resource not found."""

    def __init__(self, resource: str, resource_id):
        super().__init__(
            message=f"{resource} not found",
            error_code="NOT_FOUND",
            status_code=404,
            details={"resource": resource, "id": str(resource_id)},
        )


class ViolationNotFound(NotFoundError):
    def __init__(self, violation_id):
        super().__init__("Violation", violation_id)


class ChallanNotFound(NotFoundError):
    def __init__(self, challan_id):
        super().__init__("Challan", challan_id)


class CameraNotFound(NotFoundError):
    def __init__(self, camera_id):
        super().__init__("Camera", camera_id)


class JobNotFound(NotFoundError):
    def __init__(self, job_id):
        super().__init__("Processing Job", job_id)


# ============================================================================
# CONFLICT ERRORS (409)
# ============================================================================


class ConflictError(TrafficVisionException):
    """Resource conflict (e.g., duplicate, state mismatch)."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            error_code="CONFLICT",
            status_code=409,
            details=details,
        )


class DuplicateViolation(ConflictError):
    """Violation already exists."""

    def __init__(self, plate: str, location: str):
        super().__init__(
            message="Similar violation already recorded",
            details={"plate": plate, "location": location},
        )


# ============================================================================
# SERVICE ERRORS (500)
# ============================================================================


class ServiceError(TrafficVisionException):
    """External service call failed."""

    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"{service} service error: {message}",
            error_code="SERVICE_ERROR",
            status_code=500,
            details={"service": service},
        )


class FirebaseError(ServiceError):
    """Firebase operation failed."""

    def __init__(self, message: str):
        super().__init__("Firebase", message)


class GeminiError(ServiceError):
    """Gemini API call failed."""

    def __init__(self, message: str):
        super().__init__("Gemini", message)


class StorageError(ServiceError):
    """File storage operation failed."""

    def __init__(self, message: str):
        super().__init__("Storage", message)


class DetectionError(ServiceError):
    """Video detection pipeline failed."""

    def __init__(self, message: str):
        super().__init__("Detection", message)


# ============================================================================
# PROCESSING ERRORS (422)
# ============================================================================


class ProcessingError(TrafficVisionException):
    """Request cannot be processed."""

    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="PROCESSING_ERROR",
            status_code=422,
        )


class VideoProcessingError(ProcessingError):
    """Video processing failed."""

    def __init__(self, message: str):
        super().__init__(f"Video processing failed: {message}")


class ImageUploadError(ProcessingError):
    """Image upload failed."""

    def __init__(self, message: str):
        super().__init__(f"Image upload failed: {message}")


# ============================================================================
# UNAVAILABLE ERRORS (503)
# ============================================================================


class ServiceUnavailable(TrafficVisionException):
    """Service is temporarily unavailable."""

    def __init__(self, service: str):
        super().__init__(
            message=f"{service} is temporarily unavailable",
            error_code="SERVICE_UNAVAILABLE",
            status_code=503,
            details={"service": service},
        )


class FirebaseUnavailable(ServiceUnavailable):
    def __init__(self):
        super().__init__("Firebase")


class DatabaseUnavailable(ServiceUnavailable):
    def __init__(self):
        super().__init__("Database")
