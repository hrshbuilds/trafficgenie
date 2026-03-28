"""
Database management utility for TrafficGenie.
Provides functions to view, reseed, and manage database content.
"""
import sys
from sqlalchemy.orm import Session
from fastapi_db import SessionLocal, engine, Base
from fastapi_models import Zone, Camera, Violation, Challan, Evidence
from seeds import seed_database_comprehensive
from core.logger import get_logger

logger = get_logger(__name__)


def count_records():
    """Count and display all records in database."""
    db = SessionLocal()
    try:
        zones = db.query(Zone).count()
        cameras = db.query(Camera).count()
        violations = db.query(Violation).count()
        challans = db.query(Challan).count()
        evidence = db.query(Evidence).count()
        
        print("\n" + "="*60)
        print("📊 DATABASE STATISTICS")
        print("="*60)
        print(f"  Zones:       {zones}")
        print(f"  Cameras:     {cameras}")
        print(f"  Violations:  {violations}")
        print(f"  Challans:    {challans}")
        print(f"  Evidence:    {evidence}")
        print("="*60 + "\n")
        
        return {
            "zones": zones,
            "cameras": cameras,
            "violations": violations,
            "challans": challans,
            "evidence": evidence,
        }
    finally:
        db.close()


def clear_database():
    """Clear all data from database."""
    print("\n⚠️  Clearing database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Database cleared and recreated.\n")


def reseed_database():
    """Clear and reseed database with new data."""
    print("\n🔄 Reseeding database...")
    clear_database()
    
    db = SessionLocal()
    try:
        seed_database_comprehensive(db)
        logger.info("✅ Database reseeded successfully")
        print("✅ Database reseeded with new violations!\n")
        count_records()
    finally:
        db.close()


def view_recent_violations(limit=10):
    """Display recent violations."""
    db = SessionLocal()
    try:
        violations = db.query(Violation)\
            .order_by(Violation.detected_at.desc())\
            .limit(limit)\
            .all()
        
        print("\n" + "="*80)
        print(f"📋 RECENT VIOLATIONS (Last {limit})")
        print("="*80)
        
        for i, v in enumerate(violations, 1):
            print(f"\n{i}. ID: {v.id}")
            print(f"   Type:       {v.violation_type}")
            print(f"   Vehicle:    {v.plate}")
            print(f"   Confidence: {v.confidence}%")
            print(f"   Location:   {v.location}")
            print(f"   Detected:   {v.detected_at}")
        
        print("\n" + "="*80 + "\n")
    finally:
        db.close()


def view_cameras():
    """Display all cameras."""
    db = SessionLocal()
    try:
        cameras = db.query(Camera).all()
        
        print("\n" + "="*80)
        print("📹 CAMERAS")
        print("="*80)
        
        for cam in cameras:
            print(f"\n  {cam.id} - {cam.location}")
            print(f"    Status: {cam.status}")
        
        print("\n" + "="*80 + "\n")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("""
🗄️  TrafficGenie Database Management

Usage:
  python db_management.py [command]

Commands:
  status      - Show database statistics
  view        - View recent violations and cameras
  reseed      - Clear and reseed database with new data
  
Example:
  python db_management.py status
        """)
    else:
        command = sys.argv[1].lower()
        
        if command == "status":
            count_records()
        elif command == "view":
            count_records()
            view_cameras()
            view_recent_violations(15)
        elif command == "reseed":
            reseed_database()
        else:
            print(f"❌ Unknown command: {command}")
