export default function PhaseDetection() {
  return (
    <section className="phase-section" id="violations">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <span className="sec-tag reveal">Phase 01 · Detection Engine</span>
        <h2 className="sec-title reveal d1">AI sees what <em>officers miss.</em></h2>
        <p className="sec-sub reveal d2">
          YOLOv8 processes every frame of existing CCTV footage — detecting no-helmet riders, signal jumpers,
          triple riding, and wrong lane violations in real time. Zero new hardware required.
        </p>
        <div className="feed-grid">
          {/* Case board */}
          <div>
            <div className="case-board reveal">
              <div className="board-snapshot">🪖</div>
              <div className="board-string"></div>
              <div className="board-details">
                <h3>Violation Case #TW-2847</h3>
                <div className="detail-chips">
                  <span className="chip dept">Roads &amp; Traffic Dept</span>
                  <span className="chip conf">Confidence: 94%</span>
                  <span className="chip status">UNRESOLVED · 3 DAYS</span>
                </div>
                <p>
                  Rider detected without helmet on two-wheeler at Linking Road, Bandra West.
                  Vehicle registration partially captured. Alert dispatched to Ward 42 Traffic Unit at 09:42:11.
                </p>
              </div>
              <div className="board-info-grid">
                {[
                  ['Camera ID', 'CAM-04 · Bandra West'],
                  ['Violation Type', 'No Helmet · बिना हेलमेट'],
                  ['Detected At', '09:42:11, 16 Mar 2026'],
                  ['Model', 'YOLOv8n · fine-tuned'],
                  ['Location', 'Linking Road, Bandra · Mumbai'],
                  ['Status', '⚠ Alert Sent to Traffic Unit'],
                ].map(([label, value]) => (
                  <div className="info-item" key={label}>
                    <div className="label">{label}</div>
                    <div className="value">{value}</div>
                  </div>
                ))}
              </div>
              <button className="alert-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.63 4.35 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
                </svg>
                Generate Alert Letter · सूचना पत्र भेजें
              </button>
            </div>
          </div>

          {/* Detection engine card */}
          <div>
            <div className="v-card reveal">
              <div className="v-card-glow"></div>
              <div className="v-badge"><span className="v-icon">🧠</span> YOLOv8 · DETECTION ENGINE</div>
              <h3>4 Violations. One Model Pass.</h3>
              <p>A single YOLOv8 inference on each frame simultaneously checks for all violation types — no chained models, no lag.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid rgba(232,93,38,.12)', marginBottom: '1.4rem' }}>
                {[
                  { icon: '🪖', label: 'No Helmet · बिना हेलमेट', pct: 94, color: 'var(--ember-orange)', gradient: 'linear-gradient(90deg,var(--ember-orange),var(--ember-red))' },
                  { icon: '🚦', label: 'Signal Jump · सिग्नल उल्लंघन', pct: 89, color: 'var(--ember-orange)', gradient: 'linear-gradient(90deg,var(--ember-orange),var(--ember-red))' },
                  { icon: '👥', label: 'Triple Riding · तीन सवारी', pct: 97, color: 'var(--ember-orange)', gradient: 'linear-gradient(90deg,var(--ember-orange),var(--ember-red))' },
                  { icon: '🚗', label: 'Wrong Lane · गलत लेन', pct: 82, color: 'rgba(227,240,255,.7)', gradient: 'linear-gradient(90deg,#1565C0,#0B3D91)' },
                ].map((item, i, arr) => (
                  <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: '.9rem', padding: '.75rem 1rem', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'rgba(227,240,255,.9)', marginBottom: '.3rem' }}>{item.label}</div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.pct}%`, height: '100%', background: item.gradient, borderRadius: '2px' }}></div>
                      </div>
                    </div>
                    <span style={{ fontSize: '.68rem', fontWeight: 700, color: item.color, whiteSpace: 'nowrap' }}>{item.pct}%</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '1.4rem' }}>
                {[
                  { label: 'Model', value: 'YOLOv8n', color: 'var(--ember-orange)', border: 'rgba(232,93,38,.4)' },
                  { label: 'Accuracy', value: '98.2%', color: '#52b788', border: 'rgba(82,183,136,.4)' },
                  { label: 'Inference', value: '~28ms', color: 'var(--sand)', border: 'rgba(21,101,192,.4)' },
                  { label: 'New Hardware', value: 'ZERO', color: '#ef5350', border: 'rgba(198,40,40,.4)' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '.7rem 1rem', background: 'rgba(109,143,163,.05)', borderLeft: `2px solid ${s.border}` }}>
                    <div style={{ fontSize: '.58rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(248,245,240,.3)', marginBottom: '.2rem' }}>{s.label}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.1rem', color: s.color, letterSpacing: '2px', lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <button className="action-btn">🧠 Run Detection Demo · डेमो चलाएं</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
