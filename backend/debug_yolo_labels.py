from ultralytics import YOLO
import cv2

MODEL_PATH = 'models/yolov8n.pt'
VIDEO_PATH = 'data/input/trafficgenie_testingvideo.mp4'

model = YOLO(MODEL_PATH)
cap = cv2.VideoCapture(VIDEO_PATH)

print('Using model:', MODEL_PATH)
print('Video:', VIDEO_PATH)

for frame_i in range(1, 33):
    ret, frame = cap.read()
    if not ret:
        break
    if frame_i % 4 != 0:
        continue

    results = model(frame, conf=0.25, verbose=False)
    if not results:
        print(f'frame {frame_i}: no detections')
        continue

    boxes = results[0].boxes
    detections = []
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        label = model.names.get(cls, 'unknown')
        detections.append((label, conf, (x1, y1, x2, y2)))

    print(f'frame {frame_i}: {len(detections)} detections')
    for d in detections:
        print('  ', d)

cap.release()
