# 🎯 TrafficGenie Context-Aware AI - Quick Reference

## ⚡ Quick Start (2 minutes)

```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend  
cd frontend && npm run dev

# Visit: http://localhost:5173
```

---

## 💬 How to Use the Chat

1. **Click** 💬 button (bottom-right)
2. **Type** your question OR click a quick question
3. **Get** AI response with suggestions & live stats

Example questions:
- "What are the hotspots today?"
- "How many violations pending?"  
- "Should I deploy more officers?"
- "Show me critical violations"

---

## 🔧 Key Files & Locations

### Frontend
```
frontend/src/
├── context/
│   └── TrafficContextProvider.jsx    ← Context management
├── components/
│   ├── ChatBot.jsx                   ← Chat widget
│   └── ChatBot.css                   ← Chat styles
├── App.jsx                            ← App wrapper (modified)
└── pages/
    └── AdminDashboard.jsx            ← Dashboard (modified)
```

### Backend
```
backend/
├── main.py                           ← New endpoints (modified)
├── services/
│   ├── gemini_service.py             ← AI service (modified)
│   └── context_query_service.py      ← DB queries (NEW)
└── config.py
```

---

## 🚀 API Endpoints

### Context-Aware Query
```
POST /api/ask
Content-Type: application/json

{
  "query": "What are the hotspots?",
  "currentPage": "analytics",
  "pageData": {
    "selectedWard": "Sadar",
    "selectedZone": "Nashik Zone"
  }
}

Response:
{
  "response": "AI-generated response...",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "live_stats": {...},
  "context_used": true
}
```

### Quick Stats
```
GET /api/context/summary

Response: {
  "violations": {...},
  "challans": {...},
  "hotspots": [...],
  "timestamp": "..."
}
```

### Health Check
```
GET /api/health

Response: {
  "status": "ok",
  "services": {
    "firebase": true,
    "gemini": true,
    "database": true
  }
}
```

---

## 📊 Data Flow Diagram (Simple)

```
User Input
    ↓
ChatBot (Frontend)
    ├─ Capture page context
    ├─ Get live statistics
    └─ Send query + context
    ↓
Backend /api/ask
    ├─ ContextAwareQueryService
    │  ├─ Query database
    │  └─ Get hotspots, stats
    ├─ GeminiService
    │  ├─ Build enriched prompt
    │  ├─ Call Gemini API
    │  └─ Extract suggestions
    └─ Return response + stats
    ↓
ChatBot Display
    ├─ Show response
    ├─ List suggestions
    └─ Display stats
```

---

## 🎓 Understanding the System

### TrafficContextProvider (Frontend)
**What it does:** Tracks page & fetches live data  
**When to use:** All pages (wrapped in App)  
**How it works:** 10-second refresh cycle  

```javascript
const { 
  currentPage,        // e.g., "analytics"
  pageData,          // {selectedWard, selectedZone, ...}
  liveViolations,    // Recent violations
  liveStats,         // Totals, pending, approved, cameras
  updateCurrentPage, // Call on page change
  getContextString   // Get formatted context
} = useTrafficContext();
```

### ChatBot (Frontend)  
**What it does:** Provides UI for asking questions  
**When to use:** Already integrated globally  
**How it works:** Captures context + sends to backend  

```javascript
// Already mounted in App.jsx
<ChatBot />
```

### ContextAwareQueryService (Backend)
**What it does:** Queries database for context  
**When to use:** Called by /api/ask endpoint  
**How it works:** SQLAlchemy queries + aggregations  

```python
query_service.get_violations_summary(db, hours=24)
query_service.get_hotspots(db, limit=5)
query_service.get_critical_violations(db)
```

### GeminiService Enhancement (Backend)
**What it does:** Generates context-aware AI responses  
**When to use:** Called by /api/ask endpoint  
**How it works:** Builds prompt + calls Gemini API  

```python
response = gemini_service.generate_context_aware_response(
    user_query="...",
    current_page="analytics",
    page_data={...},
    live_stats={...},
    recent_violations=[...],
    hotspots=[...]
)
```

---

## 🧪 Quick Testing

### Test in Browser
```javascript
// DevTools Console
fetch('http://localhost:8000/api/ask', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    query: "Test query",
    currentPage: "analytics",
    pageData: {}
  })
}).then(r => r.json()).then(console.log)
```

### Test with cURL
```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"Test","currentPage":"analytics","pageData":{}}'
```

### Test Context Loading
```bash
curl http://localhost:8000/api/context/summary | jq
```

---

## 🔍 Debugging Checklist

- [ ] Backend running? `python main.py`
- [ ] Frontend running? `npm run dev`
- [ ] Gemini key set? `echo $GEMINI_API_KEY`
- [ ] Database available? `curl http://localhost:8000/api/health`
- [ ] Chat button visible? Look bottom-right
- [ ] No console errors? F12 → Console
- [ ] Response timeout? Check backend logs

---

## 📈 Performance Tips

1. **Data refresh rate** - Edit interval in TrafficContextProvider.jsx (default 10s)
2. **Query optimization** - Use database indexes for large datasets
3. **Cache responses** - Consider Redis for frequently asked questions
4. **Batch requests** - Multiple questions → combine into one call

---

## 🔐 Configuration

### Environment Variables (Backend)
```bash
GEMINI_API_KEY=your-key-here
DEMO_MODE=false
DEBUG=true/false
ENV=development/production
```

### Feature Flags
```python
# In config.py
DEMO_MODE = False  # Skip auth
DEBUG = True       # Detailed logging
```

---

## 📋 Common Tasks

### Add New Quick Question
**File:** `frontend/src/components/ChatBot.jsx`
```javascript
const quickQuestions = [
  "🔴 What are the hotspots today?",
  "📊 How many violations pending?",
  "⚠️ Show critical violations",
  "🎯 Deployment suggestions?",
  "YOUR_NEW_QUESTION"  // Add here
];
```

### Modify AI Response Template
**File:** `backend/services/gemini_service.py`
```python
def _build_context_prompt(self, ...):
    # Edit the prompt template here
    prompt = f"""You are TrafficGenie AI...
    [customize your template]
    """
    return prompt
```

### Change Data Refresh Rate
**File:** `frontend/src/context/TrafficContextProvider.jsx`
```javascript
// Change 10000 (milliseconds) to desired interval
updateIntervalRef.current = setInterval(updateData, 10000);
```

---

## 🐛 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Chat won't open | Hard refresh (Ctrl+Shift+R) |
| No AI response | Check backend running & Gemini key |
| Old data showing | Restart backend, clear cache |
| Slow responses | Check Gemini API, database size |
| Page context wrong | Verify updateCurrentPage() called |

---

## 📚 Documentation Map

| Doc File | Purpose |
|----------|---------|
| IMPLEMENTATION_SUMMARY.md | Overview & quick start |
| CONTEXT_AWARE_SYSTEM.md | Complete technical guide |
| TESTING_CONTEXT_AWARE.md | Testing & benchmarks |
| ARCHITECTURE_DETAILED.md | System design & diagrams |
| This file | Quick reference |

---

## ✨ Pro Tips

1. **Tip:** Use quick questions first to understand system
2. **Tip:** Check `/api/health` to verify all services
3. **Tip:** Use browser DevTools to monitor API calls
4. **Tip:** Check backend logs: `tail -f logs/app.log`
5. **Tip:** Test individual endpoints with cURL first

---

## 🚀 Deployment Steps

1. Set environment variable: `GEMINI_API_KEY`
2. Run backend: `python main.py`
3. Build frontend: `npm run build`
4. Serve frontend from static folder
5. Configure CORS for production domain
6. Set up monitoring & logging
7. Enable HTTPS
8. Run health checks

---

## 🆘 Getting Help

1. **Documentation** - Check the 4 doc files
2. **Logs** - Backend: `logs/app.log`, Frontend: Browser console
3. **API** - Test endpoints with cURL
4. **Database** - Check SQLite with `sqlite3 app.db`

---

## 📞 Quick Contact Points

- **Errors** - Check browser console (F12)
- **Backend logs** - Check /logs/app.log  
- **API issues** - Test with /api/health
- **Database issues** - Check database connection
- **Performance** - Check DevTools Performance tab

---

**Reference Version:** 1.0  
**Last Updated:** March 28, 2026  
**For Full Docs:** See other markdown files in root
