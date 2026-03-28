"""
TrafficGenie Edge Simulator
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Simulates a Raspberry Pi edge device with a YOLOv8 camera
sending live traffic violation detections to the backend.

Usage:
    python edge_simulator.py                    # scan ./sample_images/
    python edge_simulator.py --frames 20        # generate 20 synthetic frames
    python edge_simulator.py --delay 1          # 1 second between frames
"""

import argparse
import os
import random
import sys
import time
from datetime import datetime

try:
    import requests
except ImportError:
    print("[EDGE] ✗ 'requests' not installed. Run: pip install requests")
    sys.exit(1)


# ============================================================================
# CONFIGURATION
# ============================================================================

API_BASE = "http://localhost:8000"
DETECT_ENDPOINT = f"{API_BASE}/api/detect"
CHALLANS_ENDPOINT = f"{API_BASE}/api/challans"
HEALTH_ENDPOINT = f"{API_BASE}/health"

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_images")

# Violation types matching TrafficGenie's seed data
VIOLATION_TYPES = [
    "No Helmet",
    "Signal Jump",
    "Triple Riding",
    "Wrong Lane",
    "Zebra Crossing",
    "Speeding",
    "No License Plate",
    "Mobile Use",
]

# Weighted probabilities (No Helmet & Triple Riding more common)
VIOLATION_WEIGHTS = [25, 15, 20, 10, 5, 10, 5, 10]

# Nashik camera locations matching the backend seed data
CAMERAS = [
    ("CAM-01", "Sadar Junction", "Sadar"),
    ("CAM-02", "Central Bus Stand", "Sadar"),
    ("CAM-03", "Panchavati Circle", "Panchavati"),
    ("CAM-04", "MG Road Signal", "MG Road"),
    ("CAM-05", "Jail Road Cross", "Cantonment"),
    ("CAM-06", "Gangapur Road Flyover", "Gangapur Road"),
    ("CAM-07", "College Road Junction", "College Road"),
    ("CAM-08", "Old Nashik Road", "Old Nashik"),
    ("CAM-09", "Upnagar Chowk", "Upnagar"),
    ("CAM-10", "Nashik Road Station", "Nashik Road"),
]

# MH-15 Nashik plate prefixes
PLATE_PREFIXES = ["AB", "AC", "AD", "AE", "AF", "AK", "AL", "AM",
                  "AN", "AP", "AQ", "AR", "AS", "AT", "AU", "AV",
                  "AW", "AX", "AY", "AZ", "BA", "BB", "BC", "BD",
                  "BE", "BF", "BG", "BH", "BJ", "BK", "BL", "BM",
                  "BN", "BP", "BQ", "BR", "BS", "BT", "BU", "BV",
                  "CA", "CB", "CC", "CD", "CE", "CF", "CG", "CH",
                  "CJ", "CK", "DA", "DB", "DC", "DD", "DE", "DF",
                  "DG", "DH", "DJ", "DK", "EA", "EB", "EC", "ED",
                  "EE", "EF", "EG", "EH", "EJ", "EK", "FA", "FB",
                  "FC", "FD", "FE", "FF", "FG", "FH", "FJ", "FK",
                  "GA", "GB", "GC", "GD", "GE", "GF", "GG", "GH",
                  "GJ", "GK", "HA", "HB", "HC", "HD", "HE", "HF",
                  "HG", "HH", "HJ", "HK", "JA", "JB", "JC", "JD",
                  "JE", "JF", "JG", "JH", "KA", "KB", "KC", "KD"]

# ============================================================================
# COLORS (ANSI terminal codes)
# ============================================================================

class C:
    """ANSI color codes for terminal output."""
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    RED     = "\033[91m"
    CYAN    = "\033[96m"
    MAGENTA = "\033[95m"
    BLUE    = "\033[94m"
    WHITE   = "\033[97m"
    BG_GREEN  = "\033[42m"
    BG_RED    = "\033[41m"
    BG_YELLOW = "\033[43m"


# ============================================================================
# HELPERS
# ============================================================================

def generate_plate() -> str:
    """Generate a realistic MH-15 Nashik vehicle number."""
    prefix = random.choice(PLATE_PREFIXES)
    num = random.randint(1000, 9999)
    return f"MH15{prefix}{num}"


def pick_violation() -> str:
    """Pick a weighted-random violation type."""
    return random.choices(VIOLATION_TYPES, weights=VIOLATION_WEIGHTS, k=1)[0]


def pick_camera() -> tuple:
    """Pick a random camera with location info."""
    return random.choice(CAMERAS)


def build_detection(frame_num: int, image_file: str = None) -> dict:
    """Build a detection payload matching POST /api/detect schema."""
    cam_code, location, ward = pick_camera()
    violation_type = pick_violation()
    confidence = round(random.uniform(0.75, 0.97), 2)
    plate = generate_plate()

    payload = {
        "type": violation_type,
        "location": location,
        "ward": ward,
        "zone": "Nashik Zone",
        "plate": plate,
        "confidence": confidence,
        "camera_code": cam_code,
        "frame": f"frame_{frame_num:04d}",
        "details": {
            "source": "edge_simulator",
            "device_id": "RPi-EDGE-001",
            "timestamp": datetime.utcnow().isoformat(),
        },
    }

    if image_file:
        payload["evidence_path"] = image_file

    return payload, violation_type, confidence, plate, cam_code, location


def wait_for_backend(max_retries: int = 5) -> bool:
    """Wait for backend to be reachable."""
    print(f"\n{C.CYAN}{'━' * 60}{C.RESET}")
    print(f"{C.CYAN}{C.BOLD}  🚦 TrafficGenie Edge Simulator{C.RESET}")
    print(f"{C.CYAN}{'━' * 60}{C.RESET}")
    print(f"{C.DIM}  Device: RPi-EDGE-001  |  Model: YOLOv8n  |  Zone: Nashik{C.RESET}")
    print(f"{C.CYAN}{'━' * 60}{C.RESET}\n")

    for attempt in range(1, max_retries + 1):
        try:
            r = requests.get(HEALTH_ENDPOINT, timeout=3)
            if r.status_code == 200:
                print(f"  {C.GREEN}✓ Backend online{C.RESET} at {C.BOLD}{API_BASE}{C.RESET}")
                print()
                return True
        except requests.ConnectionError:
            pass
        except Exception:
            pass

        print(f"  {C.YELLOW}⏳ Backend unreachable (attempt {attempt}/{max_retries})... retrying in 5s{C.RESET}")
        time.sleep(5)

    print(f"  {C.RED}✗ Backend at {API_BASE} is not responding. Is it running?{C.RESET}")
    print(f"  {C.DIM}  Start it with: cd backend && python -m uvicorn main:app --reload{C.RESET}\n")
    return False


def send_detection(payload: dict) -> dict | None:
    """POST detection to backend. Returns response or None on failure."""
    try:
        r = requests.post(DETECT_ENDPOINT, json=payload, timeout=10)
        if r.status_code == 200:
            return r.json()
        else:
            return {"error": r.text, "status_code": r.status_code}
    except requests.ConnectionError:
        return None
    except Exception as e:
        return {"error": str(e)}


def get_image_files() -> list:
    """Get list of image files from sample_images/ directory."""
    if not os.path.exists(SAMPLE_DIR):
        return []
    
    extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    files = sorted([
        os.path.join(SAMPLE_DIR, f)
        for f in os.listdir(SAMPLE_DIR)
        if os.path.splitext(f)[1].lower() in extensions
    ])
    return files


def print_detection_log(frame_num: int, violation_type: str, confidence: float,
                         plate: str, cam_code: str, location: str):
    """Print the [EDGE] detection line."""
    # Color based on violation severity
    severity_colors = {
        "Triple Riding": C.RED,
        "No Helmet": C.RED,
        "Signal Jump": C.YELLOW,
        "Speeding": C.YELLOW,
        "Wrong Lane": C.MAGENTA,
        "Zebra Crossing": C.MAGENTA,
        "No License Plate": C.BLUE,
        "Mobile Use": C.BLUE,
    }
    color = severity_colors.get(violation_type, C.WHITE)

    print(
        f"  {C.DIM}[EDGE]{C.RESET} "
        f"Frame {C.BOLD}{frame_num:03d}{C.RESET} │ "
        f"{cam_code} {C.DIM}@{C.RESET} {location} │ "
        f"{color}{violation_type:<18}{C.RESET} "
        f"{C.DIM}conf:{C.RESET} {C.BOLD}{confidence:.2f}{C.RESET} │ "
        f"🚗 {C.CYAN}{plate}{C.RESET}"
    )


def print_cloud_response(result: dict | None, frame_num: int):
    """Print the [CLOUD] response line."""
    if result is None:
        print(
            f"  {C.RED}[CLOUD] ✗ Connection lost — will retry next frame{C.RESET}"
        )
        return False

    if "error" in result and "status" not in result:
        status = result.get("status_code", "???")
        print(
            f"  {C.RED}[CLOUD] ✗ Error ({status}): {result['error'][:80]}{C.RESET}"
        )
        return False

    # Success
    violation = result.get("violation", {})
    db_id = violation.get("db_id", "—")
    insight = violation.get("ai_insight", {})
    risk = insight.get("risk_level", "") if insight else ""

    risk_badge = ""
    if risk:
        risk_color = {
            "CRITICAL": C.BG_RED,
            "HIGH": C.RED,
            "MEDIUM": C.YELLOW,
            "LOW": C.GREEN,
        }.get(risk, C.DIM)
        risk_badge = f" {risk_color}[{risk}]{C.RESET}"

    print(
        f"  {C.GREEN}[CLOUD] ✓ Violation #{db_id} logged{C.RESET}{risk_badge}"
    )
    return True


def print_summary(total_frames: int, violations_sent: int, challans_created: int,
                   errors: int, elapsed: float):
    """Print the final summary."""
    print(f"\n{C.CYAN}{'━' * 60}{C.RESET}")
    print(f"{C.CYAN}{C.BOLD}  📊 Simulation Complete{C.RESET}")
    print(f"{C.CYAN}{'━' * 60}{C.RESET}")
    print(f"  {'Frames scanned':<25} {C.BOLD}{total_frames}{C.RESET}")
    print(f"  {'Violations detected':<25} {C.GREEN}{C.BOLD}{violations_sent}{C.RESET}")
    print(f"  {'Challans created':<25} {C.GREEN}{C.BOLD}{challans_created}{C.RESET}")
    if errors > 0:
        print(f"  {'Errors':<25} {C.RED}{C.BOLD}{errors}{C.RESET}")
    print(f"  {'Elapsed time':<25} {C.DIM}{elapsed:.1f}s{C.RESET}")
    print(f"  {'Avg time/frame':<25} {C.DIM}{elapsed / max(total_frames, 1):.1f}s{C.RESET}")
    print(f"{C.CYAN}{'━' * 60}{C.RESET}\n")


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="TrafficGenie Edge Simulator")
    parser.add_argument("--frames", type=int, default=0,
                        help="Number of synthetic frames to generate (0 = use sample_images/)")
    parser.add_argument("--delay", type=float, default=None,
                        help="Delay between frames in seconds (default: random 2-3s)")
    parser.add_argument("--url", type=str, default=API_BASE,
                        help=f"Backend URL (default: {API_BASE})")
    args = parser.parse_args()

    global API_BASE, DETECT_ENDPOINT, CHALLANS_ENDPOINT, HEALTH_ENDPOINT
    if args.url != API_BASE:
        API_BASE = args.url.rstrip("/")
        DETECT_ENDPOINT = f"{API_BASE}/api/detect"
        CHALLANS_ENDPOINT = f"{API_BASE}/api/challans"
        HEALTH_ENDPOINT = f"{API_BASE}/health"

    # Check backend connectivity
    if not wait_for_backend():
        sys.exit(1)

    # Determine frame source
    image_files = get_image_files()
    synthetic = args.frames > 0 or len(image_files) == 0

    if synthetic:
        num_frames = args.frames if args.frames > 0 else 10
        print(f"  {C.YELLOW}📷 No sample images found — generating {num_frames} synthetic frames{C.RESET}\n")
    else:
        num_frames = len(image_files)
        print(f"  {C.GREEN}📁 Found {num_frames} images in {SAMPLE_DIR}{C.RESET}\n")

    # Simulation loop
    total_frames = 0
    violations_sent = 0
    challans_created = 0
    errors = 0
    start_time = time.time()

    for i in range(num_frames):
        frame_num = i + 1
        image_file = image_files[i] if not synthetic else None

        # Build detection payload
        payload, vtype, conf, plate, cam, loc = build_detection(frame_num, image_file)

        # Print detection
        print_detection_log(frame_num, vtype, conf, plate, cam, loc)

        # Send to backend
        result = send_detection(payload)
        success = print_cloud_response(result, frame_num)

        total_frames += 1
        if success:
            violations_sent += 1
            # The backend auto-creates a challan for each violation
            challans_created += 1
        else:
            errors += 1
            # If connection lost, wait longer
            if result is None:
                print(f"  {C.YELLOW}  ↻ Retrying in 5s...{C.RESET}")
                time.sleep(5)
                result = send_detection(payload)
                retry_success = print_cloud_response(result, frame_num)
                if retry_success:
                    violations_sent += 1
                    challans_created += 1
                    errors -= 1  # Remove the error since retry succeeded

        # Delay between frames
        if i < num_frames - 1:
            delay = args.delay if args.delay is not None else random.uniform(2.0, 3.0)
            time.sleep(delay)

    elapsed = time.time() - start_time
    print_summary(total_frames, violations_sent, challans_created, errors, elapsed)


if __name__ == "__main__":
    main()
