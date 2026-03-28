# Production Deployment Guide

> Complete guide for deploying TrafficGenie backend to production environments

---

## Table of Contents

1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Google Cloud Run](#google-cloud-run)
5. [Docker & Container Registry](#docker-and-container-registry)
6. [Environment Variables](#environment-variables)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Logging](#monitoring-and-logging)
9. [Backup & Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

---

## Pre-deployment Checklist

### Code Quality
- [ ] All tests passing: `pytest tests/ -v`
- [ ] Linting clean: `flake8 . --exclude migrations`
- [ ] Type checking complete: `mypy services/`
- [ ] No hardcoded secrets in code
- [ ] No print() statements (use logger)
- [ ] Error handling comprehensive
- [ ] Async operations properly handled

### Configuration
- [ ] `.env.example` is up-to-date
- [ ] All required ENV vars documented
- [ ] Production settings validated
- [ ] CORS origins locked down (not "*")
- [ ] JWT secret is strong (32+ chars)
- [ ] Database URL is PostgreSQL (not SQLite)

### Dependencies
- [ ] `requirements.txt` is frozen with versions
- [ ] All dev dependencies in separate `requirements-dev.txt`
- [ ] No vulnerabilities: `pip audit`

### Credentials
- [ ] Firebase serviceAccountKey.json secure (not in repo)
- [ ] Gemini API key in secrets manager
- [ ] Database password in secrets manager
- [ ] JWT secret in secrets manager

### Documentation
- [ ] API endpoints documented
- [ ] Deployment procedure documented
- [ ] Runbook for common issues
- [ ] Architecture diagram available

---

## Environment Setup

### 1. Create Production Database

**PostgreSQL on Google Cloud SQL:**

```bash
# Create Cloud SQL instance
gcloud sql instances create trafficgenie-prod \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --availability-type=regional

# Create database
gcloud sql databases create trafficgenie \
  --instance=trafficgenie-prod

# Create user
gcloud sql users create trafficgenie \
  --instance=trafficgenie-prod \
  --password
```

**Connection string format:**
```
postgresql://trafficgenie:PASSWORD@/trafficgenie?host=/cloudsql/PROJECT:us-central1:trafficgenie-prod
```

### 2. Setup Firebase Project

```bash
# Authenticate
gcloud auth login

# Create Firebase project (if not exists)
firebase projects:create trafficgenie-prod

# Enable required services
gcloud services enable firestore.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable cloudkms.googleapis.com

# Create service account
gcloud iam service-accounts create trafficgenie-backend \
  --display-name="TrafficGenie Backend"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:trafficvision-backend@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:trafficvision-backend@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Generate key
gcloud iam service-accounts keys create firebase-key.json \
  --iam-account=trafficgenie-backend@$PROJECT_ID.iam.gserviceaccount.com
```

### 3. Setup Secrets Manager

```bash
# Store Firebase credentials
gcloud secrets create firebase-credentials \
  --replication-policy="automatic" \
  --data-file=firebase-key.json

# Store Gemini API key
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key

# Store JWT secret
openssl rand -base64 32 | gcloud secrets create jwt-secret

# Store database password
echo -n "your-database-password" | gcloud secrets create db-password

# Grant Cloud Run permission to access secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Database Migration

### Using Alembic

**Initial setup:**
```bash
# Create migration environment
alembic init migrations

# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

**During deployment:**
```bash
# In Cloud Run startup script:
alembic upgrade head
```

**Rollback (if needed):**
```bash
# List migration history
alembic history

# Rollback to specific revision
alembic downgrade -1
```

---

## Google Cloud Run Deployment

### Option 1: Deploy from Git

```bash
# Clone repository
git clone https://github.com/yourusername/trafficgenie.git
cd trafficgenie/backend

# Set project
gcloud config set project YOUR_PROJECT_ID

# Deploy directly from repository
gcloud run deploy trafficgenie-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --memory 1Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 10 \
  --set-env-vars ENV=production,DEBUG=False \
  --set-secrets DATABASE_URL=db-connection-string:latest \
  --set-secrets FIREBASE_CREDENTIALS_JSON=firebase-credentials:latest \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --allow-unauthenticated
```

### Option 2: Deploy from Container Registry

**Build and push image:**
```bash
# Set project
export PROJECT_ID=$(gcloud config get-value project)

# Build image
docker build -t gcr.io/$PROJECT_ID/trafficgenie-backend .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/trafficgenie-backend

# Deploy
gcloud run deploy trafficgenie-backend \
  --image gcr.io/$PROJECT_ID/trafficgenie-backend \
  --region us-central1 \
  --platform managed \
  --memory 1Gi \
  --cpu 2 \
  --set-secrets DATABASE_URL=db-connection-string:latest \
  --set-secrets FIREBASE_CREDENTIALS_JSON=firebase-credentials:latest \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --allow-unauthenticated
```

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m appuser
USER appuser

# Set environment
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Option 3: Deploy with CI/CD

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE: trafficvision-backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v3

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        
      - name: Authenticate
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Build and push image
        run: |
          gcloud builds submit \
            --region=$REGION \
            --tag gcr.io/$PROJECT_ID/$SERVICE

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE \
            --image gcr.io/$PROJECT_ID/$SERVICE \
            --platform managed \
            --region $REGION \
            --set-secrets DATABASE_URL=db-url:latest \
            --set-secrets FIREBASE_CREDENTIALS_JSON=firebase-creds:latest
```

---

## Docker and Container Registry

### Build Image

```bash
# Development build
docker build -t trafficvision-backend:latest .

# Production build with optimization
docker build -t trafficvision-backend:1.2.0 \
  --build-arg ENVIRONMENT=production .

# Multi-stage build (advanced)
docker build -f Dockerfile.prod -t trafficvision-backend:prod .
```

### Test Locally

```bash
# Run container locally
docker run -p 8000:8000 \
  -e ENV=development \
  -e DEBUG=False \
  -e DATABASE_URL=postgresql://... \
  trafficvision-backend:latest

# With environment file
docker run -p 8000:8000 \
  --env-file .env.prod \
  trafficvision-backend:latest

# With volume mounts (for debugging)
docker run -p 8000:8000 \
  -v $(pwd)/logs:/app/logs \
  trafficvision-backend:latest
```

### Push to Container Registry

```bash
# Authenticate
docker login gcr.io

# Tag image
docker tag trafficvision-backend:latest gcr.io/PROJECT_ID/trafficvision-backend:latest
docker tag trafficvision-backend:latest gcr.io/PROJECT_ID/trafficvision-backend:1.2.0

# Push
docker push gcr.io/PROJECT_ID/trafficvision-backend:latest
docker push gcr.io/PROJECT_ID/trafficvision-backend:1.2.0
```

---

## Environment Variables

### Production Configuration

```bash
# Application
ENV=production
DEBUG=False
APP_NAME=TrafficVision
APP_VERSION=1.2.0

# Server
HOST=0.0.0.0
PORT=8080
API_PREFIX=/api
ALLOWED_ORIGINS=https://trafficvision.com,https://admin.trafficvision.com

# Database (PostgreSQL in production)
DATABASE_URL=postgresql://user:pwd@cloud-sql-proxy/db
DB_POOL_SIZE=50
DB_MAX_OVERFLOW=80

# Firebase
FIREBASE_PROJECT_ID=trafficvision-prod
FIREBASE_CREDENTIALS_JSON=${SECRETS_MANAGER}  # Set via Cloud Run
FIREBASE_STORAGE_BUCKET=trafficvision.appspot.com

# Gemini
GEMINI_API_KEY=${SECRETS_MANAGER}  # Set via Cloud Run
GEMINI_MODEL=gemini-2.0-flash

# Storage
UPLOAD_DIR=/tmp/uploads
OUTPUT_DIR=/tmp/output
MAX_UPLOAD_SIZE_MB=500

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Feature Flags
DEMO_MODE=False
ENABLE_GEMINI_INSIGHTS=True
ENABLE_REAL_TIME_UPDATES=True
```

### Using Cloud Run Secrets

```bash
# Deploy with secrets
gcloud run deploy trafficvision-backend \
  --image gcr.io/PROJECT/trafficvision-backend \
  --set-secrets DATABASE_URL=db-url:latest \
  --set-secrets FIREBASE_CREDENTIALS_JSON=firebase-creds:latest \
  --set-secrets GEMINI_API_KEY=gemini-key:latest \
  --set-secrets JWT_SECRET=jwt-secret:latest
```

---

## Security Hardening

### 1. Network Security

```bash
# Restrict Cloud Run to VPC (if using)
gcloud run services update trafficvision-backend \
  --vpc-connector trafficvision-vpc \
  --vpc-egress private-ranges-only

# Enable VPC
gcloud compute networks vpc-connectors create trafficvision-vpc \
  --region us-central1 \
  --network default \
  --range 10.8.0.0/28
```

### 2. API Security

```python
# In production, enforce CORS strictly
ALLOWED_ORIGINS = [
    "https://trafficvision.com",
    "https://admin.trafficvision.com",
    "https://app.trafficvision.com",
]

# Rate limiting middleware (add to main.py)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/challans/{id}/review")
@limiter.limit("100/minute")
async def review_challan(...):
    ...
```

### 3. Database Security

```bash
# Create user with limited permissions
gcloud sql users create api_user \
  --instance=trafficvision-prod

# Grant minimal permissions
GRANT SELECT, INSERT, UPDATE ON trafficvision.* TO 'api_user'@'%';
GRANT SELECT ON trafficvision.* TO 'api_user'@'%';

# Require SSL
gcloud sql instances patch trafficvision-prod \
  --require-ssl \
  --backup-start-time=02:00
```

### 4. Secrets Management

```bash
# Rotate secrets regularly
gcloud secrets versions add firebase-credentials \
  --data-file=new-firebase-key.json

# Audit secret access
gcloud logging read "resource.type=secretmanager.googleapis.com" \
  --limit 10 \
  --format json
```

---

## Monitoring & Logging

### Cloud Logging

```bash
# View application logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=trafficvision-backend" \
  --limit 50 \
  --format json

# Search for errors
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit 20

# Stream logs in real-time
gcloud logging read "resource.type=cloud_run_revision" \
  --follow
```

### Cloud Monitoring

```bash
# Create uptime check
gcloud monitoring uptime create https://trafficvision.example.com/health

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Traffic Vision API Down"
```

---

## Backup & Recovery

### Database Backups

```bash
# Automated backups (configure in Cloud SQL)
gcloud sql backups create \
  --instance=trafficvision-prod \
  --description="Daily backup"

# List backups
gcloud sql backups describe abc123 \
  --instance=trafficvision-prod

# Restore from backup (DANGEROUS - test first!)
gcloud sql backups restore abc123 \
  --backup-instance=trafficvision-prod \
  --target-instance=trafficvision-prod
```

### Firestore Backups

```bash
# Export to Cloud Storage
gcloud firestore export gs://trafficvision-backups/$(date +%Y%m%d) \
  --collection-ids=violations,challans

# Import from backup
gcloud firestore import gs://trafficvision-backups/20260327T103000Z
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Check image
gcloud container images describe gcr.io/PROJECT/trafficvision-backend

# Debug locally
docker run -it --entrypoint /bin/bash gcr.io/PROJECT/trafficvision-backend
```

### Database Connection Issues

```bash
# Test connection
psql postgresql://user:pwd@host:5432/db

# Check Cloud SQL proxy
gcloud sql instances describe trafficvision-prod

# Verify firewall
gcloud compute firewall-rules list --filter="name:sql"
```

### High Memory Usage

```bash
# Check current usage
gcloud run services describe trafficvision-backend --format="value(status.traffic[0].percent)"

# Increase memory
gcloud run deploy trafficvision-backend \
  --image gcr.io/PROJECT/trafficvision-backend \
  --memory 2Gi
```

### Slow APIs

```bash
# Check Cloud Trace
gcloud trace list

# Enable Cloud Profiler
gcloud profiler create --service-name=trafficvision-backend

# Check database queries (enable DB_ECHO=True in dev only!)
export DATABASE_URL_ECHO=true
```

---

## Rollback Procedure

```bash
# List previous Cloud Run revisions
gcloud run revisions list --service trafficvision-backend

# Deploy previous version
gcloud run deploy trafficvision-backend \
  --image gcr.io/PROJECT/trafficvision-backend:v1.1.0

# Or traffic split
gcloud run services update trafficvision-backend \
  --traffic previous=50,latest=50
```

---

## Post-Deployment Checklist

- [ ] APIs responding: `curl https://backend.trafficvision.com/health`
- [ ] Database connected and migrated successfully
- [ ] Firebase services initialized
- [ ] Gemini API working
- [ ] Logs appearing in Cloud Logging
- [ ] Monitoring alerts configured
- [ ] Backups scheduled and tested
- [ ] SSL certificate valid
- [ ] CORS headers correct
- [ ] Rate limiting working
- [ ] Authentication enforced
- [ ] Load tested under expected traffic
- [ ] Documented incidents procedures

---

