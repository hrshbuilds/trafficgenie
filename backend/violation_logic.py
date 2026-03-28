"""Core violation logic helpers used by video processing services."""

from __future__ import annotations

from typing import Iterable, List, Sequence


def _normalize_box(box: Sequence[int]) -> tuple[int, int, int, int]:
    """Normalize a bbox into an integer `(x1, y1, x2, y2)` tuple."""
    x1, y1, x2, y2 = map(int, box[:4])
    if x1 > x2:
        x1, x2 = x2, x1
    if y1 > y2:
        y1, y2 = y2, y1
    return x1, y1, x2, y2


def is_person_on_bike(
    person_box: Sequence[int],
    bike_box: Sequence[int],
    x_margin_ratio: float = 0.18,
    y_margin_ratio: float = 0.30,
) -> bool:
    """Return True if a person's centroid falls in (expanded) bike region.

    The region is slightly expanded to handle detector jitter and imperfect
    alignment between person/motorcycle boxes.
    """
    px1, py1, px2, py2 = _normalize_box(person_box)
    bx1, by1, bx2, by2 = _normalize_box(bike_box)

    cx = (px1 + px2) // 2
    cy = (py1 + py2) // 2

    bw = max(1, bx2 - bx1)
    bh = max(1, by2 - by1)
    x_margin = int(bw * x_margin_ratio)
    y_margin = int(bh * y_margin_ratio)

    return (
        (bx1 - x_margin) <= cx <= (bx2 + x_margin)
        and (by1 - y_margin) <= cy <= (by2 + y_margin)
    )


def detect_triple_riding(
    persons: Iterable[Sequence[int]],
    bikes: Iterable[Sequence[int]],
) -> List[dict]:
    """Detect triple-riding violations from lists of detected boxes."""
    violations: List[dict] = []
    person_boxes = [_normalize_box(person_box) for person_box in persons]

    for bike_box in bikes:
        bike = _normalize_box(bike_box)
        riders_on_bike = [
            person_box for person_box in person_boxes if is_person_on_bike(person_box, bike)
        ]

        if len(riders_on_bike) >= 3:
            violations.append(
                {
                    "bike_box": bike,
                    "rider_count": len(riders_on_bike),
                    "riders": riders_on_bike,
                }
            )

    return violations
