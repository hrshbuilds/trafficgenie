"""
Shared YOLO utility helpers.
"""


def resolve_label(names, class_id: int) -> str:
    """Resolve YOLO class label from ``names`` payload.

    YOLO can return ``names`` as a dict, list, or tuple depending on model/runtime.
    This helper keeps label resolution backward-compatible across versions.

    Args:
        names: YOLO model ``names`` attribute (dict, list, or tuple).
        class_id: Integer class index from a detection box.

    Returns:
        Lowercase-safe string label, or ``"unknown"`` when not resolvable.
    """
    if isinstance(names, dict):
        return str(names.get(class_id, "unknown"))
    if isinstance(names, (list, tuple)) and 0 <= class_id < len(names):
        return str(names[class_id])
    return "unknown"
