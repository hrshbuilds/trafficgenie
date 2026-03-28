# TrafficGenie Context-Aware AI System

## Overview

TrafficGenie now features a **context-aware AI assistant** that provides intelligent responses based on:
- **Current page** (where the user is in the app) 
- **Live data** (real-time violations, statistics, hotspots)
- **Database queries** (intelligent data retrieval and analysis)
- **User query** (natural language understanding via Gemini)

This creates a seamless, intelligent assistant that understands both the app state and the live traffic situation.

---

## Architecture

### 1. Frontend System

#### Components

##### **TrafficContextProvider** (`frontend/src/context/TrafficContextProvider.jsx`)
- Provides real-time traffic context across the entire app
- Tracks current page and page-specific data
- Maintains live violations and statistics
- Refreshes data every 10 seconds
- Exposes `getContextString()` for AI queries

**Key Methods:**
```javascript
updateCurrentPage(page, data)    // Update current page awareness
refreshData()                     // Force refresh of live data
getContextString()               // Get formatted context for AI
```

##### **ChatBot Component** (`frontend/src/components/ChatBot.jsx`)
- Floating chat interface accessible from any page
- Shows live data awareness and suggestions
- Displays conversation history
- Features quick action buttons
- Integrates with context provider

**Features:**
- 💬 Persistent chat window
- 🎯 Quick question suggestions
- 📊 Live stats display
- ✨ Context-aware responses
- 🔄 Auto-refresh on data changes

#### How It Works (Frontend)

```
User asks question
    ↓
ChatBot captures:
  - Current page (from TrafficContext)
  - Live statistics (from TrafficContext)
  - Recent violations (from TrafficContext)
  - Hotspots (from TrafficContext)
    ↓
Sends to /api/ask with full context
    ↓
Receives AI response + suggestions + stats
    ↓
Displays in chat with formatting
```

---

### 2. Backend System

#### New Endpoints

##### **POST `/api/ask`** - Context-Aware Query
```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the hotspots today?",
    "currentPage": "analytics",
    "pageData": {
      "selectedWard": "Sadar",
      "selectedZone": "Nashik Zone"
    }
  }'
```

**Response:**
```json
{
  "response": "Based on today's data, the hotspots are...",
  "context_used": true,
  "suggestions": [
    "Deploy more officers to Sadar Junction",
    "Review critical violations",
    "Check camera feeds"
  ],
  "live_stats": {
    "totalViolations": 45,
    "pendingChallans": 12,
    "approvedChallans": 28,
    "activeCameras": 5,
    "hotspots": [
      {"location": "Sadar Junction", "violation_count": 8},
      {"location": "MG Road Signal", "violation_count": 7}
    ]
  },
  "critical_violations_count": 3,
  "context_page": "analytics"
}
```

##### **GET `/api/context/summary`** - Live Context Summary
```bash
curl http://localhost:8000/api/context/summary
```

Returns current live statistics and hotspots without AI processing (faster for updates).

#### Services

##### **ContextAwareQueryService** (`backend/services/context_query_service.py`)

Database query service that provides intelligent data retrieval:

**Methods:**
```python
get_violations_summary(db, hours=24)      # Summary of violations
get_challan_summary(db)                   # Challan status breakdown  
get_hotspots(db, limit=5)                 # Top violation locations
get_active_cameras(db)                    # Camera status
get_critical_violations(db, limit=10)     # High-confidence violations
search_by_context(db, query_type, context) # Smart search
```

### Enhanced Gemini Service

**New Method:** `generate_context_aware_response()`

```python
result = gemini_service.generate_context_aware_response(
    user_query="What are top violations?",
    current_page="analytics",
    page_data={"selectedWard": "Sadar"},
    live_stats={...},
    recent_violations=[...],
    hotspots=[...]
)
```

**Returns:**
- Intelligent AI response
- Extracted actionable suggestions
- Context awareness flag
- Current page for verification

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│              TrafficGenie Frontend                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │    TrafficContextProvider                    │  │
│  │  • Tracks current page (live/violations/...) │  │
│  │  • Fetches live violations & stats (10s)     │  │
│  │  • Provides getContextString()               │  │
│  └──────────────────────────────────────────────┘  │
│                        │                            │
│                        ↓                            │
│  ┌──────────────────────────────────────────────┐  │
│  │    ChatBot Component                         │  │
│  │  • User enters query                         │  │
│  │  • Captures context from provider            │  │
│  │  • Sends to backend                          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
              (HTTP POST /api/ask)
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│           TrafficGenie FastAPI Backend              │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Endpoint: POST /api/ask                     │  │
│  │  • Receives query + page + data context      │  │
│  └──────────────────────────────────────────────┘  │
│                        │                            │
│                        ↓                            │
│  ┌──────────────────────────────────────────────┐  │
│  │  ContextAwareQueryService                    │  │
│  │  • Queries violations DB                     │  │
│  │  • Gets hotspots, cameras, stats             │  │
│  │  • Provides structured data                  │  │
│  └──────────────────────────────────────────────┘  │
│                        │                            │
│                        ↓                            │
│  ┌──────────────────────────────────────────────┐  │
│  │  GeminiService.generate_context_aware_...()  │  │
│  │  • Builds enriched prompt with all context   │  │
│  │  • Sends to Google Gemini API                │  │
│  │  • Extracts suggestions from response        │  │
│  └──────────────────────────────────────────────┘  │
│                        │                            │
│                        ↓                            │
│              Returns AI response                    │
│  + suggestions + live stats + context flag          │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│       ChatBot Displays Response to User             │
│  • Shows AI response                                │
│  • Lists suggested actions                          │
│  • Displays relevant live stats                     │
│  • Indicates context used                           │
└─────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Example 1: Analytics Page Query

**User is on Analytics page, views "Sadar" ward**
```
User: "Should I deploy more officers?"
```

**Context Sent to Backend:**
```json
{
  "query": "Should I deploy more officers?",
  "currentPage": "analytics",
  "pageData": {
    "selectedWard": "Sadar",
    "selectedZone": "Nashik Zone",
    "activeCamera": "CAM-01"
  }
}
```

**AI Response:**
```
Based on your view of Sadar ward in Nashik Zone:
- 8 violations detected today in Sadar Junction
- 3 critical violations (>90% confidence)
- Peak activity between 12-2 PM

Recommendations:
✓ Deploy additional officers to Sadar Junction
✓ Focus on triple-riding violations (highest frequency)
✓ Review camera CAM-01 feed for pattern analysis
```

### Example 2: Violations Page Query

**User is on Violations tab, searching for MH-15-AB-*:**
```
User: "Pattern analysis for this plate?"
```

**AI Response Includes:**
- Detection history
- Risk assessment
- Recommended actions

---

## Features

### 🎯 Page Context Awareness
- AI knows which page user is on (live, violations, analytics, etc.)
- Responses tailored to current view
- Page-specific data included in analysis

### 📊 Live Data Integration
- Real-time violations count
- Challan status breakdown
- Active camera count
- Hotspot identification

### 🤖 Intelligent Responses
- Suggests actionable items
- Extracts from AI response automatically
- Displays relevant statistics
- Shows context usage confirmation

### 💡 Quick Actions
- Quick question buttons for first-time users
- Suggestion buttons for next steps
- Easy follow-up queries

### 📱 Responsive Design
- Works on desktop, tablet, mobile
- Adaptive chat window sizing
- Touch-friendly interface
- Minimal performance impact

---

## Integration Points

### Adding Context Awareness to New Pages

1. **In the page component** - ensure it uses `useTrafficContext`:

```javascript
import { useTrafficContext } from '../context/TrafficContextProvider';

export function MyNewPage() {
  const { updateCurrentPage } = useTrafficContext();
  
  useEffect(() => {
    updateCurrentPage('my-page', {
      myData: 'value',
      filters: {...}
    });
  }, []);
  
  return <div>Page content</div>;
}
```

2. **AI will automatically be aware** of:
   - Current page name
   - Page-specific data
   - Live violations
   - Current statistics

### Customizing AI Responses

Edit the prompt template in `generate_context_aware_response()`:

```python
# In backend/services/gemini_service.py
prompt = f"""You are TrafficGenie - an AI assistant for traffic violation management.
[... customize your prompt here ...]
"""
```

---

## Configuration

### Update Frequency
Edit in `TrafficContextProvider.jsx`:
```javascript
// Refresh data every N milliseconds
updateIntervalRef.current = setInterval(updateData, 10000); // 10 seconds
```

### Context String Format
Customize the format in `TrafficContextProvider.jsx`:
```javascript
const getContextString = useCallback(() => {
  return `
CURRENT CONTEXT:
- Page: ${currentPage}
- Page Data: ${JSON.stringify(pageData, null, 2)}
...
  `.trim();
}, [...]);
```

---

## Troubleshooting

### ChatBot not responding
1. Check backend is running: `python main.py`
2. Verify Gemini API key in `.env`
3. Check browser console for errors
4. Test `/api/health` endpoint

### Outdated live data
1. Check network tab - requests should fire every 10s
2. Verify fetch endpoints are correct
3. Check database connection

### AI responses too generic
1. Verify page context is being sent
2. Add more specific data to `pageData`
3. Check Gemini API is working (`/api/health`)
4. Review prompt template in gemini_service.py

---

## Technical Specifications

### Frontend Stack
- React 18 + Hooks
- Context API for state management
- CSS with animations
- Fetch API for HTTP

### Backend Stack
- FastAPI (Python)
- SQLAlchemy ORM
- Google Gemini API
- Pydantic schemas

### Database Queries
- SQLAlchemy query optimization
- Efficient aggregations for hotspots
- Pagination for large datasets
- Real-time data availability

---

## Files Modified/Created

### New Files
- `frontend/src/context/TrafficContextProvider.jsx` - Context provider
- `frontend/src/components/ChatBot.jsx` - Chat UI component
- `frontend/src/components/ChatBot.css` - Chat styles
- `backend/services/context_query_service.py` - Database query service
- `docs/CONTEXT_AWARE_SYSTEM.md` - This documentation

### Modified Files
- `frontend/src/App.jsx` - Added TrafficContextProvider & ChatBot
- `frontend/src/pages/AdminDashboard.jsx` - Added context tracking
- `backend/main.py` - Added /api/ask & /api/context/summary endpoints
- `backend/services/gemini_service.py` - Added context-aware method

---

## Future Enhancements

### Planned Features
- [ ] Conversation persistence (save chat history)
- [ ] User preferences for response style
- [ ] Multi-language support (Hindi, Marathi)
- [ ] Predictive suggestions based on time of day
- [ ] Integration with WhatsApp/Telegram
- [ ] Voice input support
- [ ] Advanced analytics charts in chat

### Optimization Ideas
- Cache frequent queries
- Implement response debouncing
- Add fuzzy search for violations
- Create intent classification layer

---

## Support & Questions

For issues or feature requests:
1. Check troubleshooting section above
2. Review browser console for errors
3. Check backend logs: `tail -f logs/app.log`
4. Test individual endpoints with curl

---

**Last Updated:** March 28, 2026
**Version:** 1.0
**Status:** Production Ready ✅
