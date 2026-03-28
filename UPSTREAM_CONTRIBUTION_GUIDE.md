# Contributing TrafficGenie Changes Back to TrafficVision

**TrafficGenie** is a fork of **[hrshbuilds/TrafficVision](https://github.com/hrshbuilds/TrafficVision)**.
This document explains how to sync all the improvements made here back to the upstream repository.

---

## Background

| | TrafficVision (upstream) | TrafficGenie (this fork) |
|---|---|---|
| **Backend** | Script-based (`detect.py`) | Full FastAPI REST API |
| **Database** | None | SQLAlchemy + Alembic migrations |
| **AI** | YOLOv8 detection only | YOLO + Google Gemini insights |
| **Cloud** | None | Firebase Firestore + Storage |
| **Frontend** | None | React / Vite dashboard |
| **Tests** | None | pytest + FastAPI TestClient |
| **Docs** | Minimal README | 1,200+ lines of guides |

---

## Quick Start (TL;DR)

```bash
# 1. Run the helper script
./scripts/prepare-upstream-pr.sh

# 2. Follow the interactive prompts
```

Or, if you already know what you want:

```bash
# Just show what changed vs upstream
./scripts/prepare-upstream-pr.sh --status

# Generate a patch file
./scripts/prepare-upstream-pr.sh --patch

# Print GitHub PR instructions
./scripts/prepare-upstream-pr.sh --pr-instructions
```

---

## Step-by-Step Guide

### Step 1 – Configure the upstream remote

```bash
# Add TrafficVision as the upstream remote (one-time setup)
git remote add trafficvision https://github.com/hrshbuilds/TrafficVision.git

# Verify
git remote -v
# origin        https://github.com/hrshbuilds/trafficgenie (fetch)
# trafficvision https://github.com/hrshbuilds/TrafficVision (fetch)
```

### Step 2 – Fetch the upstream state

```bash
git fetch trafficvision main
```

### Step 3 – Review the differences

```bash
# See which files changed
git diff --name-status trafficvision/main HEAD

# See the full diff
git diff trafficvision/main HEAD
```

### Step 4 – Choose how to propose the changes

#### Option A – GitHub Web UI *(easiest)*

1. Navigate to **<https://github.com/hrshbuilds/trafficgenie>** while logged in as `hrshbuilds`.
2. Click the **"Contribute"** button (shown when your fork is ahead of upstream).
3. Click **"Open pull request"**.
4. GitHub automatically sets `base: hrshbuilds/TrafficVision@main` ← `compare: hrshbuilds/trafficgenie@main`.
5. Fill in the title and description using the [template below](#pr-description-template).
6. Click **"Create pull request"**.

#### Option B – GitHub CLI

```bash
# Install gh CLI: https://cli.github.com/
gh pr create \
  --repo hrshbuilds/TrafficVision \
  --head hrshbuilds:main \
  --base main \
  --title "feat: full-stack upgrade – FastAPI, React, Firebase, Gemini AI" \
  --body-file UPSTREAM_CONTRIBUTION_GUIDE.md
```

#### Option C – Apply a patch manually

```bash
# 1. Generate the patch from inside trafficgenie
./scripts/prepare-upstream-pr.sh --patch
# Creates: ./upstream-patches/trafficgenie-changes-<timestamp>.patch

# 2. Clone TrafficVision locally
git clone https://github.com/hrshbuilds/TrafficVision trafficvision-local
cd trafficvision-local

# 3. Create a feature branch
git checkout -b feat/trafficgenie-upgrade

# 4. Apply the patch
git apply ../trafficgenie/upstream-patches/trafficgenie-changes-<timestamp>.patch

# 5. Commit and push
git add .
git commit -m "feat: upgrade to TrafficGenie full-stack architecture"
git push origin feat/trafficgenie-upgrade

# 6. Open a PR on GitHub
```

---

## What's Included in the Contribution

### New files introduced by TrafficGenie

#### Backend
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI application entry point |
| `backend/fastapi_db.py` | SQLAlchemy engine + session factory |
| `backend/fastapi_models.py` | ORM models (Violation, Challan, VideoUpload) |
| `backend/fastapi_schemas.py` | Pydantic request/response schemas |
| `backend/config.py` | Centralised app configuration |
| `backend/server.py` | Uvicorn launcher |
| `backend/services/detection_service.py` | Detection orchestration |
| `backend/services/firebase_service.py` | Firebase Firestore + Storage |
| `backend/services/gemini_service.py` | Google Gemini AI integration |
| `backend/services/video_processor.py` | Video processing pipeline |
| `backend/services/violation_service.py` | Violation CRUD + business logic |
| `backend/apps/detection/` | Django-style app structure (models, views, serializers) |
| `backend/core/` | ASGI/WSGI, settings, URL router, exception handlers |
| `backend/tests/conftest.py` | pytest fixtures + test suite |
| `backend/requirements.txt` | Complete dependency manifest |
| `backend/.env.example` | Environment variable template |

#### Frontend (new – not present in TrafficVision)
| Path | Purpose |
|------|---------|
| `frontend/src/` | React + Vite application source |
| `frontend/src/pages/AdminDashboard.jsx` | Main dashboard |
| `frontend/src/components/` | Reusable UI components |
| `frontend/src/hooks/` | Custom React hooks (data fetching, auth, real-time) |
| `frontend/src/services/` | API service layer |
| `frontend/src/firebase/` | Firebase client configuration |
| `frontend/src/context/AuthContext.jsx` | Authentication context |

### Modified files

| File | Change |
|------|--------|
| `backend/detect.py` | Unchanged from upstream (kept for compatibility) |
| `backend/violation_logic.py` | Unchanged from upstream (kept for compatibility) |
| `README.md` | Expanded with setup and usage instructions |

---

## PR Description Template

Copy and paste this when opening the PR on GitHub:

```markdown
## Summary

This PR brings the full TrafficGenie feature set into TrafficVision, evolving
it from a standalone detection script into a production-ready, full-stack
traffic violation management system.

## What changed

### Backend
- 🏗️  Replaced script-based detection with a **FastAPI REST API**
- 🗄️  Added **SQLAlchemy ORM** models and Alembic database migrations
- 🔥  Integrated **Firebase Firestore** (violation storage) and **Cloud Storage**
       (frame images, video uploads)
- 🤖  Added **Google Gemini AI** for natural-language violation insights
- 📹  Built a **video processing pipeline** (upload → detect → store → notify)
- 🛡️  Added structured error handling and JSON logging

### Frontend (new)
- 🎨  **React / Vite dashboard** with real-time violation feed
- 👤  Firebase Authentication (sign-up / sign-in)
- 📊  Analytics page with violation trends
- 🔔  Live alerts for new violations

### Quality
- 🧪  **pytest** test suite with FastAPI TestClient and in-memory SQLite
- 📚  1,200+ lines of API, deployment, and quick-start documentation
- 🐳  Production deployment guide (Docker + cloud options)

## Testing

See [QUICK_START_LOCAL.md](./QUICK_START_LOCAL.md) for local setup instructions.

## Breaking changes

None. The original `detect.py` and `violation_logic.py` scripts are preserved
and continue to work exactly as before.
```

---

## Keeping Your Fork in Sync

After the PR is merged, keep your fork up to date with:

```bash
# Fetch latest upstream changes
git fetch trafficvision main

# Merge them into your main branch
git checkout main
git merge trafficvision/main

# Push to your fork
git push origin main
```

---

## Need Help?

- Open an issue on [hrshbuilds/TrafficVision](https://github.com/hrshbuilds/TrafficVision/issues)
- Or on this repository: [hrshbuilds/trafficgenie](https://github.com/hrshbuilds/trafficgenie/issues)
