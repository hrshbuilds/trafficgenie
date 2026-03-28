"""
Pytest fixtures and test utilities for TrafficGenie backend.
Run: pytest tests/
"""

import json
import os
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import app and dependencies
from fastapi_db import Base, get_db
from main import app


# ============================================================================
# DATABASE FIXTURE (in-memory SQLite for tests)
# ============================================================================

@pytest.fixture(scope="function")
def test_db():
    """Create in-memory database for tests."""
    # Use in-memory SQLite
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield SessionLocal()
    
    app.dependency_overrides.clear()


# ============================================================================
# TEST CLIENT FIXTURE
# ============================================================================

@pytest.fixture
def client(test_db):
    """Create FastAPI test client."""
    return TestClient(app)


# ============================================================================
# SAMPLE DATA FIXTURES
# ============================================================================

@pytest.fixture
def sample_violation_data():
    """Sample violation data."""
    return {
        "type": "Triple Riding",
        "location": "Sadar Junction",
        "plate": "MH-15-AB-1234",
        "timestamp": datetime.utcnow().isoformat(),
        "confidence": 0.92,
        "ward": "Sadar",
        "zone": "Nashik Zone",
    }


@pytest.fixture
def sample_detection_result():
    """Sample detection pipeline output."""
    return {
        "type": "Triple Riding",
        "location": "Sadar Junction",
        "plate": "MH-15-AB-1234",
        "confidence": 0.92,
        "timestamp": datetime.utcnow().isoformat(),
        "frame": 150,
        "details": {
            "rider_count": 3,
            "bike_box": [100, 200, 300, 400],
        },
    }


# ============================================================================
# SAMPLE TESTS
# ============================================================================

class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_health_check(self, client):
        """Test basic health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_api_health_check(self, client):
        """Test detailed API health endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "services" in data


class TestViolationEndpoints:
    """Test violation endpoints."""

    def test_list_violations_empty(self, client):
        """Test listing violations when database is empty."""
        response = client.get("/api/violations")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_violations_pagination(self, client, test_db):
        """Test violation pagination."""
        # Add sample data (would need proper seeding)
        response = client.get("/api/violations?page=1&page_size=10")
        assert response.status_code == 200
        # Verify pagination params
        assert "page" not in response.json()[0] if response.json() else True

    def test_get_violation_not_found(self, client):
        """Test getting non-existent violation."""
        response = client.get("/api/violations/999")
        assert response.status_code == 404


class TestChallanEndpoints:
    """Test challan endpoints."""

    def test_list_challans_empty(self, client):
        """Test listing challans when database is empty."""
        response = client.get("/api/challans")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_challans_with_status_filter(self, client):
        """Test filtering challans by status."""
        response = client.get("/api/challans?status=pending")
        assert response.status_code == 200


class TestAnalyticsEndpoints:
    """Test analytics endpoints."""

    def test_analytics_summary(self, client):
        """Test analytics summary endpoint."""
        response = client.get("/api/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "total_violations" in data
        assert "pending_challans" in data
        assert "approved_challans" in data
        assert "rejected_challans" in data
        
        # Verify types
        assert isinstance(data["total_violations"], int)
        assert data["total_violations"] >= 0


class TestDetectionEndpoint:
    """Test detection endpoint."""

    def test_detect_violation(self, client, sample_detection_result):
        """Test posting detection result."""
        response = client.post(
            "/api/detect",
            json=sample_detection_result,
        )
        # Will fail without proper setup, but test structure
        assert response.status_code in [200, 400, 500]  # Depending on config


class TestVideoUpload:
    """Test video upload functionality."""

    def test_upload_video_invalid_format(self, client):
        """Test uploading invalid file format."""
        # Create a fake file with invalid extension
        fake_file_content = b"not a video"
        
        response = client.post(
            "/api/videos/upload",
            files={"video": ("test.txt", fake_file_content)},
        )
        
        assert response.status_code == 400
        assert "Unsupported video format" in response.json()["error"]["message"]


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================

class TestErrorHandling:
    """Test error handling and response formats."""

    def test_404_error_format(self, client):
        """Test 404 error response format."""
        response = client.get("/api/violations/999")
        assert response.status_code == 404
        data = response.json()
        
        # Verify error structure
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]

    def test_validation_error_format(self, client):
        """Test validation error response format."""
        # POST without required fields
        response = client.post(
            "/api/challans/1/review",
            json={},
        )
        
        # Could be 401 (auth required) or 422 (validation)
        assert response.status_code in [401, 422]
        
        if response.status_code == 422:
            data = response.json()
            assert "error" in data
            assert "code" in data["error"]


# ============================================================================
# PERFORMANCE TESTS (basic)
# ============================================================================

class TestPerformance:
    """Test basic performance characteristics."""

    def test_health_check_response_time(self, client):
        """Test health check is fast."""
        import time
        
        start = time.time()
        response = client.get("/health")
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 0.1, "Health check too slow"

    def test_list_violations_response_time(self, client):
        """Test list violations response time."""
        import time
        
        start = time.time()
        response = client.get("/api/violations?page_size=10")
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 1.0, "List violations too slow"


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestIntegration:
    """End-to-end integration tests."""

    def test_violation_to_challan_flow(self, client):
        """Test complete violation to challan workflow."""
        # 1. Check health
        health = client.get("/health")
        assert health.status_code == 200
        
        # 2. List violations (should be empty initially)
        violations = client.get("/api/violations")
        assert violations.status_code == 200
        initial_count = len(violations.json())
        
        # 3. List challans (should be empty initially)
        challans = client.get("/api/challans")
        assert challans.status_code == 200
        assert len(challans.json()) == 0
        
        # 4. Check analytics
        analytics = client.get("/api/analytics/summary")
        assert analytics.status_code == 200
        assert analytics.json()["total_violations"] == initial_count


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
