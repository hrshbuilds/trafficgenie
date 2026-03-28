# TrafficGenie Context-Aware AI - Quick Testing Guide

## Quick Start

### 1. Start Backend
```bash
cd backend
python main.py
```

Verify: http://localhost:8000/api/health

### 2. Start Frontend  
```bash
cd frontend
npm run dev
```

Visit: http://localhost:5173

---

## Testing Scenarios

### Scenario 1: Dashboard Context Awareness

**Steps:**
1. Open http://localhost:5173 (login if needed)
2. Go to **Admin Dashboard** → **Live Violations** tab
3. Click the **💬 Chat Button** (bottom-right)
4. Try: `"What are the hotspots today?"`

**Expected:**
- Chat opens with TrafficGenie greeting
- AI responds based on LIVE data
- Shows stat breakdown
- Suggests deployment actions

**Sample Response:**
```
Based on today's data, the hotspots are:

1. Sadar Junction - 8 violations
2. MG Road Signal - 7 violations  
3. College Road - 5 violations

Recommendations:
✓ Deploy additional officers to Sadar Junction (peak area for triple-riding)
✓ Increase camera coverage at MG Road (red light violations trending)
✓ Review camera feeds at 12-2 PM (peak violation time)
```

---

### Scenario 2: Page-Specific Context

**Test on Different Pages:**

#### Live Tab
```
Question: "How many critical violations do we have?"

Response will reference: Current live violations, recent detections
```

#### Analytics Tab  
```
Question: "Should I increase officer count?"

Response will reference: Ward selection, statistics, trends
```

#### Violations Tab
```
Question: "What violations are most common?"

Response will reference: Filtered violations, plate patterns
```

#### Hotspot Heatmap
```
Question: "Where should we focus resources?"

Response will reference: Map data, zone information
```

---

### Scenario 3: Quick Actions

**Test:**
1. Open chat (first time)
2. See quick question buttons:
   - 🔴 "What are the hotspots today?"
   - 📊 "How many violations pending?"
   - ⚠️ "Show critical violations"
   - 🎯 "Deployment suggestions?"
3. Click any button
4. AI responds with context

---

### Scenario 4: Live Data Updates

**Test:**
1. Open chat
2. Ask: `"What's the current violation count?"`
3. Wait 10 seconds (data refresh interval)
4. Ask again: `"Any new violations since last check?"`

**Expected:**
- AI acknowledges live data refresh
- Shows updated statistics
- Reflects new violations if added

---

## API Testing

### Test Context-Aware Endpoint Directly

```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the most dangerous violations today?",
    "currentPage": "analytics",
    "pageData": {
      "selectedWard": "Sadar",
      "selectedZone": "Nashik Zone",
      "activeCamera": "CAM-01"
    }
  }'
```

**Expected Response:**
```json
{
  "response": "Based on today's violations in Sadar ward...",
  "context_used": true,
  "suggestions": [
    "Deploy officers to high-risk zones",
    "Review critical violations immediately",
    "Check camera feeds"
  ],
  "live_stats": {
    "totalViolations": 45,
    "pendingChallans": 8,
    "approvedChallans": 25,
    "activeCameras": 5,
    "hotspots": [...]
  },
  "critical_violations_count": 3,
  "context_page": "analytics"
}
```

### Test Context Summary Endpoint

```bash
curl http://localhost:8000/api/context/summary
```

**Response:**
```json
{
  "violations": {
    "total": 45,
    "by_type": {"Triple Riding": 12, "No Helmet": 8, ...},
    "by_zone": {"Nashik Zone": 40, ...},
    "by_location": {...},
    "confidence_avg": 87.5,
    "high_confidence": 28
  },
  "challans": {
    "total": 45,
    "pending": 8,
    "reviewed": 12,
    "approved": 25,
    "rejected": 0,
    "pending_percentage": 17.8,
    "approved_percentage": 55.6
  },
  "hotspots": [
    {"location": "Sadar Junction", "violation_count": 8, ...},
    ...
  ],
  "timestamp": "2024-03-28T13:45:30.123456"
}
```

---

## Test Cases Checklist

### Frontend Tests
- [ ] ChatBot toggle button appears
- [ ] Chat window opens/closes smoothly
- [ ] Quick questions display on first load
- [ ] User message appears in chat
- [ ] Loading state shows during query
- [ ] AI response displays correctly
- [ ] Suggestions are clickable
- [ ] Live stats display in response
- [ ] Context badge shows current page
- [ ] Chat logs into local state

### Backend Tests
- [ ] `/api/ask` returns valid response
- [ ] Context is properly used in prompt
- [ ] Gemini API integration works
- [ ] Database queries execute smoothly
- [ ] Error handling for missing data
- [ ] Response time < 5 seconds
- [ ] `/api/context/summary` returns data
- [ ] Multiple concurrent requests work

### Integration Tests
- [ ] Chat context matches current page
- [ ] Live data updates reflect in responses
- [ ] Page navigation updates context
- [ ] Data is fresh (10s refresh working)
- [ ] Suggestions are relevant to context
- [ ] Stats in response match database

---

## Performance Benchmarks

Target metrics:
- AI response time: < 5 seconds
- Data refresh interval: 10 seconds
- Chat UI responsiveness: < 100ms
- API endpoint latency: < 2 seconds

**Test with:**
```bash
# Backend performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/context/summary

# Frontend performance
# Open DevTools → Performance tab → Record → Ask question → Stop
```

---

## Debugging

### Enable Frontend Debug Logs
In `ChatBot.jsx`, add:
```javascript
console.log('ChatBot:', { currentPage, pageData, liveStats });
```

### Enable Backend Debug Logs
In `main.py`:
```python
app_logger.info(f"Query received: {user_query}")
app_logger.info(f"Context used: {live_stats}")
```

### Test Individual Components

**Test TrafficContext:**
```javascript
// In browser console
import { useTrafficContext } from './context/TrafficContextProvider';
const ctx = useTrafficContext();
console.log('Context:', ctx.getContextString());
```

**Test Gemini Service:**
```bash
python
>>> from backend.services.gemini_service import gemini_service
>>> gemini_service.is_available()
True
>>> gemini_service.generate_constraint_response("Test prompt")
```

---

## Common Issues & Solutions

### Issue: Chat not opening
**Solution:**
1. Check browser console (F12) for errors
2. Verify frontend is running
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)

### Issue: No response from AI
**Solution:**
1. Check backend is running: `python main.py`
2. Verify Gemini key: `echo $GEMINI_API_KEY`
3. Test endpoint: `curl http://localhost:8000/api/health`
4. Check backend logs for errors

### Issue: Old data in responses
**Solution:**
1. Backend cache - restart server
2. Frontend cache - hard refresh
3. Check data refresh interval
4. Test `/api/context/summary` manually

### Issue: Chat appears slow
**Solution:**
1. Check network tab (DevTools)
2. Verify database not overloaded
3. Check if Gemini API is slow
4. Profile with React DevTools

---

## Test Data

The system comes with seed data:
- **5 violations** (various types and zones)
- **5 cameras** (different locations)
- **1 zone** (Nashik)
- **Multiple challans** (different statuses)

To regenerate:
```bash
# Backend
python
>>> from seeds import seed_database_comprehensive
>>> from fastapi_db import SessionLocal
>>> db = SessionLocal()
>>> seed_database_comprehensive(db)
```

---

## Success Criteria

✅ **System is working if:**
1. ChatBot opens and closes smoothly
2. Quick questions trigger AI responses
3. Page context is shown in badge
4. Live stats display in response
5. Suggestions are relevant
6. No console errors
7. Response time < 5 seconds
8. Works on all pages (live, analytics, violations, etc)

---

## Next Steps

After testing:
1. Try different queries on each page
2. Test with different filters applied
3. Monitor performance metrics
4. Gather user feedback
5. Iterate on response templates
6. Add more quick questions

---

**Testing Last Updated:** March 28, 2026
**Status:** Ready for QA ✅
