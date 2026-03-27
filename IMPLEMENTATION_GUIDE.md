# TrafficVision Backend Implementation Guide

> **Complete guide for setting up, testing, and deploying the upgraded backend**

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Testing](#testing)
6. [Firebase Integration](#firebase-integration)
7. [Gemini AI Integration](#gemini-ai-integration)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### New Modular Structure

```
backend/
├── main.py                    # FastAPI application (refactored)
├── config.py                  # Configuration management
├── core/
│   ├── exceptions.py          # Custom exception hierarchy
│   ├── logger.py              # Structured logging
│   └── security.py            # Auth/Firebase verification
├── services/                  # Business logic
│   ├── firebase_service.py    # Firestore + Cloud Storage
│   ├── gemini_service.py      # AI insight generation
│   ├── detection_service.py   # YOLO pipeline
│   └── violation_service.py   # Violation orchestration
├── fastapi_models.py          # SQLAlchemy ORM models
├── fastapi_schemas.py         # Pydantic request/response schemas
├── fastapi_db.py              # Database connection
└── requirements.txt           # Python dependencies
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | FastAPI | REST API, auto-docs |
| **Database** | PostgreSQL + SQLAlchemy | Transactional data (dev: SQLite) |
| **Firebase** | Admin SDK | Firestore (optional), Cloud Storage, Auth |
| **AI/ML** | YOLO v8 + Gemini | Detection + insights |
| **Async** | Celery + Redis | Background job queue (optional) |
| **Logging** | StructLog + JSON | Production monitoring |

### Data Flow

```
1. Video Upload (POST /api/videos/upload)
   ↓
2. Queued in Job Queue (ProcessingJob record)
   ↓
3. Detection Service Processes (YOLO)
   ↓
4. POST /api/detect called with results
   ↓
5. Violation Service Processes:
   - Upload evidence to Firebase Storage
   - Save violation to SQL Database + Firestore
   - Generate AI insight via Gemini
   - Create auto-challan
   ↓
6. Frontend can query violations/challans
   ↓
7. Reviewer reviews via POST /api/challans/{id}/review
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Environment File

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Set Up Database

```bash
# Run migrations (if using Alembic)
# alembic upgrade head

# Or just start the app - it will create tables automatically
python main.py
```

### 4. Run Development Server

```bash
python main.py
# Or with auto-reload:
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access API

- **API Docs**: http://localhost:8000/api/docs
- **Alternative Docs**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

---

## Configuration

### Environment Variables

#### Development Minimal Setup

```bash
ENV=development
DEBUG=True
DEMO_MODE=True              # Skip Firebase auth
DATABASE_URL=sqlite:///./trafficvision.db
YOLO_MODEL_PATH=models/yolov8n.pt
```

#### Production Setup

```bash
ENV=production
DEBUG=False
DEMO_MODE=False
DATABASE_URL=postgresql://user:pass@host:5432/db
ALLOWED_ORIGINS=https://trafficvision.com,https://app.trafficvision.com

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_JSON='{"type":"service_account",...}'
FIREBASE_STORAGE_BUCKET=project.appspot.com

# Gemini
GEMINI_API_KEY=your-api-key

# Security
JWT_SECRET=generate-strong-random-string

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### Configuration Priority

1. Environment variables (highest)
2. `.env` file
3. Defaults in `config.py`

---

## API Endpoints

### Health & Metadata

```bash
# Basic health check
GET /health
→ {"status": "ok"}

# Detailed health with service status
GET /api/health
→ {
    "status": "ok",
    "services": {
      "firebase": true,
      "gemini": true,
      "database": true
    }
  }

# Version info
GET /api/version
→ {
    "app_name": "TrafficVision",
    "version": "1.2.0",
    "environment": "development"
  }
```

### Detection & Video Processing

```bash
# Upload video for processing
POST /api/videos/upload
Content-Type: multipart/form-data
- video: <file>
→ {
    "id": 1,
    "source_file": "path/to/video.mp4",
    "status": "queued",
    "created_at": "2026-03-27T...",
    "updated_at": "2026-03-27T...",
    "result_summary": null
  }

# Check job status
GET /api/jobs/{job_id}
→ { "id": 1, "status": "processing", ... }

# Receive detection results (from external service)
POST /api/detect
Content-Type: application/json
{
  "type": "Triple Riding",
  "location": "Sadar Junction",
  "plate": "MH-15-AB-1234",
  "confidence": 0.92,
  "timestamp": "2026-03-27T10:30:00Z",
  "frame": 150
}
→ {
    "status": "success",
    "violation": {
      "db_id": 42,
      "firestore_id": "doc_id",
      "type": "Triple Riding",
      "ai_insight": {
        "description": "...",
        "risk_level": "HIGH",
        "recommendation": "ticket"
      }
    }
  }
```

### Violations

```bash
# List all violations (paginated, filterable)
GET /api/violations?page=1&page_size=20&type=Triple%20Riding&ward=Sadar
→ [{
    "id": 1,
    "type": "Triple Riding",
    "plate": "MH-15-AB-1234",
    "confidence": 0.92,
    "detected_at": "2026-03-27T10:30:00Z",
    "location": "Sadar Junction",
    "evidence": ["http://..."]
  }, ...]

# Get specific violation
GET /api/violations/{violation_id}
→ { ... }
```

### Challans

```bash
# List all challans
GET /api/challans?status=pending&page=1
→ [{
    "id": "1",
    "image": "http://...",
    "type": "Triple Riding",
    "location": "Sadar Junction",
    "status": "pending",
    "plate": "MH-15-AB-1234",
    "fine": 2000,
    "detected_at": "2026-03-27T10:30:00Z"
  }, ...]

# Review/update challan (Firebase auth required)
POST /api/challans/{challan_id}/review
Authorization: Bearer eyJhbGc...
Content-Type: application/json
{
  "status": "approved",  # or "rejected", "pending"
  "notes": "Vehicle violation confirmed"
}
→ { "id": "1", "status": "approved", ... }
```

### Analytics

```bash
# Get summary statistics
GET /api/analytics/summary
→ {
    "total_violations": 42,
    "pending_challans": 10,
    "approved_challans": 25,
    "rejected_challans": 7
  }
```

---

## Testing

### Using cURL

#### 1. Test Health Endpoint

```bash
curl http://localhost:8000/health
```

#### 2. Upload Video

```bash
curl -X POST http://localhost:8000/api/videos/upload \
  -F "video=@traffic_video.mp4"
```

#### 3. Get Violations

```bash
curl "http://localhost:8000/api/violations?page=1&page_size=10"
```

#### 4. Review Challan (with demo token)

```bash
curl -X POST http://localhost:8000/api/challans/1/review \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "notes": "OK"}'
```

### Using Postman

1. Import collection: `postman_collection.json` (see below)
2. Set variables:
   - `{{base_url}}` = `http://localhost:8000`
   - `{{token}}` = Firebase ID token (or demo token in dev)
3. Run requests

### Using Python Requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Health check
resp = requests.get(f"{BASE_URL}/health")
print(resp.json())

# Get violations
resp = requests.get(f"{BASE_URL}/api/violations", params={"page": 1})
print(resp.json())

# Upload video
with open("video.mp4", "rb") as f:
    files = {"video": f}
    resp = requests.post(f"{BASE_URL}/api/videos/upload", files=files)
    print(resp.json())

# Review challan (with auth token)
headers = {"Authorization": "Bearer <firebase_token>"}
data = {"status": "approved", "notes": "OK"}
resp = requests.post(
    f"{BASE_URL}/api/challans/1/review",
    json=data,
    headers=headers
)
print(resp.json())
```

### Using pytest

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_violations.py -v

# Run with coverage
pytest --cov=services tests/
```

---

## Firebase Integration

### Setup Firestore

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project

2. **Enable Firestore**
   - Go to Firestore Database
   - Create database (start in test mode for development)

3. **Create Service Account**
   - Project Settings → Service Accounts
   - Generate new private key (JSON)
   - Save as `serviceAccountKey.json` in backend directory

4. **Configure Environment**
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   ```

### Firestore Schema

**Collection: `violations`**
```json
{
  "id": "auto-generated",
  "type": "Triple Riding",
  "location": "Sadar Junction",
  "plate": "MH-15-AB-1234",
  "timestamp": "2026-03-27T10:30:00Z",
  "confidence": 0.92,
  "evidence_url": "gs://bucket/violations/image.jpg",
  "ai_insight": {
    "description": "...",
    "risk_level": "HIGH",
    "recommendation": "ticket"
  }
}
```

**Collection: `challans`**
```json
{
  "id": "auto-generated",
  "violation_id": "db-id-or-firestore-id",
  "status": "pending",
  "fine": 2000,
  "created_at": "2026-03-27T10:30:00Z",
  "updated_at": "2026-03-27T10:30:00Z"
}
```

### Cloud Storage

Files are saved with path: `violations/{violation_id}/{timestamp}.jpg`

**Example:**
```
gs://your-bucket/violations/42/20260327_103000.jpg
```

---

## Gemini AI Integration

### Setup

1. **Get Gemini API Key**
   - Go to https://ai.google.dev/
   - Create API key from Google AI Studio

2. **Configure**
   ```bash
   GEMINI_API_KEY=your-api-key
   GEMINI_MODEL=gemini-2.0-flash
   ENABLE_GEMINI_INSIGHTS=True
   ```

### Usage

Insights are automatically generated when violations are created:

```python
from services.gemini_service import gemini_service

insight = gemini_service.generate_violation_insight(
    violation_type="Triple Riding",
    location="Sadar Junction",
    vehicle_plate="MH-15-AB-1234",
    timestamp="2026-03-27T10:30:00Z",
    confidence=0.92
)

# Returns:
# {
#     "description": "Vehicle detected with three riders. Serious safety violation.",
#     "risk_level": "HIGH",
#     "recommendation": "ticket"
# }
```

---

## Deployment

### Docker

**Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV ENV=production
ENV DEBUG=False

CMD ["python", "main.py"]
```

**Build & Run**
```bash
docker build -t trafficvision-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e FIREBASE_PROJECT_ID="..." \
  trafficvision-backend
```

### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy trafficvision-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENV=production,DATABASE_URL=postgresql://...
```

### Environment Variables to Set

```bash
ENV=production
DEBUG=False
DEMO_MODE=False
DATABASE_URL=postgresql://user:pass@cloud-sql-proxy/db
FIREBASE_CREDENTIALS_JSON='...'
GEMINI_API_KEY=...
LOG_FORMAT=json
```

---

## Troubleshooting

### Firebase Not Initializing

```
Error: Failed to initialize Firebase: Credentials not found
```

**Solution:**
- Check `FIREBASE_CREDENTIALS_PATH` exists
- Or set `FIREBASE_CREDENTIALS_JSON` env var
- Verify JSON file is valid

### Models Not Loading

```
Error: Failed to load models: yolov8n.pt not found
```

**Solution:**
```bash
# Download model automatically
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Database Connection Error

```
Error: Could not connect to database
```

**Solution (SQLite):**
```bash
# Ensure data directory exists
mkdir -p backend
# Delete corrupted database
rm -f trafficvision.db
```

**Solution (PostgreSQL):**
```bash
# Check connection string
psql postgresql://user:pass@localhost:5432/trafficvision

# Or use proxy
cloud_sql_proxy -instances=project:region:instance=127.0.0.1:5432
```

### Gemini API Errors

```
Error: API key not valid
```

**Solution:**
- Verify key at https://ai.google.dev/
- Check key is passed correctly: `export GEMINI_API_KEY=...`

---

## Next Steps

1. **Frontend Integration** (see frontend README)
2. **Set up CI/CD** (GitHub Actions, Cloud Build)
3. **Configure monitoring** (Cloud Logging, Sentry)
4. **Load testing** (k6, Apache JMeter)
5. **Security hardening** (secrets, CORS, rate limiting)

---

## Support

For issues or questions:
1. Check logs: `docker logs <container_id>`
2. Check API docs: http://localhost:8000/api/docs
3. Review error details in response body

