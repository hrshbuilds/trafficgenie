import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAnalytics, useTopStats, useWardStats, useCameraStatus } from "../hooks/useAnalytics";
import LoadingSkeleton from "./common/LoadingSkeleton";
import ErrorMessage from "./common/ErrorMessage";

gsap.registerPlugin(ScrollTrigger);

const FONT_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap";

// Fallback data for when API returns empty
const FALLBACK_DATA = {
  dailyTrend: [
    { day: 'Mon', count: 148 },
    { day: 'Tue', count: 173 },
    { day: 'Wed', count: 162 },
    { day: 'Thu', count: 189 },
    { day: 'Fri', count: 221 },
    { day: 'Sat', count: 198 },
    { day: 'Sun', count: 100 },
  ],
  wards: [
    { rank: 1, name: 'CBS Chowk', total: 318, helmet: 142, signal: 88, triple: 55, lane: 33, severity: 92 },
    { rank: 2, name: 'MG Road', total: 270, helmet: 118, signal: 72, triple: 47, lane: 33, severity: 78 },
    { rank: 3, name: 'Gangapur Rd', total: 218, helmet: 89, signal: 64, triple: 38, lane: 27, severity: 65 },
  ],
  cameras: [
    { id: 'CAM-01', loc: 'CBS Chowk · East', violations: 187, uptime: 99.2, accuracy: 94.1, status: 'online' },
    { id: 'CAM-02', loc: 'CBS Chowk · West', violations: 131, uptime: 97.8, accuracy: 93.4, status: 'online' },
    { id: 'CAM-03', loc: 'MG Road · N', violations: 148, uptime: 99.5, accuracy: 95.2, status: 'online' },
  ],
  hourly: [3, 2, 1, 1, 2, 8, 22, 38, 48, 31, 26, 28, 24, 19, 18, 22, 30, 37, 42, 34, 21, 14, 9, 5],
  recent: [
    { id: 'TW-3041', type: 'helmet', section: 'CBS Chowk', cam: 'CAM-01', time: '10:47:22', conf: 96, status: 'Resolved' },
    { id: 'TW-3040', type: 'signal', section: 'MG Road', cam: 'CAM-03', time: '10:44:11', conf: 91, status: 'Active' },
  ],
};

const AnalyticsDashboard = () => {
  const [counts, setCounts] = useState({ vToday: 0, activeCam: 0, accuracy: 0, challans: 0 });
  const [kpiCounts, setKpiCounts] = useState({ helmet: 0, signal: 0, triple: 0, lane: 0 });

  // Fetch data from hooks
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics();
  const { stats } = useTopStats();
  const { wards } = useWardStats();
  const { cameras } = useCameraStatus();

  const sparklineRefs = useRef([]);

  // Merged data: use API data if available, fallback to FALLBACK_DATA
  const violationData = {
    dailyTrend: analytics?.dailyTrend || FALLBACK_DATA.dailyTrend,
    wards: wards || FALLBACK_DATA.wards,
    cameras: cameras || FALLBACK_DATA.cameras,
    hourly: analytics?.hourly || FALLBACK_DATA.hourly,
    recent: analytics?.recent || FALLBACK_DATA.recent,
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal animations
      gsap.utils.toArray('.reveal').forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, 
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { 
            trigger: el, 
            start: "top 95%",
            scroller: ".adm-heatmap-container",
            toggleActions: "play none none none"
          }
        });
      });

      // Count animations - from API stats if available
      const duration = 1.5;
      const animateValue = (target, setter) => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: duration,
          ease: "power2.out",
          onUpdate: () => setter(Math.floor(obj.val))
        });
      };

      // Use real stats from API or fallback values
      const vTodayVal = stats?.violations || 1191;
      const activeCamVal = violationData.cameras.filter((camera) => camera.status === 'online').length || 12;
      const accuracyVal = stats?.accuracy || 96;
      const challansVal = stats?.challans || 847;

      animateValue(vTodayVal, (val) => setCounts(prev => ({ ...prev, vToday: val })));
      animateValue(activeCamVal, (val) => setCounts(prev => ({ ...prev, activeCam: val })));
      animateValue(accuracyVal, (val) => setCounts(prev => ({ ...prev, accuracy: val })));
      animateValue(challansVal, (val) => setCounts(prev => ({ ...prev, challans: val })));

      animateValue(stats?.helmet || 487, (val) => setKpiCounts(prev => ({ ...prev, helmet: val })));
      animateValue(stats?.signal || 312, (val) => setKpiCounts(prev => ({ ...prev, signal: val })));
      animateValue(stats?.triple || 214, (val) => setKpiCounts(prev => ({ ...prev, triple: val })));
      animateValue(stats?.lane || 178, (val) => setKpiCounts(prev => ({ ...prev, lane: val })));

      // Draw sparklines
      const colors = ['#C62828', '#e85d26', '#1565C0', '#52b788'];
      sparklineRefs.current.forEach((canvas, i) => {
        if (!canvas) return;
        const ctx2d = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = 56;
        const vals = Array.from({ length: 7 }, () => Math.random() * 60 + 20);
        const maxV = Math.max(...vals);
        const w = canvas.width, h = canvas.height;
        const pts = vals.map((v, idx) => ({ x: (idx / (vals.length - 1)) * w, y: h - (v / maxV) * (h - 8) - 4 }));
        ctx2d.strokeStyle = colors[i];
        ctx2d.lineWidth = 4;
        ctx2d.beginPath();
        pts.forEach((p, idx) => idx === 0 ? ctx2d.moveTo(p.x, p.y) : ctx2d.lineTo(p.x, p.y));
        ctx2d.stroke();
      });

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    });

    return () => ctx.revert();
  }, [stats, violationData.cameras]);

  const buildLineChart = () => {
    const data = violationData.dailyTrend;
    const maxV = Math.max(...data.map(d => d.count));
    const w = 400, h = 100, padX = 20, padY = 10;
    const xs = data.map((_, i) => padX + i * (w - padX * 2) / (data.length - 1));
    const ys = data.map(d => h - padY - (d.count / maxV) * (h - padY * 2));
    const pathD = xs.map((x, i) => (i === 0 ? `M${x},${ys[i]}` : `L${x},${ys[i]}`)).join(' ');
    const areaD = `M${xs[0]},${h} ${xs.map((x, i) => `L${x},${ys[i]}`).join(' ')} L${xs[xs.length - 1]},${h} Z`;
    return (
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={{ width: '100%', height: '100px', overflow: 'visible' }}>
        <defs><linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1565C0" stopOpacity=".5" /><stop offset="100%" stopColor="#1565C0" stopOpacity="0" /></linearGradient></defs>
        <path d={areaD} fill="url(#lcGrad)" opacity=".25" />
        <path d={pathD} fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={ys[i]} r="3" fill="#1565C0" stroke="#fff" strokeWidth="1.5" />
            <text x={x} y={ys[i] - 7} textAnchor="middle" fontSize="7" fill="#90A4AE">{data[i].count}</text>
          </g>
        ))}
      </svg>
    );
  };

  const buildDonut = () => {
    const vals = [kpiCounts.helmet, kpiCounts.signal, kpiCounts.triple, kpiCounts.lane];
    const total = vals.reduce((a, b) => a + b, 0) || 1191;
    const colors = ['#C62828', '#e85d26', '#1565C0', '#52b788'];
    const circumference = 2 * Math.PI * 38;
    let cumAngle = 0;
    return (
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(21,101,192,.07)" strokeWidth="16" />
        {vals.map((v, i) => {
          const pct = v / total;
          const len = circumference * pct;
          const gap = circumference - len;
          const rot = -90 + cumAngle;
          cumAngle += pct * 360;
          return (
            <circle key={i} cx="50" cy="50" r="38" fill="none" stroke={colors[i]} strokeWidth="16"
              strokeDasharray={`${len} ${gap}`} strokeDashoffset="0" strokeLinecap="butt"
              transform={`rotate(${rot} 50 50)`} style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)' }} />
          );
        })}
        <text x="50" y="46" textAnchor="middle" fontFamily="Bebas Neue, sans-serif" fontSize="14" fill="#0B3D91">{total}</text>
        <text x="50" y="57" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="6" fill="#90A4AE">TOTAL</text>
      </svg>
    );
  };

  const buildHeatmap = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['00', '04', '08', '12', '16', '20'];
    const data = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => Math.random()));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(7, 1fr)', gap: '3px', alignItems: 'center' }}>
        <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '28px repeat(7, 1fr)', gap: '3px', marginBottom: '2px' }}>
          <div></div>
          {days.map(d => <div key={d} style={{ fontSize: '.6rem', color: '#90A4AE', textAlign: 'center' }}>{d}</div>)}
        </div>
        {hours.map((h, hi) => (
          <React.Fragment key={h}>
            <div style={{ fontSize: '.6rem', color: '#90A4AE', textAlign: 'right', paddingRight: '.4rem', width: '28px' }}>{h}:00</div>
            {days.map((_, di) => {
              const intensity = (data[hi][di] * 0.8 + 0.1).toFixed(2);
              return (
                <div key={di} title={`${h}:00 ${days[di]}: ${Math.round(intensity * 40)} violations`}
                  style={{ aspectRatio: '1', borderRadius: '2px', background: `rgba(21, 101, 192, ${intensity})`, cursor: 'pointer', transition: 'transform .15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const buildPeakBars = () => {
    const data = violationData.hourly;
    const maxV = Math.max(...data);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px', marginBottom: '.8rem' }}>
        {data.map((v, i) => {
          const pct = (v / maxV) * 100;
          const isHigh = v > maxV * 0.6;
          const isMed = v > maxV * 0.3;
          return (
            <div key={i} className="peak-bar" style={{
              flex: 1, borderRadius: '2px 2px 0 0', minHeight: '3px', position: 'relative',
              height: `${Math.max(pct, 3)}%`,
              background: isHigh ? 'linear-gradient(0deg,#C62828,#ef5350)' : isMed ? 'linear-gradient(0deg,#1565C0,#42a5f5)' : 'rgba(255,255,255,.12)'
            }} title={`${i}:00 · ${v} violations`} />
          );
        })}
      </div>
    );
  };

  const buildCamGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {violationData.cameras.map(c => (
        <div key={c.id} className="chart-card reveal" style={{ padding: '1.2rem', position: 'relative' }}>
          <div className={`cam-status-dot ${c.status}`} style={{ position: 'absolute', top: '1rem', right: '1rem' }}></div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", letterSpacing: "3px", color: "#0B3D91" }}>{c.id}</div>
          <div style={{ fontSize: ".68rem", color: "#90A4AE", marginBottom: ".8rem" }}>{c.loc}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem', fontSize: '.65rem', color: '#546E7A' }}>
            <span>Violations detected</span><span style={{ fontWeight: 600, color: "#0B3D91" }}>{c.violations}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem', fontSize: '.65rem', color: '#546E7A' }}>
            <span>Uptime</span><span style={{ fontWeight: 600, color: "#0B3D91" }}>{c.uptime}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(21, 101, 192, .08)', marginTop: '.6rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${c.uptime}%`, background: '#52b788' }}></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Show loading skeleton for initial load
  if (analyticsLoading && !violationData.dailyTrend) {
    return <LoadingSkeleton type="dashboard" />;
  }

  // Show error message
  if (analyticsError && !violationData.dailyTrend) {
    return <ErrorMessage error={analyticsError} onRetry={refetchAnalytics} />;
  }

  return (
    <div style={{ background: "#F4F6F8", minHeight: "100%", width: "100%", color: "#1a2530", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('${FONT_URL}');
        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s, transform 0.6s; }
        .reveal.up { opacity: 1; transform: translateY(0); }
        .filter-btn { padding: .32rem .9rem; font-size: .72rem; font-weight: 500; border: 1px solid rgba(21, 101, 192, .2); color: #546E7A; background: transparent; cursor: pointer; transition: all .2s; }
        .filter-btn:hover, .filter-btn.active { background: #0B3D91; color: #fff; border-color: #0B3D91; }
        .kpi-card { background: #FFFFFF; border: 1px solid rgba(21, 101, 192, .08); padding: 1.4rem 1.6rem; position: relative; overflow: hidden; }
        .kpi-num { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; letter-spacing: 2px; color: #0B3D91; line-height: 1; }
        .chart-card { background: #FFFFFF; border: 1px solid rgba(21, 101, 192, .08); padding: 1.6rem; }
        .ward-table { width: 100%; border-collapse: collapse; }
        .ward-table th { padding: .6rem .9rem; font-size: .62rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #546E7A; text-align: left; border-bottom: 2px solid rgba(21, 101, 192, .1); }
        .ward-table td { padding: .75rem .9rem; font-size: .8rem; color: #1a2530; border-bottom: 1px solid rgba(21, 101, 192, .05); }
        .vtype-pill { display: inline-flex; align-items: center; gap: .3rem; padding: .18rem .6rem; font-size: .65rem; font-weight: 600; border-radius: 2px; }
        .vtype-pill.helmet { background: rgba(198, 40, 40, .1); color: #C62828; }
        .vtype-pill.signal { background: rgba(232, 93, 38, .1); color: #e85d26; }
        .vtype-pill.triple { background: rgba(21, 101, 192, .1); color: #1565C0; }
        .vtype-pill.lane { background: rgba(82, 183, 136, .1); color: #2E7D32; }
        .cam-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
        .cam-status-dot.online { background: #52b788; box-shadow: 0 0 6px rgba(82, 183, 136, .5); }
        .cam-status-dot.offline { background: #ef5350; }
        .cam-status-dot.degraded { background: #ffa726; }
      `}</style>

      {/* BANNER */}
      <div style={{ background: "linear-gradient(135deg, #0B3D91 0%, #1565C0 60%, #0d47a1 100%)", padding: "4rem 3rem", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(227, 240, 255, .6)", marginBottom: ".8rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
              Phase 04 · Zone Intelligence · नाशिक विश्लेषण
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.4rem", fontWeight: 900, color: "#fff", lineHeight: 1.08, marginBottom: ".6rem" }}>Nashik Zone <em style={{ fontStyle: "italic", fontWeight: 400, color: "#E3F0FF" }}>Analytics.</em></h1>
            <p style={{ fontSize: ".92rem", color: "rgba(255, 255, 255, .55)", fontWeight: 300, maxWidth: "480px", lineHeight: 1.7 }}>Section-wise violation intelligence for Nashik district — 12 cameras, 6 wards, real-time pattern analysis powered by YOLOv8.</p>
          </div>
          <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            {[{l:'Violations Today', v:counts.vToday, t:'↑ +14.2%'}, {l:'Active Cameras', v:counts.activeCam, t:'11 On / 1 Deg'}, {l:'Detection Accuracy', v:counts.accuracy+'%', t:'↑ +0.3%'}].map((k,i) => (
              <div key={i} style={{ background: "rgba(255, 255, 255, .08)", border: "1px solid rgba(255, 255, 255, .12)", borderLeft: i>0?"none":"", padding: "1rem 1.8rem", minWidth: "120px" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#FFFFFF" }}>{k.v}</div>
                <div style={{ fontSize: ".58rem", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255, 255, 255, .4)" }}>{k.l}</div>
                <div style={{ fontSize: ".62rem", color: i===2?'#52b788':'#FFF', marginTop: ".3rem" }}>{k.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REST OF DASHBOARD CONTENT - Will continue in next section */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem" }}>
        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.4rem", marginBottom: "3rem" }}>
          {[{n:'Helmet Violations', v:kpiCounts.helmet}, {n:'Signal Jumps', v:kpiCounts.signal}, {n:'Triple Riding', v:kpiCounts.triple}, {n:'Lane Violations', v:kpiCounts.lane}].map((k,i) => (
            <div key={i} className="kpi-card reveal">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <div style={{fontSize:'.65rem', color:'#546E7A', textTransform:'uppercase', letterSpacing:'1px'}}>{k.n}</div>
                  <div className="kpi-num">{k.v}</div>
                </div>
                <canvas ref={el => sparklineRefs.current[i] = el} style={{width: '80px', height: '44px'}} />
              </div>
            </div>
          ))}
        </div>

        {/* Chart Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "1.4rem", marginBottom: "3rem" }}>
          <div className="chart-card reveal">
            <h3 style={{fontSize: '.9rem', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#0B3D91'}}>Daily Trend</h3>
            {buildLineChart()}
          </div>
          <div className="chart-card reveal">
            <h3 style={{fontSize: '.9rem', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#0B3D91'}}>Violation Types</h3>
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'150px'}}>
              {buildDonut()}
            </div>
          </div>
        </div>

        {/* Ward Stats */}
        <div className="chart-card reveal" style={{marginBottom: '3rem'}}>
          <h3 style={{fontSize: '.9rem', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#0B3D91'}}>Ward Performance</h3>
          <table className="ward-table">
            <thead>
              <tr>
                <th>Rank</th><th>Ward</th><th>Total</th><th>Helmet</th><th>Signal</th><th>Triple</th><th>Lane</th><th style={{textAlign:'right'}}>Severity</th>
              </tr>
            </thead>
            <tbody>
              {violationData.wards.map(w => (
                <tr key={w.rank}>
                  <td>#{w.rank}</td><td style={{fontWeight:600}}>{w.name}</td><td style={{fontWeight:600, color:'#0B3D91'}}>{w.total}</td>
                  <td><span className="vtype-pill helmet">●{w.helmet}</span></td>
                  <td><span className="vtype-pill signal">●{w.signal}</span></td>
                  <td><span className="vtype-pill triple">●{w.triple}</span></td>
                  <td><span className="vtype-pill lane">●{w.lane}</span></td>
                  <td style={{textAlign:'right', fontWeight:600, color:'#C62828'}}>{w.severity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hourly & Heatmap */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.4rem", marginBottom: "3rem" }}>
          <div className="chart-card reveal">
            <h3 style={{fontSize: '.9rem', fontWeight: 700, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#0B3D91'}}>Peak Violations (Hourly)</h3>
            {buildPeakBars()}
            <div style={{fontSize:'.65rem', color:'#546E7A', textAlign:'center', marginTop:'.8rem'}}>Past 24 hours</div>
          </div>
          <div className="chart-card reveal">
            <h3 style={{fontSize: '.9rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#0B3D91'}}>Activity Heatmap</h3>
            <div className="adm-heatmap-container">
              {buildHeatmap()}
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="reveal" style={{marginBottom: '3rem'}}>
          <h3 style={{fontSize: '.9rem', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#0B3D91'}}>Camera Status</h3>
          {buildCamGrid()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
