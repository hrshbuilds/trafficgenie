"""
Process video and save violations to parth folder.
"""
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

# First ensure dependencies are installed
def ensure_dependencies():
    try:
        import cv2
        from ultralytics import YOLO
    except ImportError:
        import subprocess
        print("Installing required packages...")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-q',
            'opencv-python', 'ultralytics', 'torch', 'torchvision'
        ])

ensure_dependencies()

import cv2
from ultralytics import YOLO

from config import settings
from fastapi_db import SessionLocal
from fastapi_models import Camera, Violation, Evidence, Challan, Zone
from violation_logic import detect_triple_riding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
INPUT_VIDEO = Path("data/input/trafficgenie_testingvideo.mp4")
OUTPUT_PARTH = Path("data/output/parth")
MODEL_PATH = Path("models/yolov8n.pt")

OUTPUT_PARTH.mkdir(exist_ok=True, parents=True)


def process_video_to_parth():
    """Process video and save violations to parth folder."""
    
    if not INPUT_VIDEO.exists():
        logger.error(f"Video not found: {INPUT_VIDEO}")
        return {"success": False, "error": "Video not found"}
    
    if not MODEL_PATH.exists():
        logger.error(f"Model not found: {MODEL_PATH}")
        return {"success": False, "error": "Model not found"}
    
    try:
        # Load model
        logger.info(f"Loading YOLO model from {MODEL_PATH}")
        model = YOLO(str(MODEL_PATH))
        logger.info("YOLO model loaded successfully")
        
        # Open video
        logger.info(f"Opening video: {INPUT_VIDEO}")
        cap = cv2.VideoCapture(str(INPUT_VIDEO))
        
        if not cap.isOpened():
            logger.error("Failed to open video")
            return {"success": False, "error": "Failed to open video"}
        
        frame_count = 0
        violations_count = 0
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_skip = max(1, int(fps // 5))  # Process 5 frames per second
        violations_data = []
        
        # Get or create database session
        db = SessionLocal()
        
        # Get or create camera
        camera = db.query(Camera).filter(Camera.code == "CAM-01").first()
        if not camera:
            logger.warning("CAM-01 not found, creating default zone and camera")
            zone = Zone(name="Default Zone", city="Default")
            db.add(zone)
            db.flush()
            camera = Camera(code="CAM-01", location="Default Location", ward="Default Ward", zone_id=zone.id)
            db.add(camera)
            db.flush()
        
        logger.info(f"Processing video (Camera: {camera.code})")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Skip frames for efficiency
            if frame_count % frame_skip != 0:
                continue
            
            logger.info(f"Processing frame {frame_count}")
            
            # Run YOLO detection
            results = model(frame, verbose=False)
            boxes = results[0].boxes
            
            persons = []
            bikes = []
            
# Extract detections with lower confidence threshold for this dataset
            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                label = model.names[cls].lower()

                if conf < 0.25:
                    continue

                if label in {"person", "rider"}:
                    persons.append((x1, y1, x2, y2))
                elif label in {"motorcycle", "motorbike", "bike"}:
                    bikes.append((x1, y1, x2, y2))
            
            # Detect triple riding
            violations = detect_triple_riding(persons, bikes)
            
            for violation in violations:
                # Save frame to parth folder
                frame_name = f"violation_frame_{frame_count}.jpg"
                frame_path = OUTPUT_PARTH / frame_name
                cv2.imwrite(str(frame_path), frame)
                logger.info(f"Saved violation frame: {frame_path}")
                
                # Create violation record in DB
                db_violation = Violation(
                    violation_type="Triple Riding",
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
                image_url = f"http://localhost:8000/images/parth/{frame_name}"
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
                
                # Store violation data for JSON
                violations_data.append({
                    "frame": frame_count,
                    "type": "Triple Riding",
                    "confidence": 85.0,
                    "image": frame_name,
                    "timestamp": datetime.utcnow().isoformat(),
                    "location": camera.location,
                    "ward": camera.ward,
                    "zone": camera.zone.name if camera.zone else "Unknown",
                })
                
                violations_count += 1
                logger.info(f"Violation detected at frame {frame_count}: Triple Riding")
        
        cap.release()
        db.commit()
        
        # Get camera code before closing session
        camera_code = camera.code
        camera_location = camera.location
        camera_zone = camera.zone.name if camera.zone else "Unknown"
        
        db.close()
        
        # Save violations summary to JSON
        summary = {
            "total_frames_processed": frame_count,
            "total_violations": violations_count,
            "video": str(INPUT_VIDEO),
            "camera": camera_code,
            "violations": violations_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        summary_path = OUTPUT_PARTH / "violations_summary.json"
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Saved summary to: {summary_path}")
        logger.info(f"Video processing complete: {violations_count} violations detected")
        
        return {
            "success": True,
            "frames_processed": frame_count,
            "violations_detected": violations_count,
            "output_folder": str(OUTPUT_PARTH),
            "summary_file": str(summary_path),
        }
    
    except Exception as e:
        logger.error(f"Error processing video: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
        }


if __name__ == "__main__":
    result = process_video_to_parth()
    print("\n" + "="*60)
    print("PROCESSING RESULT")
    print("="*60)
    for key, value in result.items():
        print(f"{key}: {value}")
    print("="*60)
    
    # List files in parth folder
    print("\nFiles in parth folder:")
    for file in OUTPUT_PARTH.glob("*"):
        print(f"  - {file.name}")
