# TrafficGenie

TrafficGenie is a full-stack traffic violation management platform that combines computer vision (YOLOv8), a FastAPI backend, and a React dashboard to help teams detect violations, generate challans, and monitor trends.

> Forked and expanded from [hrshbuilds/TrafficVision](https://github.com/hrshbuilds/TrafficVision).

## Why TrafficGenie

- Detects violations from uploaded traffic videos.
- Stores and serves violation/challan data via REST APIs.
- Adds AI-generated summaries and insights (Gemini integration).
- Supports Firebase-backed authentication and data workflows.
- Includes frontend dashboard for operations and monitoring.

## Core Features

- **Video ingestion + processing** (`/api/videos/upload`, `/api/videos/process`)
- **Violation management APIs** (`/api/violations`, `/api/recent-violations`)
- **Challan lifecycle APIs** (`/api/challans`, review actions)
- **Analytics summary endpoint** (`/api/analytics/summary`)
- **AI assistant endpoints** (`/api/analyze`, `/api/ask`, `/api/context/summary`)
- **Health + metadata endpoints** (`/health`, `/api/health`, `/api/version`)

## Tech Stack

| Layer | Technology |
|---|---|
| Detection | YOLOv8 (Ultralytics), OpenCV |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Data | SQLite (dev), PostgreSQL-ready config |
| Auth/Cloud | Firebase Admin, Firestore, Cloud Storage |
| AI | Google Gemini |
| Frontend | React + Vite |
| Testing | pytest, httpx |

## Repository Structure

```text
trafficgenie/
├── backend/                 # FastAPI app, services, models, tests
│   ├── main.py              # Primary backend entrypoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # React + Vite dashboard
│   └── package.json
├── QUICK_START_LOCAL.md
├── API_TESTING_GUIDE.md
├── PRODUCTION_DEPLOYMENT_GUIDE.md
└── README.md
```

## Quick Start

### 1) Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### 2) Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Backend runs at `http://localhost:8000`.

Useful endpoints:
- Health: `http://localhost:8000/api/health`
- Docs (debug): `http://localhost:8000/api/docs`

### 3) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Configuration

Copy `backend/.env.example` to `backend/.env` and update values for your environment.

Important variables:
- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- `FIREBASE_*`
- `GEMINI_API_KEY`
- `DEMO_MODE`
- `YOLO_MODEL_PATH`

## Development Workflows

### Run backend tests

```bash
cd backend
pytest
```

### Frontend checks

```bash
cd frontend
npm run lint
npm run build
```

### API smoke test script

```bash
cd backend
bash test-endpoints.sh
```

## Documentation

- [QUICK_START_LOCAL.md](./QUICK_START_LOCAL.md) — local setup and smoke testing
- [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) — endpoint-level testing examples
- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) — deployment guidance
- [BACKEND_AUDIT_REPORT.md](./BACKEND_AUDIT_REPORT.md) — backend architecture/audit notes
- [UPSTREAM_CONTRIBUTION_GUIDE.md](./UPSTREAM_CONTRIBUTION_GUIDE.md) — contribute improvements upstream

## Current Status / Notes

- Demo mode auth bypass is available for development (`DEMO_MODE=True`).
- Firebase and Gemini integrations degrade gracefully when not configured.
- Async queue hooks are present but may require additional production setup (Redis/Celery).

## Contributing

1. Create a feature branch.
2. Make focused changes with tests.
3. Run lint/tests before opening a PR.
4. Update docs when APIs or workflows change.

If you want to contribute these improvements upstream, use:

```bash
./scripts/prepare-upstream-pr.sh
```
