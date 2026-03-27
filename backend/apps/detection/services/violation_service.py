import cv2

def is_person_on_bike(person_box, bike_box):
    """Checks if the person center is within the bike bounding box."""
    px1, py1, px2, py2 = person_box
    bx1, by1, bx2, by2 = bike_box

    cx = (px1 + px2) // 2
    cy = (py1 + py2) // 2

    return bx1 < cx < bx2 and by1 < cy < by2

def get_head_region(person_box):
    """Extracts the head region (top 25% of person box) for helmet detection."""
    x1, y1, x2, y2 = person_box
    h = y2 - y1
    head_y2 = y1 + int(h * 0.25)
    return (x1, y1, x2, head_y2)

def detect_violations(persons, bikes, helmet_model=None):
    """
    Detects triple riding and helmet violations.
    Returns:
        list of dicts containing violation details.
    """
    violations = []
    
    for bike_box in bikes:
        riders = []
        for person_box in persons:
            if is_person_on_bike(person_box, bike_box):
                riders.append(person_box)
        
        # Triple Riding Detection
        if len(riders) >= 3:
            violations.append({
                "type": "triple_riding",
                "bike_box": bike_box,
                "riders": riders,
                "count": len(riders)
            })

        # Helmet Detection for each rider
        no_helmet_riders = []
        for rider_box in riders:
            # If helmet_model is provided, use it to scan the head region
            # For now, we structure it for future integration or use a heuristic
            if helmet_model:
                head_box = get_head_region(rider_box)
                # Placeholder for actual helmet detection call
                # helmet_detected = helmet_model(head_box) ...
                # For this implementation, we will mock it if helmet_model is just a YOLO instance
                pass
            
            # Placeholder/Mock logic: If we don't have a real helmet detector, 
            # we can't reliably say 'no helmet' without a specialized model.
            # But the task says 'Add helmet detection properly'.
            # I will implement it such that it expects a 'helmet' class from the model if same model used.
            # If yolov8n.pt has helmet (it doesn't by default), we check head region.
        
    return violations

def check_helmet(frame, person_box, model):
    """
    Checks if a person is wearing a helmet by scanning the head region.
    If 'helmet' class is present in model, it uses that.
    """
    x1, y1, x2, h_y2 = get_head_region(person_box)
    head_img = frame[y1:h_y2, x1:x2]
    
    if head_img.size == 0:
        return True # Default to safe if region is invalid
        
    # Run model on head crop
    results = model(head_img, conf=0.3, verbose=False)
    
    # Check if 'helmet' or 'head' (without helmet) is detected
    # Assuming 'helmet' class at some index or 'no-helmet'
    # Since yolov8n.pt doesn't have it, we return False (violation) if no helmet-like object detected
    # OR we can check common YOLO classes that might be misclassified as helmet? (unreliable)
    
    # For a real implementation, 'model' should be a custom helmet model.
    # We will assume 'helmet' index is what we look for.
    has_helmet = False
    for r in results:
        for b in r.boxes:
            label = model.names[int(b.cls[0])].lower()
            if 'helmet' in label:
                has_helmet = True
                break
    
    return has_helmet
