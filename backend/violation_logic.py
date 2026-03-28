def is_person_on_bike(person_box, bike_box):
    px1, py1, px2, py2 = person_box
    bx1, by1, bx2, by2 = bike_box

    cx = (px1 + px2) // 2
    cy = (py1 + py2) // 2

    return bx1 < cx < bx2 and by1 < cy < by2


def does_person_have_helmet(person_box, helmets):
    px1, py1, px2, py2 = person_box

    # helmet region is typically above the head (upper part of person box)
    # we consider any helmet box that overlaps with the top quarter of the person box
    head_top = py1
    head_bottom = py1 + (py2 - py1) * 0.35

    for helmet_box in helmets:
        hx1, hy1, hx2, hy2 = helmet_box
        if hx1 < px2 and hx2 > px1 and hy1 < head_bottom and hy2 > head_top:
            return True

    return False


def detect_triple_riding(persons, bikes):
    violations = []

    for bike_box in bikes:
        rider_count = 0

        for person_box in persons:
            if is_person_on_bike(person_box, bike_box):
                rider_count += 1

        if rider_count >= 3:
            violations.append({
                "bike_box": bike_box,
                "rider_count": rider_count,
                "type": "Triple Riding",
            })

    return violations


def detect_no_helmet(persons, bikes, helmets):
    violations = []

    for bike_box in bikes:
        for person_box in persons:
            if not is_person_on_bike(person_box, bike_box):
                continue

            if not does_person_have_helmet(person_box, helmets):
                violations.append({
                    "bike_box": bike_box,
                    "person_box": person_box,
                    "type": "No Helmet",
                })

    return violations


def detect_wrong_side(vehicles, frame_width, direction="right"):
    violations = []

    left_zone = frame_width * 0.35
    right_zone = frame_width * 0.65

    for vehicle_box in vehicles:
        x1, y1, x2, y2 = vehicle_box
        cx = (x1 + x2) / 2

        if direction == "right" and cx < left_zone:
            violations.append({
                "vehicle_box": vehicle_box,
                "type": "Wrong Side",
            })
        elif direction == "left" and cx > right_zone:
            violations.append({
                "vehicle_box": vehicle_box,
                "type": "Wrong Side",
            })

    return violations
