const CITY_DATA = [
  { rank: 1, city: 'Mumbai · मुंबई', violations: 487, pct: 100, dist: '38%', status: '● Critical', statusColor: '#ef5350' },
  { rank: 2, city: 'Pune · पुणे', violations: 312, pct: 64, dist: '24%', status: '● High', statusColor: '#ffa726' },
  { rank: 3, city: 'Nagpur · नागपुर', violations: 241, pct: 49, dist: '19%', status: '● High', statusColor: '#ffa726' },
  { rank: 4, city: 'Nashik · नाशिक', violations: 158, pct: 32, dist: '12%', status: '● Moderate', statusColor: '#66bb6a' },
  { rank: 5, city: 'Amravati · अमरावती', violations: 86, pct: 18, dist: '7%', status: '● Low', statusColor: '#66bb6a' },
];

const CITY_BARS = [
  { city: 'Mumbai', count: 487, pct: 100, blueBar: false },
  { city: 'Pune', count: 312, pct: 64, blueBar: false },
  { city: 'Nagpur', count: 241, pct: 50, blueBar: false },
  { city: 'Nashik', count: 158, pct: 32, blueBar: true },
  { city: 'Amravati', count: 86, pct: 18, blueBar: true },
];

export default function ZoneStats() {
  return (
    <section className="zone-section" id="zones">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="feed-grid" style={{ alignItems: 'start' }}>

          {/* Zone intelligence card */}
          <div>
            <div className="v-card reveal">
              <div className="v-card-glow"></div>
              <div className="v-badge"><span className="v-icon">🗺️</span> Zone Intelligence · LIVE</div>
              <h3>Maharashtra — 5 Cities, One Network</h3>
              <p>Real-time violation data flowing from 47 cameras across Mumbai, Pune, Nagpur, Nashik, and Amravati — all under one enforcement dashboard.</p>

              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{ fontSize: '.6rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(248,245,240,.3)', marginBottom: '.8rem' }}>
                  VIOLATIONS BY CITY · शहर अनुसार
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {CITY_BARS.map((c) => (
                    <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: '.8rem' }}>
                      <span style={{ fontSize: '.72rem', color: 'rgba(248,245,240,.6)', width: '72px', flexShrink: 0 }}>{c.city}</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${c.pct}%`, height: '100%', background: c.blueBar ? 'linear-gradient(90deg,#1565C0,#0B3D91)' : 'linear-gradient(90deg,var(--ember-orange),var(--ember-red))', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ fontSize: '.7rem', color: c.blueBar ? 'rgba(227,240,255,.7)' : 'var(--ember-orange)', fontWeight: 600 }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '1.4rem' }}>
                {[
                  { label: 'Total Today', value: '1,284', color: 'var(--ember-orange)', border: 'rgba(232,93,38,.4)' },
                  { label: 'Challans Issued', value: '389', color: '#52b788', border: 'rgba(82,183,136,.4)' },
                  { label: 'Critical Zones', value: '7', color: '#ef5350', border: 'rgba(198,40,40,.4)' },
                  { label: 'Active Cameras', value: '47', color: 'var(--sand)', border: 'rgba(21,101,192,.4)' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '.7rem 1rem', background: 'rgba(109,143,163,.05)', borderLeft: `2px solid ${s.border}` }}>
                    <div style={{ fontSize: '.58rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(248,245,240,.3)', marginBottom: '.2rem' }}>{s.label}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.5rem', color: s.color, letterSpacing: '2px', lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <button className="action-btn">🗺️ Open Live Zone Map · ज़ोन मैप</button>
            </div>
          </div>

          {/* Table panel */}
          <div className="feed-info-panel">
            <span className="sec-tag reveal">Phase 03 · Zone Intelligence</span>
            <h2 className="sec-title reveal d1">Maharashtra's roads, <em>mapped.</em></h2>
            <p style={{ fontSize: '.9rem', lineHeight: 1.75, color: '#546E7A', marginBottom: '1.5rem', fontWeight: 300 }} className="reveal d2">
              Five hackathon zones. One unified enforcement dashboard. Deploy officers where violations peak.
            </p>

            <div className="zone-card-wrap reveal" style={{ padding: '1.5rem' }}>
              <table className="city-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>City · शहर</th>
                    <th>Violations</th>
                    <th>Distribution</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CITY_DATA.map((row) => (
                    <tr key={row.rank}>
                      <td><span className="rank-badge">{row.rank}</span></td>
                      <td>{row.city}</td>
                      <td>{row.violations}</td>
                      <td>
                        <div className="city-bar-wrap">
                          <div className="city-bar-track">
                            <div className="city-bar-fill" style={{ width: `${row.pct}%` }}></div>
                          </div>
                          <span style={{ fontSize: '.7rem', color: 'rgba(248,245,240,.5)' }}>{row.dist}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '.68rem', color: row.statusColor }}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="feature-list reveal d3" style={{ marginTop: '1.5rem' }}>
              <div className="feat-item">
                <span className="feat-icon">📍</span>
                <div><h4>Ward-Level Drill-Down</h4><p>Click any city to see violation hotspots at intersection level — every ward, every camera.</p></div>
              </div>
              <div className="feat-item">
                <span className="feat-icon">🕐</span>
                <div><h4>Peak Hour Prediction</h4><p>ML model predicts surge windows so officers can be deployed proactively, not reactively.</p></div>
              </div>
            </div>
            <button className="feat-cta reveal d4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              Full Zone Report · पूर्ण रिपोर्ट
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
