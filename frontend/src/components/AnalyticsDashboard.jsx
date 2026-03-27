import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FONT_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap";

const VIOLATION_DATA = {
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
    { rank: 4, name: 'Dwarka Circle', total: 177, helmet: 72, signal: 49, triple: 34, lane: 22, severity: 51 },
    { rank: 5, name: 'Panchavati', total: 131, helmet: 47, signal: 35, triple: 28, lane: 21, severity: 36 },
    { rank: 6, name: 'Satpur MIDC', total: 77, helmet: 19, signal: 24, triple: 12, lane: 22, severity: 21 },
  ],
  cameras: [
    { id: 'CAM-01', loc: 'CBS Chowk · East', violations: 187, uptime: 99.2, accuracy: 94.1, status: 'online' },
    { id: 'CAM-02', loc: 'CBS Chowk · West', violations: 131, uptime: 97.8, accuracy: 93.4, status: 'online' },
    { id: 'CAM-03', loc: 'MG Road · N', violations: 148, uptime: 99.5, accuracy: 95.2, status: 'online' },
    { id: 'CAM-04', loc: 'MG Road · S', violations: 122, uptime: 98.1, accuracy: 92.8, status: 'online' },
    { id: 'CAM-05', loc: 'Gangapur Rd', violations: 218, uptime: 96.3, accuracy: 91.7, status: 'degraded' },
    { id: 'CAM-06', loc: 'Dwarka Circle', violations: 177, uptime: 99.8, accuracy: 96.3, status: 'online' },
    { id: 'CAM-07', loc: 'Panchavati', violations: 131, uptime: 98.7, accuracy: 94.0, status: 'online' },
    { id: 'CAM-08', loc: 'Satpur MIDC · A', violations: 77, uptime: 97.4, accuracy: 90.5, status: 'online' },
    { id: 'CAM-09', loc: 'Satpur MIDC · B', violations: 0, uptime: 0, accuracy: 0, status: 'offline' },
  ],
  hourly: [3, 2, 1, 1, 2, 8, 22, 38, 48, 31, 26, 28, 24, 19, 18, 22, 30, 37, 42, 34, 21, 14, 9, 5],
  recent: [
    { id: 'TW-3041', type: 'helmet', section: 'CBS Chowk', cam: 'CAM-01', time: '10:47:22', conf: 96, status: 'Resolved' },
    { id: 'TW-3040', type: 'signal', section: 'MG Road', cam: 'CAM-03', time: '10:44:11', conf: 91, status: 'Active' },
    { id: 'TW-3039', type: 'triple', section: 'Gangapur Rd', cam: 'CAM-05', time: '10:41:38', conf: 98, status: 'Active' },
    { id: 'TW-3038', type: 'lane', section: 'Dwarka Circle', cam: 'CAM-06', time: '10:39:04', conf: 88, status: 'Resolved' },
    { id: 'TW-3037', type: 'helmet', section: 'Panchavati', cam: 'CAM-07', time: '10:35:55', conf: 93, status: 'Pending' },
    { id: 'TW-3036', type: 'signal', section: 'CBS Chowk', cam: 'CAM-02', time: '10:32:18', conf: 90, status: 'Resolved' },
    { id: 'TW-3035', type: 'triple', section: 'MG Road', cam: 'CAM-04', time: '10:28:41', conf: 97, status: 'Active' },
    { id: 'TW-3034', type: 'lane', section: 'Satpur MIDC', cam: 'CAM-08', time: '10:24:09', conf: 85, status: 'Pending' },
    { id: 'TW-3033', type: 'helmet', section: 'Gangapur Rd', cam: 'CAM-05', time: '10:19:56', conf: 94, status: 'Resolved' },
    { id: 'TW-3032', type: 'signal', section: 'Dwarka Circle', cam: 'CAM-06', time: '10:15:33', conf: 89, status: 'Active' },
  ]
};

const AnalyticsDashboard = () => {
  const [filter, setFilter] = useState({ period: 'This Week', section: 'All Sections' });
  const [counts, setCounts] = useState({ vToday: 0, activeCam: 0, accuracy: 0, challans: 0 });
  const [kpiCounts, setKpiCounts] = useState({ helmet: 0, signal: 0, triple: 0, lane: 0 });

  const sparklineRefs = useRef([]);

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

      // Count animations
      const duration = 1.5; // seconds for GSAP
      const animateValue = (target, setter) => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: duration,
          ease: "power2.out",
          onUpdate: () => setter(Math.floor(obj.val))
        });
      };

      animateValue(1191, (val) => setCounts(prev => ({ ...prev, vToday: val })));
      animateValue(12, (val) => setCounts(prev => ({ ...prev, activeCam: val })));
      animateValue(96, (val) => setCounts(prev => ({ ...prev, accuracy: val })));
      animateValue(847, (val) => setCounts(prev => ({ ...prev, challans: val })));

      animateValue(487, (val) => setKpiCounts(prev => ({ ...prev, helmet: val })));
      animateValue(312, (val) => setKpiCounts(prev => ({ ...prev, signal: val })));
      animateValue(214, (val) => setKpiCounts(prev => ({ ...prev, triple: val })));
      animateValue(178, (val) => setKpiCounts(prev => ({ ...prev, lane: val })));

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

      // Force a refresh after a small delay to ensure scroller is ready
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    });

    return () => ctx.revert();
  }, []);

  const buildLineChart = () => {
    const data = VIOLATION_DATA.dailyTrend;
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
    const vals = [487, 312, 214, 178];
    const total = 1191;
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
    const data = VIOLATION_DATA.hourly;
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
      {VIOLATION_DATA.cameras.map(c => (
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

  const doExport = () => {
    const headers = ['Case ID', 'Vehicle Number', 'Offence Type', 'Section', 'Date', 'Time', 'Confidence (%)', 'Fine (INR)'];
    const rows = VIOLATION_DATA.recent.map(v => [v.id, 'MH-15-XX-0000', v.type, v.section, '2026-03-27', v.time, v.conf, 500]);
    let csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `TrafficWatch_Analytics_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

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

      <div style={{ padding: "3rem", maxWidth: "1160px", margin: "0 auto" }}>
        {/* FILTER BAR */}
        <div className="reveal" style={{ display: "flex", alignItems: "center", gap: ".8rem", padding: "1rem 1.4rem", background: "#FFFFFF", border: "1px solid rgba(21, 101, 192, .1)", marginBottom: "2rem" }}>
          <span style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#546E7A" }}>Period</span>
          {['Today', 'This Week', 'This Month', 'Last 90 Days'].map(p => (
            <button key={p} className={`filter-btn ${filter.period === p ? 'active' : ''}`} onClick={() => setFilter({ ...filter, period: p })}>{p}</button>
          ))}
          <div style={{ width: "1px", height: "20px", background: "rgba(21, 101, 192, .15)", margin: "0 .2rem" }}></div>
          <button style={{ marginLeft: "auto", background: "#1565C0", color: "#fff", border: "none", padding: ".35rem 1rem", fontSize: ".7rem", fontWeight: 600, cursor: "pointer" }} onClick={doExport}>EXPORT REPORT</button>
        </div>

        {/* KPI STRIP */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: 'No Helmet', count: kpiCounts.helmet, icon: '🪖', color: '#C62828', delta: '↑ +22%' },
            { label: 'Signal Jumps', count: kpiCounts.signal, icon: '🚦', color: '#e85d26', delta: '↑ +8%' },
            { label: 'Triple Riding', count: kpiCounts.triple, icon: '👥', color: '#1565C0', delta: '↓ −4%' },
            { label: 'Wrong Lane', count: kpiCounts.lane, icon: '🚗', color: '#52b788', delta: '↓ −11%' }
          ].map((k, i) => (
            <div key={i} className="kpi-card reveal" style={{ borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: "1.6rem", marginBottom: ".6rem" }}>{k.icon}</div>
              <div className="kpi-num">{k.count}</div>
              <div style={{ fontSize: ".63rem", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#546E7A", margin: ".3rem 0" }}>{k.label}</div>
              <span style={{ fontSize: ".68rem", fontWeight: 600, background: "rgba(0,0,0,0.05)", padding: ".15rem .5rem" }}>{k.delta}</span>
              <canvas ref={el => sparklineRefs.current[i] = el} style={{ height: "28px", width: "100%", marginTop: ".8rem" }}></canvas>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div className="chart-card reveal">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#0B3D91", marginBottom: "1.4rem" }}>Daily Violation Trend</h3>
            <div style={{ height: "120px", position: "relative" }}>{buildLineChart()}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".8rem" }}>
              {VIOLATION_DATA.dailyTrend.map(d => <span key={d.day} style={{ fontSize: ".6rem", color: "#90A4AE" }}>{d.day}</span>)}
            </div>
          </div>
          <div className="chart-card reveal">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#0B3D91", marginBottom: "1.4rem" }}>Violation Mix</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
              {buildDonut()}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: ".55rem" }}>
                {[{ l: 'No Helmet', v: 487, p: '40.9%', c: '#C62828' }, { l: 'Signal Jump', v: 312, p: '26.2%', c: '#e85d26' }, { l: 'Triple Riding', v: 214, p: '18.0%', c: '#1565C0' }, { l: 'Wrong Lane', v: 178, p: '14.9%', c: '#52b788' }].map(d => (
                  <div key={d.l} style={{ display: "flex", alignItems: "center", gap: ".6rem", fontSize: ".72rem" }}>
                    <div style={{ width: "8px", height: "8px", background: d.c, borderRadius: "2px" }}></div>
                    <span style={{ color: "#546E7A", flex: 1 }}>{d.l}</span><span style={{ fontWeight: 600 }}>{d.v}</span><span style={{ fontSize: ".62rem", color: "#90A4AE" }}>{d.p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div className="chart-card reveal">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#0B3D91", marginBottom: "1.4rem" }}>Violations by Section</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
              {VIOLATION_DATA.wards.map(w => (
                <div key={w.name} style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
                  <span style={{ fontSize: ".72rem", color: "#546E7A", width: "100px", textAlign: "right" }}>{w.name}</span>
                  <div style={{ flex: 1, height: "10px", background: "rgba(21, 101, 192, .06)", position: "relative", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#1565C0", width: `${(w.total / 318) * 100}%`, transition: 'width 1.5s' }}></div>
                  </div>
                  <span style={{ fontSize: ".72rem", fontWeight: 600, color: "#0B3D91", width: "30px" }}>{w.total}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-card reveal">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#0B3D91", marginBottom: "1.4rem" }}>7-Day Activity Heatmap</h3>
            {buildHeatmap()}
          </div>
        </div>

        {/* WARD TABLE */}
        <div style={{ borderBottom: "1px solid rgba(21, 101, 192, .15)", marginBottom: "1.5rem", paddingBottom: ".5rem" }}>
          <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#1565C0" }}>Ward-wise Breakdown</span>
        </div>
        <div className="chart-card reveal" style={{ padding: 0, overflow: "hidden", marginBottom: "2rem" }}>
          <table className="ward-table">
            <thead><tr><th>Rank · Section</th><th>Total</th><th>Helmet</th><th>Signal</th><th>Triple</th><th>Lane</th><th>Severity</th></tr></thead>
            <tbody>
              {VIOLATION_DATA.wards.map((w, i) => (
                <tr key={w.name}>
                  <td><span style={{ background: i < 2 ? "#fde8e8" : "#e3f2fd", color: i < 2 ? "#C62828" : "#1565C0", padding: "2px 6px", borderRadius: "2px", marginRight: "10px", fontWeight: "bold" }}>{w.rank}</span>{w.name}</td>
                  <td><strong>{w.total}</strong></td><td>{w.helmet}</td><td>{w.signal}</td><td>{w.triple}</td><td>{w.lane}</td>
                  <td><div style={{ width: "60px", height: "6px", background: "#eee", borderRadius: "1px", display: "inline-block", verticalAlign: "middle", marginRight: "8px" }}><div style={{ height: "100%", width: `${w.severity}%`, background: w.severity > 70 ? "#C62828" : "#1565C0" }}></div></div>{w.severity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PEAK HOUR INTEL */}
        <div style={{ borderBottom: "1px solid rgba(21, 101, 192, .15)", marginBottom: "1.5rem", paddingBottom: ".5rem" }}>
          <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#1565C0" }}>Peak Hour Intelligence</span>
        </div>
        <div className="reveal" style={{ background: "#1a2535", border: "1px solid rgba(82, 183, 136, .12)", padding: "2rem", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "#E3F0FF", marginBottom: ".3rem" }}>Hourly Pattern Analysis</h3>
          <p style={{ fontSize: ".75rem", color: "rgba(248, 245, 240, .35)", marginBottom: "1.5rem" }}>Nashik Zone — Hourly violation distribution this week</p>
          {buildPeakBars()}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.58rem', color: 'rgba(248, 245, 240, .25)' }}>
            {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00'].map(h => <span key={h}>{h}</span>)}
          </div>
        </div>

        {/* CAMERA PERFORMANCE */}
        <div style={{ borderBottom: "1px solid rgba(21, 101, 192, .15)", marginBottom: "1.5rem", paddingBottom: ".5rem" }}>
          <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#1565C0" }}>Camera Performance Status</span>
        </div>
        <div style={{ marginBottom: "2rem" }}>{buildCamGrid()}</div>

        {/* RECENT LOG */}
        <div style={{ borderBottom: "1px solid rgba(21, 101, 192, .15)", marginBottom: "1.5rem", paddingBottom: ".5rem" }}>
          <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#1565C0" }}>Recent Violations Log</span>
        </div>
        <div className="chart-card reveal" style={{ padding: 0, overflow: "hidden" }}>
          <table className="ward-table">
            <thead><tr><th>Case ID</th><th>Type</th><th>Section</th><th>Camera</th><th>Time</th><th>Conf</th><th>Status</th></tr></thead>
            <tbody>
              {VIOLATION_DATA.recent.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: "bold", color: "#0B3D91" }}>{v.id}</td><td><span className={`vtype-pill ${v.type}`}>{v.type.toUpperCase()}</span></td><td>{v.section}</td>
                  <td style={{ fontFamily: "monospace" }}>{v.cam}</td><td>{v.time}</td><td>{v.conf}%</td>
                  <td style={{ fontWeight: "bold", color: v.status === 'Resolved' ? '#2E7D32' : '#e85d26' }}>{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#0B3D91", padding: "1.5rem 3rem", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".72rem" }}>
        <span>TRAFFICWATCH ANALYTICS · NASHIK ZONE</span><span style={{ opacity: 0.5 }}>© 2026 ANTIGRAVITY SYSTEMS</span>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
