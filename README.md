# TrafficGenie

> **Fork of [hrshbuilds/TrafficVision](https://github.com/hrshbuilds/TrafficVision)**
> — a full-stack upgrade that transforms the original detection script into a
> production-ready traffic violation management system.

---

## Brief Review

**TrafficGenie** is a full-stack traffic-violation management system built on top
of the YOLOv8 computer-vision model.  It automates the detection of road
violations (currently triple-riding on motorcycles), generates digital challans
(tickets), and gives traffic officers an AI-assisted dashboard to review and
manage those challans.

### How it works

1. **Video ingestion** – Officers or cameras upload MP4/AVI/MOV footage via a
   REST endpoint.
2. **YOLO detection** – A YOLOv8 model analyses each frame and flags frames
   where three or more people are detected on a single motorcycle.
3. **Violation & challan pipeline** – Detected frames are stored as evidence
   and a challan record is automatically created in the database.
4. **Gemini AI insights** – Google Gemini is called to generate a short natural-
   language summary and risk-level assessment for each violation.
5. **Officer dashboard** – A React/Vite single-page app lets officers search,
   filter, and review challans; Firebase Auth controls access by role.

### Tech stack at a glance

| Layer | Technology |
|-------|-----------|
| Detection | YOLOv8 (Ultralytics) |
| Backend API | FastAPI + SQLAlchemy (SQLite → Firestore path) |
| AI insights | Google Gemini |
| Auth & storage | Firebase Admin SDK |
| Frontend | React 18 + Vite |
| Real-time | Firebase Firestore listeners + WebSocket (in progress) |

### Strengths

* Clean separation between detection, API, and frontend concerns.
* Pydantic schemas on every endpoint give strong input validation out of the box.
* Firebase Auth integration means role-based access control is solved at the
  identity layer.
* Gemini AI adds a genuinely useful layer of insight rather than just raw
  bounding-box data.
* Well-documented — multiple guides cover local setup, API testing, and
  production deployment.

### Current limitations

* Detection pipeline is not yet wired into the async job queue, so long videos
  will block the API server.
* Firebase Storage integration is partially implemented; evidence images still
  use local disk paths in development.
* Alembic database migrations are not yet configured, making schema changes
  manual.
* CORS is open to `"*"` and should be locked down before production deployment.

### Overall verdict

TrafficGenie is a well-conceived project that successfully demonstrates how
computer vision, a modern REST API, and a reactive frontend can be combined into
a practical law-enforcement tool.  The foundation is solid; the main work
remaining is wiring the async job queue, completing the Firebase Storage/Firestore
migration, and adding comprehensive tests before the system is production-ready.

---

## What's new vs TrafficVision

| Feature | TrafficVision | TrafficGenie |
|---------|:-------------:|:------------:|
| Triple-riding detection (YOLO) | ✅ | ✅ |
| FastAPI REST API | ❌ | ✅ |
| React / Vite frontend dashboard | ❌ | ✅ |
| Firebase Firestore + Storage | ❌ | ✅ |
| Google Gemini AI insights | ❌ | ✅ |
| SQLAlchemy database + migrations | ❌ | ✅ |
| Video upload & processing pipeline | ❌ | ✅ |
| pytest test suite | ❌ | ✅ |
| Deployment guides | ❌ | ✅ |

---

## Quick start (local)

See **[QUICK_START_LOCAL.md](./QUICK_START_LOCAL.md)** for a step-by-step local
setup guide.

---

## Contributing changes back to TrafficVision

Want to propose these changes upstream? See
**[UPSTREAM_CONTRIBUTION_GUIDE.md](./UPSTREAM_CONTRIBUTION_GUIDE.md)** — or
run the helper script:

```bash
./scripts/prepare-upstream-pr.sh
```

---

## Documentation index

| Document | Description |
|----------|-------------|
| [QUICK_START_LOCAL.md](./QUICK_START_LOCAL.md) | Local development setup |
| [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) | REST API reference + curl examples |
| [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) | Cloud deployment |
| [BACKEND_AUDIT_REPORT.md](./BACKEND_AUDIT_REPORT.md) | Architecture overview |
| [UPSTREAM_CONTRIBUTION_GUIDE.md](./UPSTREAM_CONTRIBUTION_GUIDE.md) | How to contribute back to TrafficVision |