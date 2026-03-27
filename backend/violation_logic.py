def is_person_on_bike(person_box, bike_box):
	px1, py1, px2, py2 = person_box
	bx1, by1, bx2, by2 = bike_box

	cx = (px1 + px2) // 2
	cy = (py1 + py2) // 2

	return bx1 < cx < bx2 and by1 < cy < by2


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
			})

	return violations
