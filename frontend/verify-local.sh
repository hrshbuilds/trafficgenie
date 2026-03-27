#!/usr/bin/env bash

# TrafficVision Frontend - Local Verification Script
# Tests that all key systems are working locally

set -e

echo "🚀 TrafficVision Frontend - Local Verification"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "✓ Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}$NODE_VERSION${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
    exit 1
fi

# Check npm
echo -n "✓ Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}$NPM_VERSION${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
    exit 1
fi

# Check if node_modules exists
echo -n "✓ Checking dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}Installed${NC}"
else
    echo -e "${YELLOW}Not found, installing...${NC}"
    cd frontend && npm install && cd ..
fi

# Check environment files
echo -n "✓ Checking .env files... "
if [ -f "frontend/.env" ] && [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}Found${NC}"
else
    echo -e "${RED}Missing (required for local dev)${NC}"
    echo "   Please create .env and .env.local files"
    exit 1
fi

# Verify Firebase config
echo -n "✓ Checking Firebase config... "
if grep -q "VITE_FIREBASE_API_KEY" frontend/.env.local; then
    echo -e "${GREEN}Configured${NC}"
else
    echo -e "${RED}Not configured${NC}"
    echo "   Please add Firebase API key to .env.local"
    exit 1
fi

# Check ESLint config
echo -n "✓ Checking ESLint config... "
if [ -f "frontend/eslint.config.js" ]; then
    echo -e "${GREEN}Found${NC}"
else
    echo -e "${YELLOW}Missing (optional)${NC}"
fi

# Verify key source files exist
echo -n "✓ Checking source files... "
KEY_FILES=(
    "frontend/src/pages/AdminDashboard.jsx"
    "frontend/src/components/alerts/LiveIndicator.jsx"
    "frontend/src/components/analytics/AIInsights.jsx"
    "frontend/src/components/violations/RiskBadge.jsx"
    "frontend/src/hooks/useRealtimeStats.js"
)

FILES_FOUND=0
for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        ((FILES_FOUND++))
    fi
done

if [ $FILES_FOUND -eq ${#KEY_FILES[@]} ]; then
    echo -e "${GREEN}All ${FILES_FOUND} files${NC}"
else
    echo -e "${RED}Only ${FILES_FOUND}/${#KEY_FILES[@]} files${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start the dev server:"
echo "   cd frontend && npm run dev"
echo ""
echo "2. Open in browser:"
echo "   http://localhost:5173"
echo ""
echo "3. Run tests:"
echo "   See LOCAL_TESTING_GUIDE.md for full checklist"
echo ""
echo "4. View in Codespace:"
echo "   - Port 5173 should be forwarded automatically"
echo "   - Or use: gh codespace ports visibility 5173:public"
echo ""
echo "================================================"
