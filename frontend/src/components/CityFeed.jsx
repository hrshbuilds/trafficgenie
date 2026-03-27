const FEED_DATA = [
  { emoji: '🪖', type: 'No Helmet', typeH: 'बिना हेलमेट', loc: 'Linking Road, Bandra', city: 'Mumbai', cam: 'CAM-04', pct: 92, status: 'urgent' },
  { emoji: '🚦', type: 'Signal Jump', typeH: 'सिग्नल उल्लंघन', loc: 'FC Road Chowk', city: 'Pune', cam: 'CAM-11', pct: 78, status: 'active' },
  { emoji: '👥', type: 'Triple Riding', typeH: 'तीन सवारी', loc: 'Shivaji Park, Dadar', city: 'Mumbai', cam: 'CAM-07', pct: 97, status: 'urgent' },
  { emoji: '🚗', type: 'Wrong Lane', typeH: 'गलत लेन', loc: 'Civil Lines, Sadar', city: 'Nagpur', cam: 'CAM-02', pct: 65, status: 'active' },
  { emoji: '🦺', type: 'Zebra Cross', typeH: 'ज़ेब्रा क्रॉसिंग', loc: 'MG Road Junction', city: 'Nashik', cam: 'CAM-09', pct: 88, status: 'resolved' },
  { emoji: '🪖', type: 'No Helmet', typeH: 'बिना हेलमेट', loc: 'Camp Road', city: 'Amravati', cam: 'CAM-03', pct: 94, status: 'urgent' },
];

const TICKER_ITEMS = [
  { emoji: '🪖', type: 'No Helmet · CAM-04', loc: 'Linking Rd, Bandra · 94%', statusLabel: '● URGENT', statusColor: '#ef5350' },
  { emoji: '🚦', type: 'Signal Jump · CAM-11', loc: 'FC Road, Pune · 89%', statusLabel: '● ACTIVE', statusColor: '#ffa726' },
  { emoji: '👥', type: 'Triple Riding · CAM-07', loc: 'Shivaji Park, Dadar · 97%', statusLabel: '● URGENT', statusColor: '#ef5350' },
  { emoji: '🚗', type: 'Wrong Lane · CAM-02', loc: 'Sadar, Nagpur · 82%', statusLabel: '● ACTIVE', statusColor: '#ffa726' },
  { emoji: '🦺', type: 'Zebra Cross · CAM-09', loc: 'MG Road, Nashik · 91%', statusLabel: '● RESOLVED', statusColor: '#52b788' },
];

const STATUS_MAP = {
  urgent: 'fcd-urgent',
  active: 'fcd-active',
  resolved: 'fcd-resolved',
};

export default function CityFeed() {
  return (
    <section className="city-feed-section" id="city-feed">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div className="feed-grid" style={{ marginBottom: '4rem', alignItems: 'start' }}>
          {/* Info panel */}
          <div>
            <span className="sec-tag reveal">Live Detections · लाइव पहचान</span>
            <h2 className="sec-title reveal d1" style={{ color: '#0B3D91' }}>Caught in the last <em>60 minutes.</em></h2>
            <p style={{ fontSize: '.95rem', lineHeight: 1.75, color: '#546E7A', marginBottom: '2rem', fontWeight: 300 }} className="reveal d2">
              Every violation auto-logged, timestamped, and dispatched to the nearest traffic unit.
              The feed updates every 5 seconds via WebSocket — no manual refresh needed.
            </p>
            <div className="feature-list reveal d2">
              {[
                { icon: '🔴', title: 'Urgent · URGENT', desc: 'Violation overdue for officer response — auto-escalated to zone command after 10 minutes.' },
                { icon: '🔵', title: 'Active · सक्रिय', desc: 'Detected and logged, alert dispatched. Officer on route or acknowledging.' },
                { icon: '🟢', title: 'Resolved · हल हुआ', desc: 'Officer responded, challan issued or situation cleared. Archived with full evidence trail.' },
              ].map((f) => (
                <div className="feat-item" key={f.title}>
                  <span className="feat-icon">{f.icon}</span>
                  <div><h4>{f.title}</h4><p>{f.desc}</p></div>
                </div>
              ))}
            </div>
            <button className="feat-cta reveal d3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              View Full Log · पूर्ण लॉग देखें
            </button>
          </div>

          {/* Live ticker card */}
          <div>
            <div className="v-card reveal">
              <div className="v-card-glow"></div>
              <div className="v-badge"><span className="v-icon">📡</span> Live Stream · ACTIVE</div>
              <h3>Incoming Violations — Right Now</h3>
              <p>Auto-refreshing feed from all 47 cameras. New entries appear at top as YOLOv8 detects violations frame by frame.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid rgba(232,93,38,.12)', marginBottom: '1.4rem' }}>
                {TICKER_ITEMS.map((item, i, arr) => (
                  <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem .9rem', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <span style={{ fontSize: '1rem' }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'rgba(227,240,255,.9)' }}>{item.type}</div>
                      <div style={{ fontSize: '.62rem', color: 'rgba(248,245,240,.4)', marginTop: '.1rem' }}>{item.loc}</div>
                    </div>
                    <span style={{ fontSize: '.6rem', color: item.statusColor, fontWeight: 700, whiteSpace: 'nowrap' }}>{item.statusLabel}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.5rem .9rem', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}>
                <span style={{ fontSize: '.62rem', color: 'rgba(248,245,240,.3)', letterSpacing: '1px' }}>REFRESH INTERVAL</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1rem', color: 'var(--ember-orange)', letterSpacing: '2px' }}>5 SEC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feed card grid */}
        <span className="sec-tag reveal" style={{ display: 'block', marginBottom: '.8rem' }}>Recent Detections · हाल की पहचान</span>
        <div className="feed-card-grid">
          {FEED_DATA.map((f) => (
            <div className="feed-card reveal" key={`${f.type}-${f.loc}`}>
              <div className="feed-card-top">
                <span style={{ fontSize: '2.8rem' }}>{f.emoji}</span>
                <span className={`feed-card-badge ${STATUS_MAP[f.status]}`}>{f.status.toUpperCase()}</span>
              </div>
              <div className="feed-card-body">
                <div className="feed-card-type">{f.type} · {f.typeH}</div>
                <h3 className="feed-card-title">{f.loc}</h3>
                <div className="feed-card-loc">📍 {f.city}</div>
                <div className="feed-card-bar">
                  <div className="feed-card-bar-fill" style={{ width: `${f.pct}%` }}></div>
                </div>
                <div className="feed-card-footer">
                  <span className="feed-card-time">Confidence: {f.pct}%</span>
                  <span className="feed-card-cam">{f.cam}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
