# API Testing Guide

> Complete guide for testing TrafficVision APIs with curl, Postman, and Python

---

## Quick Start: Using curl

### 1. Health Check

```bash
curl -i http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

### 2. Detailed Health

```bash
curl -i http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "services": {
    "firebase": true,
    "gemini": true,
    "database": true
  }
}
```

### 3. Get API Version

```bash
curl http://localhost:8000/api/version
```

**Expected Response:**
```json
{
  "app_name": "TrafficVision",
  "version": "1.2.0",
  "environment": "development"
}
```

---

## Testing Violation Endpoints

### List Violations

**Basic Request:**
```bash
curl http://localhost:8000/api/violations
```

**With Filters:**
```bash
# Filter by type and ward
curl "http://localhost:8000/api/violations?type=Triple%20Riding&ward=Sadar"

# Pagination
curl "http://localhost:8000/api/violations?page=1&page_size=10"

# Sorting
curl "http://localhost:8000/api/violations?sort=confidence:desc"

# Combined
curl "http://localhost:8000/api/violations?page=2&page_size=20&type=Triple%20Riding&sort=detected_at:asc"
```

**Response Example:**
```json
[
  {
    "id": 1,
    "type": "Triple Riding",
    "plate": "MH-15-AB-1234",
    "confidence": 0.92,
    "detected_at": "2026-03-27T10:30:00Z",
    "location": "Sadar Junction",
    "ward": "Sadar",
    "zone": "Nashik Zone",
    "model_version": "yolov8n",
    "challan_status": "pending",
    "evidence": ["http://localhost:8000/images/violation_1.jpg"]
  }
]
```

### Get Specific Violation

```bash
curl http://localhost:8000/api/violations/1
```

**Response Example:**
```json
{
  "id": 1,
  "type": "Triple Riding",
  "plate": "MH-15-AB-1234",
  "confidence": 0.92,
  "detected_at": "2026-03-27T10:30:00Z",
  "location": "Sadar Junction",
  "ward": "Sadar",
  "zone": "Nashik Zone",
  "model_version": "yolov8n",
  "challan_status": "pending",
  "evidence": [
    "http://localhost:8000/images/violation_1.jpg"
  ]
}
```

---

## Testing Challan Endpoints

### List Challans

**Basic:**
```bash
curl http://localhost:8000/api/challans
```

**With Filters:**
```bash
# Filter by status
curl "http://localhost:8000/api/challans?status=pending"
curl "http://localhost:8000/api/challans?status=approved"

# Filter by ward
curl "http://localhost:8000/api/challans?ward=Sadar"

# Combined
curl "http://localhost:8000/api/challans?status=pending&ward=Sadar&page=1"
```

**Response Example:**
```json
[
  {
    "id": "1",
    "image": "http://localhost:8000/images/violation_1.jpg",
    "type": "Triple Riding",
    "location": "Sadar Junction",
    "ward": "Sadar",
    "zone": "Nashik Zone",
    "status": "pending",
    "plate": "MH-15-AB-1234",
    "time": "10:30:00",
    "fine": 2000,
    "conf": 0.92,
    "detected_at": "2026-03-27T10:30:00Z"
  }
]
```

### Review Challan (Advanced)

**With Bearer Token (Firebase Auth):**
```bash
FIREBASE_TOKEN="your-firebase-id-token-here"

curl -X POST http://localhost:8000/api/challans/1/review \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "notes": "Vehicle violation confirmed. License plate MH-15-AB-1234 identified."
  }'
```

**In Demo Mode (no auth required):**
```bash
curl -X POST http://localhost:8000/api/challans/1/review \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "notes": "Violation confirmed"
  }'
```

**Response Example:**
```json
{
  "id": "1",
  "image": "http://localhost:8000/images/violation_1.jpg",
  "type": "Triple Riding",
  "location": "Sadar Junction",
  "ward": "Sadar",
  "zone": "Nashik Zone",
  "status": "approved",
  "plate": "MH-15-AB-1234",
  "time": "10:30:00",
  "fine": 2000,
  "conf": 0.92,
  "detected_at": "2026-03-27T10:30:00Z"
}
```

---

## Testing Detection & Upload

### Upload Video

**Using bash:**
```bash
# Create a dummy video file for testing
dd if=/dev/zero bs=1024 count=100 of=test_video.mp4

# Upload
curl -X POST http://localhost:8000/api/videos/upload \
  -F "video=@test_video.mp4"
```

**Response Example:**
```json
{
  "id": 5,
  "source_file": "data/uploads/1711533000_test_video.mp4",
  "status": "queued",
  "created_at": "2026-03-27T10:30:00Z",
  "updated_at": "2026-03-27T10:30:00Z",
  "result_summary": null
}
```

### Check Job Status

```bash
curl http://localhost:8000/api/jobs/5
```

**Response Example:**
```json
{
  "id": 5,
  "source_file": "data/uploads/1711533000_test_video.mp4",
  "status": "completed",
  "created_at": "2026-03-27T10:30:00Z",
  "updated_at": "2026-03-27T10:35:00Z",
  "result_summary": "Processed 150 frames, found 3 violations"
}
```

### Post Detection Result

**To the /api/detect endpoint:**
```bash
curl -X POST http://localhost:8000/api/detect \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Triple Riding",
    "location": "Sadar Junction",
    "plate": "MH-15-AB-1234",
    "confidence": 0.92,
    "timestamp": "2026-03-27T10:30:00Z",
    "frame": 150,
    "details": {
      "rider_count": 3,
      "bike_box": [100, 200, 300, 400]
    }
  }'
```

**Response Example:**
```json
{
  "status": "success",
  "violation": {
    "db_id": 42,
    "firestore_id": "abc123def456",
    "type": "Triple Riding",
    "location": "Sadar Junction",
    "plate": "MH-15-AB-1234",
    "ai_insight": {
      "description": "Vehicle detected with three riders. Serious safety violation.",
      "risk_level": "HIGH",
      "recommendation": "ticket"
    }
  }
}
```

---

## Testing Analytics

```bash
curl http://localhost:8000/api/analytics/summary
```

**Response Example:**
```json
{
  "total_violations": 42,
  "pending_challans": 10,
  "approved_challans": 25,
  "rejected_challans": 7
}
```

---

## Error Handling Examples

### 404 - Not Found

```bash
curl http://localhost:8000/api/violations/999
```

**Response:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Violation not found",
    "details": {
      "resource": "Violation",
      "id": "999"
    }
  }
}
```
Status: `404`

### 400 - Invalid Input

```bash
curl -X POST http://localhost:8000/api/videos/upload \
  -F "video=@test.txt"
```

**Response:**
```json
{
  "error": {
    "code": "HTTP_ERROR",
    "message": "Unsupported video format: .txt. Supported: .mp4, .avi, .mov, .mkv",
    "details": {}
  }
}
```
Status: `400`

### 401 - Unauthorized

```bash
curl -X POST http://localhost:8000/api/challans/1/review \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

**Response (if Firebase is enabled and DEMO_MODE=False):**
```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired token",
    "details": {}
  }
}
```
Status: `401`

### 403 - Forbidden

```bash
# If user role is not 'admin' or 'reviewer'
curl -X POST http://localhost:8000/api/challans/1/review \
  -H "Authorization: Bearer token-with-wrong-role" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

**Response:**
```json
{
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions",
    "details": {}
  }
}
```
Status: `403`

### 422 - Validation Error

```bash
curl -X POST http://localhost:8000/api/challans/1/review \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid_status"}'
```

**Response:**
```json
{
  "error": {
    "code": "HTTP_ERROR",
    "message": "Invalid status",
    "details": {}
  }
}
```
Status: `400`

---

## Postman Collection

### Import into Postman

1. Create new collection: "TrafficVision"
2. Add these requests:

**Request 1: Health Check**
```
GET http://{{base_url}}/health
```

**Request 2: List Violations**
```
GET http://{{base_url}}/api/violations?page=1&page_size=20
```

**Request 3: Get Specific Violation**
```
GET http://{{base_url}}/api/violations/1
```

**Request 4: List Challans**
```
GET http://{{base_url}}/api/challans?status=pending
```

**Request 5: Review Challan**
```
POST http://{{base_url}}/api/challans/1/review
Authorization: Bearer {{token}}

{
  "status": "approved",
  "notes": "Violation confirmed"
}
```

**Request 6: Upload Video**
```
POST http://{{base_url}}/api/videos/upload
Form-data:
  video: @/path/to/video.mp4
```

**Request 7: Post Detection Result**
```
POST http://{{base_url}}/api/detect
Content-Type: application/json

{
  "type": "Triple Riding",
  "location": "Sadar Junction",
  "plate": "MH-15-AB-1234",
  "confidence": 0.92,
  "timestamp": "2026-03-27T10:30:00Z",
  "frame": 150
}
```

**Request 8: Analytics**
```
GET http://{{base_url}}/api/analytics/summary
```

### Environment Variables

In Postman, create environment with:

```json
{
  "base_url": "http://localhost:8000",
  "token": "your-firebase-id-token-or-demo-token"
}
```

---

## Python Client Usage

```python
import requests
from datetime import datetime

BASE_URL = "http://localhost:8000"
HEADERS = {
    "Content-Type": "application/json",
    # "Authorization": "Bearer <firebase-token>"  # Uncomment for protected routes
}

class TrafficVisionClient:
    def __init__(self, base_url=BASE_URL, token=None):
        self.base_url = base_url
        self.session = requests.Session()
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"
    
    def health_check(self):
        """Check API health."""
        resp = self.session.get(f"{self.base_url}/health")
        return resp.json()
    
    def list_violations(self, page=1, page_size=20, **filters):
        """List violations."""
        params = {"page": page, "page_size": page_size, **filters}
        resp = self.session.get(f"{self.base_url}/api/violations", params=params)
        return resp.json()
    
    def get_violation(self, violation_id):
        """Get specific violation."""
        resp = self.session.get(f"{self.base_url}/api/violations/{violation_id}")
        return resp.json()
    
    def list_challans(self, status=None, **filters):
        """List challans."""
        params = {}
        if status:
            params["status"] = status
        params.update(filters)
        resp = self.session.get(f"{self.base_url}/api/challans", params=params)
        return resp.json()
    
    def review_challan(self, challan_id, status, notes=None):
        """Review challan."""
        data = {"status": status}
        if notes:
            data["notes"] = notes
        resp = self.session.post(
            f"{self.base_url}/api/challans/{challan_id}/review",
            json=data
        )
        return resp.json()
    
    def post_detection(self, violation_data):
        """Post detection result."""
        resp = self.session.post(
            f"{self.base_url}/api/detect",
            json=violation_data
        )
        return resp.json()
    
    def get_analytics(self):
        """Get analytics summary."""
        resp = self.session.get(f"{self.base_url}/api/analytics/summary")
        return resp.json()


# Usage
client = TrafficVisionClient()

# Health check
print(client.health_check())

# List violations
violations = client.list_violations(page=1, page_size=10)
print(f"Found {len(violations)} violations")

# List pending challans
challans = client.list_challans(status="pending")
print(f"Found {len(challans)} pending challans")

# Review first challan if exists
if challans:
    challan_id = challans[0]["id"]
    result = client.review_challan(
        challan_id=challan_id,
        status="approved",
        notes="Violation confirmed"
    )
    print(f"Challan {challan_id} updated to {result['status']}")

# Post detection
detection = {
    "type": "Triple Riding",
    "location": "Sadar Junction",
    "plate": "MH-15-AB-5678",
    "confidence": 0.88,
    "timestamp": datetime.utcnow().isoformat(),
    "frame": 200
}
result = client.post_detection(detection)
print(f"Violation created: {result}")

# Analytics
stats = client.get_analytics()
print(f"Total violations: {stats['total_violations']}")
print(f"Pending challans: {stats['pending_challans']}")
```

---

## Load Testing with k6

```javascript
// Save as load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8000';

export const options = {
  vus: 10,           // 10 virtual users
  duration: '30s',   // 30 second test
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% responses under 500ms
  },
};

export default function () {
  // Health check
  let res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health status is 200': (r) => r.status === 200,
  });
  
  // List violations
  res = http.get(`${BASE_URL}/api/violations`);
  check(res, {
    'violations status is 200': (r) => r.status === 200,
  });
  
  // List challans
  res = http.get(`${BASE_URL}/api/challans`);
  check(res, {
    'challans status is 200': (r) => r.status === 200,
  });
  
  // Analytics
  res = http.get(`${BASE_URL}/api/analytics/summary`);
  check(res, {
    'analytics status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

**Run load test:**
```bash
k6 run load-test.js
```

---

## Testing Checklist

- [ ] Health endpoints respond
- [ ] List violations works (empty and populated)
- [ ] Violation filtering by type/ward/plate works
- [ ] Pagination works
- [ ] Get specific violation returns 404 for missing
- [ ] List challans filters by status
- [ ] Challan review updates status
- [ ] Analytics returns correct counts
- [ ] Video upload validates file format
- [ ] Detection endpoint accepts valid data
- [ ] Error responses have correct format
- [ ] Auth/permission checks work (if enabled)
- [ ] Response times are acceptable (<1s for most operations)

