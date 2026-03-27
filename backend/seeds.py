"""
Seed data generation for TrafficVision demo database.
Generates realistic traffic violations with varied types, locations, and times.
"""
from datetime import datetime, timedelta
from random import choice, randint, uniform
from sqlalchemy.orm import Session

from fastapi_db import engine, Base
from fastapi_models import Camera, Challan, Evidence, Violation, Zone
from config import settings
from core.logger import get_logger

logger = get_logger(__name__)

# ============================================================================
# DATA DEFINITIONS
# ============================================================================

VIOLATION_TYPES = [
    "No Helmet",
    "Signal Jump",
    "Triple Riding",
    "Wrong Lane",
    "Zebra Crossing",
    "Speeding",
    "No License Plate",
    "Mobile Use",
]

NASHIK_LOCATIONS = [
    ("CAM-01", "Sadar Junction", "Sadar"),
    ("CAM-02", "Central Bus Stand", "Sadar"),
    ("CAM-03", "Panchavati Circle", "Panchavati"),
    ("CAM-04", "MG Road Signal", "MG Road"),
    ("CAM-05", "Jail Road Cross", "Cantonment"),
    ("CAM-06", "Gangapur Road Flyover", "Gangapur Road"),
    ("CAM-07", "College Road Junction", "College Road"),
    ("CAM-08", "Old Nashik Road", "Old Nashik"),
    ("CAM-09", "Upnagar Chowk", "Upnagar"),
    ("CAM-10", "Nashik Road Station", "Nashik Road"),
]

VEHICLE_PLATES = [
    "MH-15-AB-",
    "MH-15-AC-",
    "MH-15-AD-",
    "MH-15-AE-",
    "MH-15-AF-",
]


# ============================================================================
# SEEDING FUNCTIONS
# ============================================================================


def generate_sample_plate():
    """Generate realistic vehicle plate."""
    return f"{choice(VEHICLE_PLATES)}{randint(1000, 9999)}"


def create_zone(db: Session, name: str = "Nashik Zone", city: str = "Nashik"):
    """Create or get zone."""
    existing = db.query(Zone).filter(Zone.name == name).first()
    if existing:
        return existing
    
    zone = Zone(name=name, city=city)
    db.add(zone)
    db.flush()
    return zone


def create_cameras(db: Session, zone: Zone):
    """Create all camera locations."""
    cameras_map = {}
    
    for code, location, ward in NASHIK_LOCATIONS:
        existing = db.query(Camera).filter(Camera.code == code).first()
        if existing:
            cameras_map[code] = existing
        else:
            camera = Camera(
                code=code,
                location=location,
                ward=ward,
                zone_id=zone.id,
                status="online",
            )
            db.add(camera)
            db.flush()
            cameras_map[code] = camera
    
    return cameras_map


def create_violation(
    db: Session,
    camera: Camera,
    violation_type: str = None,
    offset_hours: int = 0,
):
    """Create a single violation."""
    if violation_type is None:
        violation_type = choice(VIOLATION_TYPES)

    violation = Violation(
        violation_type=violation_type,
        plate=generate_sample_plate(),
        confidence=round(uniform(75, 99), 1),
        detected_at=datetime.utcnow() - timedelta(hours=offset_hours, minutes=randint(0, 59)),
        location=camera.location,
        ward=camera.ward,
        zone=camera.zone.name,
        model_version="yolov8n",
        camera_id=camera.id,
    )
    db.add(violation)
    db.flush()

    # Add evidence (mock image URL)
    image_name = f"violation_{violation.id}.jpg"
    image_url = f"http://localhost:8000/images/{image_name}"
    if settings.ENV != "development":
        image_url = f"https://storage.googleapis.com/trafficvision-prod/{image_name}"

    evidence = Evidence(
        violation_id=violation.id,
        image_url=image_url,
        frame_ref=f"frame_{randint(1000, 9999)}",
    )
    db.add(evidence)
    db.flush()

    # Create challan
    challan = Challan(
        violation_id=violation.id,
        status=choice(["pending", "pending", "approved", "rejected"]),  # More pending by default
        fine=choice([500, 1000, 1500, 2000, 2500]),
    )
    db.add(challan)
    db.flush()

    return violation


def seed_database_comprehensive(db: Session):
    """Seed database with comprehensive demo data."""
    try:
        # Create zone
        zone = create_zone(db)
        logger.info(f"Zone ready: {zone.name}")

        # Create cameras
        cameras = create_cameras(db, zone)
        logger.info(f"Created/verified {len(cameras)} cameras")

        # Create 50+ violations over past 12 hours
        cameras_list = list(cameras.values())
        
        for hour_offset in range(0, 13):
            # 4-5 violations per hour
            for _ in range(randint(4, 5)):
                camera = choice(cameras_list)
                create_violation(db, camera, offset_hours=hour_offset)

        db.commit()
        logger.info("✓ Database seeded with 50+ realistic violations")
        return True

    except Exception as e:
        logger.error(f"Seed error: {e}")
        db.rollback()
        return False


def seed_database_if_empty(db: Session):
    """Seed database only if it's empty."""
    if db.query(Violation).count() == 0:
        logger.info("Database empty, seeding...")
        seed_database_comprehensive(db)
    else:
        logger.info(f"Database already has {db.query(Violation).count()} violations")
