import cv2
import os
import uuid
from ultralytics import YOLO
from django.conf import settings
from .violation_service import detect_violations, is_person_on_bike, check_helmet

class VideoProcessor:
    def __init__(self, model_path, helmet_model_path=None):
        """
        Initializes YOLO models for general and helmet detection.
        - model_path: Main YOLO model (e.g., yolov8n.pt) for persons and bikes.
        - helmet_model_path: Specialized YOLO model for helmets. If not provided,
          it will use the main model for a placeholder check.
        """
        self.model = YOLO(model_path)
        # Use main model as helmet model if no specialized one provided
        self.helmet_model = YOLO(helmet_model_path) if helmet_model_path else self.model
        
    def process_video(self, video_path, frame_skip=5, confidence_threshold=0.5):
        """
        Processes a video file and detects traffic violations.
        - frame_skip: Skip every N frames to speed up processing.
        - confidence_threshold: Confidence for general YOLO detections.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "Could not open video file."}

        total_violations = 0
        triple_riding_count = 0
        no_helmet_count = 0
        processed_violations = [] # Detailed info
        saved_images = [] # Relative paths for API response

        output_dir = os.path.join(settings.MEDIA_ROOT, 'output')
        os.makedirs(output_dir, exist_ok=True)

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_skip != 0:
                frame_idx += 1
                continue

            # Run detection
            results = self.model(frame, conf=confidence_threshold, verbose=False)
            boxes = results[0].boxes
            
            persons = []
            bikes = []
            
            # Extract classes (0: person, 3: motorcycle in standard COCO)
            # Use model.names if needed for more robustness
            for box in boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls].lower()
                bbox = map(int, box.xyxy[0])
                bbox = list(bbox)
                
                if label == "person":
                    persons.append(bbox)
                elif label == "motorcycle" or label == "motorcycle":
                    bikes.append(bbox)

            # Check for violations
            # 1. Triple Riding
            for bike in bikes:
                riders_on_this_bike = [p for p in persons if is_person_on_bike(p, bike)]
                
                # Violation: Triple Riding
                if len(riders_on_this_bike) >= 3:
                    triple_riding_count += 1
                    image_url = self._save_violation_frame(frame, bike, results[0], "triple_riding", frame_idx)
                    saved_images.append(image_url)
                
                # 2. Helmet Detection for each rider
                for rider in riders_on_this_bike:
                    # Specialized helmet detection logic
                    has_helmet = check_helmet(frame, rider, self.helmet_model)
                    if not has_helmet:
                        no_helmet_count += 1
                        # Save frame (limit to avoid redundant saves if multiple on same bike)
                        if frame_idx % (frame_skip * 3) == 0: # Only save every few frames for helmet
                             image_url = self._save_violation_frame(frame, rider, results[0], "no_helmet", frame_idx)
                             saved_images.append(image_url)

            frame_idx += 1

        cap.release()
        
        # Deduplicate images if needed
        saved_images = sorted(list(set(saved_images)))
        
        return {
            "total_violations": triple_riding_count + no_helmet_count,
            "triple_riding": triple_riding_count,
            "no_helmet": no_helmet_count,
            "images": [f"{settings.MEDIA_URL}output/{img}" for img in saved_images]
        }

    def _save_violation_frame(self, frame, target_box, results_plot, v_type, frame_idx):
        """Saves the frame with annotations and returns the filename."""
        # For simplicity, we save the annotated frame from the general model
        annotated_frame = results_plot.plot()
        
        # Draw additional alert if needed
        x1, y1, x2, y2 = target_box
        label = v_type.upper().replace('_', ' ')
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(annotated_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        filename = f"{v_type}_{uuid.uuid4().hex[:8]}_{frame_idx}.jpg"
        filepath = os.path.join(settings.MEDIA_ROOT, 'output', filename)
        cv2.imwrite(filepath, annotated_frame)
        return filename
