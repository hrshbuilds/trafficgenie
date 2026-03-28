# TrafficGenie

> **Fork of [hrshbuilds/TrafficVision](https://github.com/hrshbuilds/TrafficVision)**
> — a full-stack upgrade that transforms the original detection script into a
> production-ready traffic violation management system.

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