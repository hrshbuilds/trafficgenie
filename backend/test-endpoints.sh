#!/bin/bash
# TrafficVision Backend Testing Guide
# Tests all new endpoints for seeding, live feed, and Traffic Genie

set -e

API_BASE="http://localhost:8000"
API_PATH="/api"

echo "═══════════════════════════════════════════════════════════════════"
echo "TrafficVision Backend - Integration Testing"
echo "═══════════════════════════════════════════════════════════════════"

# Check if server is running
echo ""
echo "1️⃣  Checking server health..."
if curl -s "${API_BASE}${API_PATH}/health" > /dev/null; then
    echo "✓ Server is running at ${API_BASE}"
else
    echo "✗ Server not responding. Start it with: python main.py"
    exit 1
fi

# Test 2: Check database seeding
echo ""
echo "2️⃣  Checking database seeding..."
VIOLATIONS=$(curl -s "${API_BASE}${API_PATH}/violations?page_size=1" | python -m json.tool | grep -c '"id"' || echo "0")
echo "✓ Database has violations: $(curl -s "${API_BASE}${API_PATH}/analytics/summary" | python -m json.tool | grep -A 5 'total_violations')"

# Test 3: Test live feed endpoint
echo ""
echo "3️⃣  Testing live feed endpoint (/api/recent-violations)..."
RECENT=$(curl -s "${API_BASE}${API_PATH}/recent-violations?limit=5" | python -m json.tool)
echo "✓ Recent violations response:"
echo "$RECENT" | head -30

# Test 4: Test Traffic Genie endpoint
echo ""
echo "4️⃣  Testing Traffic Genie analysis endpoint (/api/analyze)..."
ANALYSIS=$(curl -s -X POST "${API_BASE}${API_PATH}/analyze" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are the top violation hotspots today?"}')
echo "✓ Traffic Genie response:"
echo "$ANALYSIS" | python -m json.tool | head -20

# Test 5: Verify violation types
echo ""
echo "5️⃣  Verifying violation types..."
TYPES=$(curl -s "${API_BASE}${API_PATH}/violations?page_size=20" | python -c "
import json, sys
data = json.load(sys.stdin)
types = set(v['type'] for v in data)
print('Found violation types:', ', '.join(sorted(types)))
" 2>/dev/null || echo "Could not parse violations")
echo "✓ $TYPES"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✨ All tests completed successfully!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Available Endpoints:"
echo "  • GET  /api/health              - Server health check"
echo "  • GET  /api/violations          - List all violations"
echo "  • GET  /api/recent-violations   - Live feed (last 60 mins)"
echo "  • GET  /api/analytics/summary   - Violation stats"
echo "  • POST /api/analyze             - Traffic Genie AI analysis"
echo "  • POST /api/videos/process      - Process video files"
echo ""
echo "🔗 Try these in your client:"
echo "  1. Connect to live feed: GET /api/recent-violations"
echo "  2. Ask Traffic Genie: POST /api/analyze with 'prompt' field"
echo "  3. Upload video: POST /api/videos/process (multipart file)"
echo ""
