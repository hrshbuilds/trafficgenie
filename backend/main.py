"""
TrafficGenie FastAPI Backend - Production Ready
Integrated with Firebase, Gemini, and YOLO detection.
"""
import logging
import os
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import Depends, FastAPI, File, HTTPException, Query, Security, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload

from config import settings
from core.exceptions import (
    AuthenticationError,
    InvalidToken,
    ServiceError,
    TrafficVisionException,
)
from core.logger import get_logger, logger
from fastapi_db import Base, SessionLocal, engine, get_db
from fastapi_models import (
    Camera,
    Challan,
    Evidence,
    ProcessingJob,
    ReviewAction,
    UserRole,
    Violation,
    Zone,
)
from fastapi_schemas import (
    AnalyticsSummary,
    ChallanOut,
    ChallanReview,
    HealthResponse,
    JobOut,
    ViolationOut,
)
from services.firebase_service import firebase_service
from services.gemini_service import gemini_service
from services.video_processor import get_processor
from seeds import seed_database_if_empty

# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Security
security = HTTPBearer(auto_error=False)

# Logging
app_logger = get_logger("main")

# ============================================================================
# MIDDLEWARE
# ============================================================================


@app.middleware("http")
async def logging_middleware(request, call_next):
    """Add request logging."""
    start_time = datetime.utcnow()
    response = await call_next(request)
    duration = (datetime.utcnow() - start_time).total_seconds()

    app_logger.info(
        f"{request.method} {request.url.path} - {response.status_code} ({duration:.3f}s)"
    )
    return response


# CORS
origins = (
    settings.ALLOWED_ORIGINS
    if settings.ALLOWED_ORIGINS == "*"
    else (
        settings.ALLOWED_ORIGINS
        if isinstance(settings.ALLOWED_ORIGINS, list)
        else settings.ALLOWED_ORIGINS.split(",")
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================


@app.exception_handler(TrafficVisionException)
async def traffic_genie_exception_handler(_, exc: TrafficVisionException):
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "details": {},
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"errors": exc.errors()},
            }
        },
    )


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================


@app.on_event("startup")
def on_startup():
    """Initialize app on startup."""
    app_logger.info("=== Starting TrafficGenie Backend ===")
    app_logger.info(f"Environment: {settings.ENV}")
    app_logger.info(f"Debug: {settings.DEBUG}")

    # Create directories
    for directory in [settings.UPLOAD_DIR, settings.OUTPUT_DIR]:
        os.makedirs(directory, exist_ok=True)
        app_logger.info(f"Directory ready: {directory}")

    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        app_logger.info("Database initialized")
    except Exception as e:
        app_logger.error(f"Database initialization failed: {e}")

    # Seed data if empty
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

    # Check Firebase
    if firebase_service.is_available():
        app_logger.info("Firebase ready")
    else:
        app_logger.warning("Firebase not available - some features disabled")

    # Check Gemini
    if gemini_service.is_available():
        app_logger.info("Gemini AI ready")
    else:
        app_logger.warning("Gemini not available - AI insights disabled")

    # Mount static files for local evidence (fallback)
    if os.path.exists(settings.OUTPUT_DIR):
        app.mount("/images", StaticFiles(directory=settings.OUTPUT_DIR), name="images")
        app_logger.info("Static file serving ready")

    app_logger.info("=== Startup Complete ===")


# ============================================================================
# AUTHENTICATION
# ============================================================================


def verify_firebase_token(
    authorization: HTTPAuthorizationCredentials | None = Security(security),
) -> dict:
    """Verify Firebase ID token from request headers."""
    # Demo mode bypass
    if settings.DEMO_MODE:
        return {
            "uid": "demo-user",
            "email": "demo@trafficgenie.local",
            "demo": True,
        }

    # Check if Firebase is available
    if not firebase_service.is_available():
        raise ServiceError("Firebase", "Authentication not available")

    # Check for authorization header
    if not authorization:
        raise AuthenticationError("Missing authorization header")

    try:
        token = authorization.credentials
        return firebase_service.verify_token(token)
    except InvalidToken:
        raise AuthenticationError("Invalid or expired token")


def require_role(
    decoded_token: dict,
    db: Session,
    allowed_roles: set[str],
) -> dict:
    """Check if user has required role."""
    uid = decoded_token.get("uid")
    if not uid:
        raise AuthenticationError("Invalid token")

    # Update or create user role
    role_obj = db.query(UserRole).filter(UserRole.firebase_uid == uid).first()
    if not role_obj:
        role_obj = UserRole(firebase_uid=uid, role="reviewer")
        db.add(role_obj)
        db.commit()

    if role_obj.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return decoded_token


# ============================================================================
# SEED DATA
# ============================================================================


def seed_data(db: Session):
    """Seed database with sample data."""
    try:
        # Create zone
        zone = Zone(name="Nashik Zone", city="Nashik")
        db.add(zone)
        db.flush()

        # Create cameras
        locations = [
            ("CAM-01", "Sadar Junction", "Sadar"),
            ("CAM-03", "Panchavati Circle", "Panchavati"),
            ("CAM-07", "College Road Junction", "College Road"),
            ("CAM-04", "MG Road Signal", "MG Road"),
            ("CAM-06", "Gangapur Road Flyover", "Gangapur Road"),
        ]

        cameras = {}
        for code, location, ward in locations:
            cam = Camera(code=code, location=location, ward=ward, zone_id=zone.id)
            db.add(cam)
            db.flush()
            cameras[code] = cam

        # Create sample violations
        images = sorted([f for f in os.listdir(settings.OUTPUT_DIR) if f.endswith(".jpg")])
        for idx, image_name in enumerate(images[:5]):  # Limit to 5 for demo
            raw_id = image_name.replace("violation_", "").replace(".jpg", "")
            image_numeric = sum(ord(ch) for ch in raw_id)
            code, location, ward = locations[image_numeric % len(locations)]
            camera = cameras[code]

            violation = Violation(
                violation_type="Triple Riding",
                plate=f"MH-15-AB-{1000 + image_numeric % 9000}",
                confidence=round(85 + (image_numeric % 15) + (image_numeric % 10) / 10, 1),
                detected_at=datetime.utcnow(),
                location=location,
                ward=ward,
                zone="Nashik Zone",
                model_version="yolov8n",
                camera_id=camera.id,
            )
            db.add(violation)
            db.flush()

            # Add evidence
            image_url = f"http://localhost:8000/images/{image_name}"
            if settings.ENV != "development":
                image_url = ""  # Use Firebase Storage URL in production

            db.add(
                Evidence(
                    violation_id=violation.id,
                    image_url=image_url,
                    frame_ref=raw_id,
                )
            )

            # Create challan
            db.add(
                Challan(
                    violation_id=violation.id,
                    status="pending",
                    fine=2000,
                )
            )

        db.commit()
        app_logger.info("Sample data created")

    except Exception as e:
        app_logger.error(f"Seed data error: {e}")
        db.rollback()


# ============================================================================
# SERIALIZERS
# ============================================================================


def serialize_challan(challan: Challan) -> ChallanOut:
    """Convert Challan DB model to Pydantic schema."""
    violation = challan.violation
    evidence_url = violation.evidence[0].image_url if violation.evidence else ""

    return ChallanOut(
        id=str(challan.id),
        image=evidence_url,
        type=violation.violation_type,
        location=violation.location,
        ward=violation.ward,
        zone=violation.zone,
        status=challan.status,
        plate=violation.plate,
        time=violation.detected_at.strftime("%H:%M:%S"),
        fine=challan.fine,
        conf=round(violation.confidence, 1),
        detected_at=violation.detected_at,
    )


def serialize_violation(violation: Violation) -> ViolationOut:
    """Convert Violation DB model to Pydantic schema."""
    return ViolationOut(
        id=violation.id,
        type=violation.violation_type,
        plate=violation.plate,
        confidence=round(violation.confidence, 1),
        detected_at=violation.detected_at,
        location=violation.location,
        ward=violation.ward,
        zone=violation.zone,
        model_version=violation.model_version,
        challan_status=violation.challan.status if violation.challan else None,
        evidence=[e.image_url for e in violation.evidence],
    )


# ============================================================================
# LEGACY SEED DATA (kept for backward compatibility)
# ============================================================================


def seed_data(db: Session):
    """Legacy seed_data - now calls new seeding module."""
    from seeds import seed_database_comprehensive
    seed_database_comprehensive(db)


# ============================================================================
# ROUTES - HEALTH & METADATA
# ============================================================================


@app.get("/health", response_model=HealthResponse, tags=["metadata"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health", response_model=HealthResponse, tags=["metadata"])
def api_health_check():
    """API health check with service status."""
    return {
        "status": "ok",
        "services": {
            "firebase": firebase_service.is_available(),
            "gemini": gemini_service.is_available(),
            "database": True,  # Assume OK if we got here
        },
    }


@app.get("/api/version", tags=["metadata"])
def get_version():
    """Get API version."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENV,
    }


# ============================================================================
# ROUTES - VIDEO UPLOAD & JOBS
# ============================================================================


@app.post("/api/videos/upload", response_model=JobOut, tags=["detection"])
async def upload_video(video: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload video for violation detection.

    The video is queued for processing. Use GET /api/jobs/{job_id} to check status.
    """
    # Validate file
    ext = Path(video.filename or "upload.bin").suffix.lower()
    if ext not in {".mp4", ".avi", ".mov", ".mkv"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format: {ext}. Supported: .mp4, .avi, .mov, .mkv",
        )

    try:
        # Save upload
        filename = f"{int(datetime.utcnow().timestamp())}_{video.filename}"
        destination = Path(settings.UPLOAD_DIR) / filename
        content = await video.read()

        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max: {settings.MAX_UPLOAD_SIZE_MB}MB",
            )

        destination.write_bytes(content)

        # Create job record
        job = ProcessingJob(
            source_file=str(destination),
            status="queued",
            result_summary=None,
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        app_logger.info(f"Video uploaded: {filename} (Job: {job.id})")
        return job

    except Exception as e:
        db.rollback()
        app_logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs/{job_id}", response_model=JobOut, tags=["detection"])
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get job status."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ============================================================================
# ROUTES - VIOLATIONS
# ============================================================================


@app.post("/api/detect", tags=["detection"])
async def detect_violations(
    detection_data: dict,
    db: Session = Depends(get_db),
):
    """Endpoint for receiving detection results from external service.

    This is where the detection pipeline sends results to be processed.
    """
    try:
        from services.violation_service import ViolationService

        # Process and store violation
        result = ViolationService.process_and_store_violation(
            detection_result=detection_data,
            db=db,
        )

        return {
            "status": "success",
            "violation": result,
        }

    except Exception as e:
        app_logger.error(f"Detection endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/violations", response_model=list[ViolationOut], tags=["violations"])
def list_violations(
    ward: str | None = None,
    violation_type: str | None = Query(default=None, alias="type"),
    plate: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("detected_at:desc"),
    db: Session = Depends(get_db),
):
    """Get list of violations with filtering, pagination, and sorting."""
    query = db.query(Violation).options(
        joinedload(Violation.evidence),
        joinedload(Violation.challan),
    )

    # Filters
    if ward:
        query = query.filter(Violation.ward == ward)
    if violation_type:
        query = query.filter(Violation.violation_type == violation_type)
    if plate:
        query = query.filter(Violation.plate.ilike(f"%{plate}%"))

    # Sort
    sort_field, _, direction = sort.partition(":")
    sort_column = (
        Violation.confidence if sort_field == "confidence" else Violation.detected_at
    )
    query = query.order_by(
        sort_column.desc() if direction != "asc" else sort_column.asc()
    )

    # Pagination
    offset = (page - 1) * page_size
    rows = query.offset(offset).limit(page_size).all()

    return [serialize_violation(row) for row in rows]


@app.get("/api/violations/{violation_id}", response_model=ViolationOut, tags=["violations"])
def get_violation(violation_id: int, db: Session = Depends(get_db)):
    """Get violation by ID."""
    violation = (
        db.query(Violation)
        .options(
            joinedload(Violation.evidence),
            joinedload(Violation.challan),
        )
        .filter(Violation.id == violation_id)
        .first()
    )

    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    return serialize_violation(violation)


# ============================================================================
# ROUTES - CHALLANS
# ============================================================================


@app.get("/api/challans", response_model=list[ChallanOut], tags=["challans"])
def list_challans(
    status: str | None = None,
    ward: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get list of challans with filtering."""
    query = db.query(Challan).join(Violation).options(
        joinedload(Challan.violation).joinedload(Violation.evidence)
    )

    if status:
        query = query.filter(Challan.status == status)
    if ward:
        query = query.filter(Violation.ward == ward)

    rows = (
        query.order_by(Challan.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return [serialize_challan(row) for row in rows]


@app.post(
    "/api/challans/{challan_id}/review",
    response_model=ChallanOut,
    tags=["challans"],
)
def review_challan(
    challan_id: int,
    review: ChallanReview,
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
):
    """Review and update challan status."""
    # Verify role
    require_role(decoded_token, db, {"admin", "reviewer"})

    # Validate status
    if review.status not in {"approved", "rejected", "pending"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    # Get challan
    challan = (
        db.query(Challan)
        .options(
            joinedload(Challan.violation).joinedload(Violation.evidence)
        )
        .filter(Challan.id == challan_id)
        .first()
    )

    if not challan:
        raise HTTPException(status_code=404, detail="Challan not found")

    # Update
    challan.status = review.status
    db.add(
        ReviewAction(
            challan_id=challan.id,
            reviewer_uid=decoded_token.get("uid", "unknown"),
            reviewer_email=decoded_token.get("email"),
            action=review.status,
            notes=review.notes,
        )
    )
    db.commit()
    db.refresh(challan)

    app_logger.info(f"Challan reviewed: {challan_id} → {review.status}")
    return serialize_challan(challan)


# ============================================================================
# ROUTES - ANALYTICS
# ============================================================================


@app.get("/api/analytics/summary", response_model=AnalyticsSummary, tags=["analytics"])
def get_analytics_summary(db: Session = Depends(get_db)):
    """Get analytics summary."""
    from sqlalchemy import func

    total_violations = db.query(func.count(Violation.id)).scalar() or 0
    pending = db.query(func.count(Challan.id)).filter(Challan.status == "pending").scalar() or 0
    approved = db.query(func.count(Challan.id)).filter(Challan.status == "approved").scalar() or 0
    rejected = db.query(func.count(Challan.id)).filter(Challan.status == "rejected").scalar() or 0

    return AnalyticsSummary(
        total_violations=total_violations,
        pending_challans=pending,
        approved_challans=approved,
        rejected_challans=rejected,
    )


# ============================================================================
# ROUTES - AI ANALYSIS (TRAFFIC GENIE)
# ============================================================================


@app.post("/api/analyze", tags=["analysis"])
def analyze_violations(
    request_data: dict,
    db: Session = Depends(get_db),
):
    """
    Traffic Genie AI analysis endpoint.
    Analyzes recent violations and answers officer queries.
    """
    try:
        prompt = request_data.get("prompt", "")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt required")

        # Get recent violations for context
        recent = (
            db.query(Violation)
            .order_by(Violation.detected_at.desc())
            .limit(15)
            .all()
        )

        # Build context
        violation_summary = "\n".join([
            f"• {v.violation_type} at {v.location} ({v.confidence}% conf, Plate: {v.plate})"
            for v in recent
        ])

        # Build enriched prompt with database context
        enriched_prompt = f"""You are TrafficGenie, an AI assistant for traffic officers in Nashik, India.

RECENT VIOLATIONS IN SYSTEM:
{violation_summary if violation_summary else "No violations recorded yet"}

OFFICER QUERY: {prompt}

Provide a concise, actionable response specific to traffic management. Be brief (2-3 sentences max) and data-driven. Consider only real violations from the database above."""

        # Get Gemini response
        if gemini_service.is_available():
            response = gemini_service.generate_constraint_response(enriched_prompt)
        else:
            # Fallback response if Gemini unavailable
            response = f"Traffic analysis for: {prompt}\n\nBased on {len(recent)} recent violations, officers should prioritize urgent cases and deploy resources accordingly."

        return {
            "analysis": response,
            "text": response,
            "suggestions": [
                "Review urgent violations",
                "Deploy to hotspot areas",
                "Check camera feeds",
            ]
        }

    except Exception as e:
        app_logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ============================================================================
# ROUTES - LIVE FEED
# ============================================================================


@app.get("/api/recent-violations", tags=["violations"])
def get_recent_violations(
    limit: int = Query(10, ge=1, le=50),
    minutes: int = Query(60, ge=1, le=1440),
    db: Session = Depends(get_db),
):
    """
    Get recent violations for live feed.
    Returns violations from the last N minutes.
    """
    from datetime import timedelta
    from sqlalchemy import func

    cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)

    violations = (
        db.query(Violation)
        .filter(Violation.detected_at >= cutoff_time)
        .order_by(Violation.detected_at.desc())
        .limit(limit)
        .all()
    )

    # Map violation types to emojis
    emoji_map = {
        "No Helmet": "🪖",
        "Signal Jump": "🚦",
        "Triple Riding": "👥",
        "Wrong Lane": "🚗",
        "Zebra Crossing": "🦺",
        "Speeding": "⚡",
        "No License Plate": "🔲",
        "Mobile Use": "📱",
    }

    # Map violation types to Hindi names
    hindi_map = {
        "No Helmet": "बिना हेलमेट",
        "Signal Jump": "सिग्नल उल्लंघन",
        "Triple Riding": "तीन सवारी",
        "Wrong Lane": "गलत लेन",
        "Zebra Crossing": "ज़ेब्रा क्रॉसिंग",
        "Speeding": "तेज़ गति",
        "No License Plate": "नंबर प्लेट नहीं",
        "Mobile Use": "मोबाइल उपयोग",
    }

    # Determine violation status based on recency
    def get_status(detected_at):
        age_minutes = (datetime.utcnow() - detected_at).total_seconds() / 60
        if age_minutes < 10:
            return "urgent"
        elif age_minutes < 30:
            return "active"
        else:
            return "resolved"

    result = []
    for v in violations:
        result.append({
            "id": v.id,
            "emoji": emoji_map.get(v.violation_type, "📍"),
            "type": v.violation_type,
            "type_h": hindi_map.get(v.violation_type, "उल्लंघन"),
            "loc": v.location,
            "city": "Nashik",
            "cam": v.camera.code if v.camera else "CAM-XX",
            "pct": v.confidence,
            "status": get_status(v.detected_at),
            "detected_at": v.detected_at,
        })

    return result


# ============================================================================
# ROUTES - VIDEO PROCESSING
# ============================================================================


@app.post("/api/videos/process", tags=["detection"])
def process_video(
    video_file: UploadFile = File(...),
    camera_code: str = Query("CAM-01"),
    db: Session = Depends(get_db),
):
    """
    Process uploaded video for violation detection.
    Stores frame captures and violations in database.
    """
    try:
        # Save uploaded file
        file_path = os.path.join(settings.UPLOAD_DIR, video_file.filename)
        with open(file_path, "wb") as f:
            f.write(video_file.file.read())

        app_logger.info(f"Video uploaded: {file_path}")

        # Process video
        processor = get_processor()
        result = processor.process_video(file_path, camera_code=camera_code)

        if result.get("success"):
            return {
                "success": True,
                "message": f"Processed {result['violations_detected']} violations",
                "frames_processed": result["frames_processed"],
                "violations_detected": result["violations_detected"],
                "camera_code": camera_code,
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Processing failed"))

    except Exception as e:
        app_logger.error(f"Video processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Video processing failed: {str(e)}")


# ============================================================================
# BACKWARD COMPATIBILITY ALIASES
# ============================================================================


@app.get("/challans", response_model=list[ChallanOut])
def legacy_get_challans(status: str | None = None, db: Session = Depends(get_db)):
    """Legacy endpoint - use GET /api/challans instead."""
    return list_challans(status=status, ward=None, page=1, page_size=100, db=db)


@app.post("/challans/{challan_id}/review", response_model=ChallanOut)
def legacy_review_challan(
    challan_id: int,
    review: ChallanReview,
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
):
    """Legacy endpoint - use POST /api/challans/{id}/review instead."""
    return review_challan(
        challan_id=challan_id,
        review=review,
        decoded_token=decoded_token,
        db=db,
    )


# ============================================================================
# STARTUP
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower(),
    )
