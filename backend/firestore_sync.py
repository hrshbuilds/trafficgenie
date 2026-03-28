"""
Firestore sync utility for TrafficGenie.
Syncs local database violations to Firestore.
"""
import sys
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi_db import SessionLocal
from fastapi_models import Violation, Evidence, Challan
from services.firebase_service import firebase_service
from core.logger import get_logger

logger = get_logger(__name__)


def sync_violations_to_firestore(batch_size: int = 10):
    """Sync all violations from local database to Firestore."""
    db = SessionLocal()
    try:
        # Check if Firebase is available
        if not firebase_service._db:
            print("❌ Firebase not initialized. Please check your credentials.\n")
            return
        
        print("\n🔄 Syncing violations to Firestore...\n")
        
        violations = db.query(Violation).all()
        total = len(violations)
        
        if total == 0:
            print("⚠️  No violations found in database.\n")
            return
        
        synced = 0
        
        for violation in violations:
            try:
                # Get evidence
                evidence = db.query(Evidence).filter(
                    Evidence.violation_id == violation.id
                ).first()
                
                # Get challan
                challan = db.query(Challan).filter(
                    Challan.violation_id == violation.id
                ).first()
                
                # Prepare violation data for Firestore
                violation_data = {
                    "id": violation.id,
                    "type": violation.violation_type,
                    "plate": violation.plate,
                    "confidence": violation.confidence,
                    "detected_at": violation.detected_at,
                    "location": violation.location,
                    "ward": violation.ward,
                    "zone": violation.zone,
                    "model_version": violation.model_version,
                    "camera_id": violation.camera_id,
                    "created_at": datetime.utcnow(),
                }
                
                # Add evidence
                if evidence:
                    violation_data["evidence"] = {
                        "id": evidence.id,
                        "image_url": evidence.image_url,
                        "frame_ref": evidence.frame_ref,
                    }
                
                # Add challan
                if challan:
                    violation_data["challan"] = {
                        "id": challan.id,
                        "status": challan.status,
                        "fine": challan.fine,
                        "created_at": challan.created_at,
                    }
                
                # Save to Firestore
                firebase_service.save_violation(violation_data)
                synced += 1
                
                # Show progress
                if synced % batch_size == 0:
                    print(f"✅ Synced {synced}/{total} violations...")
            
            except Exception as e:
                print(f"⚠️  Failed to sync violation {violation.id}: {str(e)}")
                continue
        
        print(f"\n✅ Sync complete! {synced}/{total} violations synced to Firestore\n")
    
    except Exception as e:
        logger.error(f"Firestore sync failed: {str(e)}")
        print(f"❌ Sync failed: {str(e)}\n")
    
    finally:
        db.close()


def verify_firestore_connection():
    """Verify Firestore connection."""
    print("\n🔍 Verifying Firestore connection...\n")
    
    if firebase_service._db:
        try:
            # Try to read a test document
            test_doc = firebase_service._db.collection("violations").limit(1).get()
            count = len(list(test_doc))
            print(f"✅ Firestore connected successfully!")
            print(f"   Documents in violations collection: {count}\n")
            return True
        except Exception as e:
            print(f"❌ Firestore connection failed: {str(e)}\n")
            return False
    else:
        print("❌ Firebase not initialized\n")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("""
🗄️  TrafficGenie Firestore Sync

Usage:
  python firestore_sync.py [command]

Commands:
  verify  - Verify Firestore connection
  sync    - Sync violations to Firestore
  
Example:
  python firestore_sync.py verify
  python firestore_sync.py sync
        """)
    else:
        command = sys.argv[1].lower()
        
        if command == "verify":
            verify_firestore_connection()
        elif command == "sync":
            verify_firestore_connection()
            sync_violations_to_firestore()
        else:
            print(f"❌ Unknown command: {command}")
