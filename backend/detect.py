from ultralytics import YOLO
import cv2
import os
from violation_logic import detect_triple_riding

# ----------------------------
# Setup
# ----------------------------
model = YOLO("yolov8n.pt")  # auto-downloads if not present

VIDEO_PATH = "data/traffic.mp4"
OUTPUT_DIR = "data/output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)

# ----------------------------
# Main Loop
# ----------------------------
frame_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1

    # Run YOLO
    results = model(frame, show=False)
    annotated_frame = results[0].plot()

    boxes = results[0].boxes

    persons = []
    bikes = []

    # ----------------------------
    # Extract detections
    # ----------------------------
    for box in boxes:
        cls = int(box.cls[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        label = model.names[cls]

        if label == "person":
            persons.append((x1, y1, x2, y2))
        elif label == "motorcycle":
            bikes.append((x1, y1, x2, y2))

    # ----------------------------
    # Detect Triple Riding
    # ----------------------------
    violations = detect_triple_riding(persons, bikes)

    for violation in violations:
        bx1, by1, bx2, by2 = violation["bike_box"]
        rider_count = violation["rider_count"]

        # Violation
        if rider_count >= 3:
            cv2.putText(
                annotated_frame,
                f"TRIPLE RIDING ({rider_count})",
                (bx1, by1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 0, 255),
                3
            )

            print(f"[ALERT] Triple riding detected at frame {frame_count}")

            # Save violation frame
            filename = os.path.join(
                OUTPUT_DIR, f"violation_{frame_count}.jpg"
            )
            cv2.imwrite(filename, annotated_frame)

    # ----------------------------
    # Display
    # ----------------------------
    cv2.imshow("Traffic Violation Detection", annotated_frame)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# ----------------------------
# Cleanup
# ----------------------------
cap.release()
cv2.destroyAllWindows()