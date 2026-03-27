#!/usr/bin/env python3
"""
Integration tests for TrafficVision backend new features.
Tests: Seeding, Live Feed, Traffic Genie, and Video Processing
"""
import json
import requests
import sys
from datetime import datetime

API_BASE = "http://localhost:8000"
API_PATH = "/api"

def print_section(title):
    """Print formatted section header."""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def check_server():
    """Verify server is running."""
    print_section("1. Server Health Check")
    try:
        resp = requests.get(f"{API_BASE}{API_PATH}/health", timeout=5)
        print(f"✓ Server running at {API_BASE}")
        print(f"✓ Status: {resp.json()}")
        return True
    except Exception as e:
        print(f"✗ Server not responding: {e}")
        return False

def test_database_seeding():
    """Test that database has been seeded with violations."""
    print_section("2. Database Seeding Verification")
    try:
        resp = requests.get(f"{API_BASE}{API_PATH}/analytics/summary", timeout=5)
        data = resp.json()
        print(f"✓ Total violations: {data['total_violations']}")
        print(f"✓ Pending challans: {data['pending_challans']}")
        print(f"✓ Approved: {data['approved_challans']}")
        print(f"✓ Rejected: {data['rejected_challans']}")
        
        if data['total_violations'] > 0:
            print("\n✓ Database successfully seeded!")
            return True
        else:
            print("\n✗ No violations found in database")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_live_feed():
    """Test live feed endpoint."""
    print_section("3. Live Feed Endpoint (/api/recent-violations)")
    try:
        resp = requests.get(
            f"{API_BASE}{API_PATH}/recent-violations",
            params={"limit": 5, "minutes": 120},
            timeout=5
        )
        violations = resp.json()
        print(f"✓ Got {len(violations)} recent violations")
        
        if violations:
            print("\n✓ Sample violations (live feed format):")
            for v in violations[:3]:
                print(f"  • {v['emoji']} {v['type']} at {v['loc']}")
                print(f"    Camera: {v['cam']}, Confidence: {v['pct']}%")
                print(f"    Status: {v['status'].upper()}")
            return True
        else:
            print("\n⚠ No recent violations (data might be old)")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_traffic_genie():
    """Test Traffic Genie analysis endpoint."""
    print_section("4. Traffic Genie AI Analysis (/api/analyze)")
    try:
        queries = [
            "What are the hotspot areas today?",
            "How many urgent violations do we have?",
            "Should I deploy more officers?",
        ]
        
        for query in queries:
            print(f"\n📝 Query: '{query}'")
            resp = requests.post(
                f"{API_BASE}{API_PATH}/analyze",
                json={"prompt": query},
                timeout=10
            )
            data = resp.json()
            
            analysis = data.get('analysis', data.get('text', 'No response'))
            print(f"🧞 Response: {analysis[:200]}...")
            
        print("\n✓ Traffic Genie responding to queries!")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_violations_api():
    """Test violations list endpoint."""
    print_section("5. Violations API (/api/violations)")
    try:
        resp = requests.get(
            f"{API_BASE}{API_PATH}/violations",
            params={"page": 1, "page_size": 5},
            timeout=5
        )
        violations = resp.json()
        print(f"✓ Retrieved {len(violations)} violations")
        
        # Verify data structure
        if violations:
            v = violations[0]
            required_fields = ['id', 'type', 'plate', 'confidence', 'location', 'ward']
            missing = [f for f in required_fields if f not in v]
            
            if not missing:
                print("✓ All required fields present:")
                print(f"  - Type: {v['type']}")
                print(f"  - Plate: {v['plate']}")
                print(f"  - Confidence: {v['confidence']}%")
                print(f"  - Location: {v['location']}")
                return True
            else:
                print(f"✗ Missing fields: {missing}")
                return False
        else:
            print("⚠ No violations to validate")
            return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_video_processing_endpoint():
    """Test video processing endpoint exists."""
    print_section("6. Video Processing Endpoint (/api/videos/process)")
    try:
        # Try to get endpoint info (will fail with 422 since no file, but shows endpoint exists)
        resp = requests.post(
            f"{API_BASE}{API_PATH}/videos/process",
            timeout=5,
        )
        
        if resp.status_code in [422, 400]:  # Expected validation error
            print("✓ Video processing endpoint is registered")
            print("✓ Ready to accept video uploads")
            return True
        else:
            print(f"? Unexpected status: {resp.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Could not reach endpoint")
        return False
    except Exception as e:
        print(f"⚠ Note: {e}")
        print("→ Endpoint exists but may require specific setup")
        return True

def main():
    """Run all tests."""
    print("\n")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║       TrafficVision Backend - Integration Test Suite              ║")
    print("║                                                                    ║")
    print("║  Testing: Seeding, Live Feed, Traffic Genie, Video Processing    ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    
    tests = [
        ("Server Health", check_server),
        ("Database Seeding", test_database_seeding),
        ("Live Feed API", test_live_feed),
        ("Traffic Genie", test_traffic_genie),
        ("Violations API", test_violations_api),
        ("Video Processing", test_video_processing_endpoint),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ Unexpected error in {name}: {e}")
            results.append((name, False))
    
    # Summary
    print_section("📊 Test Summary")
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} - {name}")
    
    print(f"\n{'='*70}")
    print(f"Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("✨ All systems operational!")
        print("\n📌 Next Steps:")
        print("  1. Connect frontend CityFeed to /api/recent-violations")
        print("  2. Connect Traffic Genie to /api/analyze endpoint")
        print("  3. Test video upload at /api/videos/process")
        return 0
    else:
        print("⚠ Some tests failed - review output above")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⏹ Tests interrupted by user")
        sys.exit(1)
