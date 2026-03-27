import { useEffect, useRef, useState } from 'react';

const phrases = [
  'Detecting violations in real time...',
  'यातायात उल्लंघन का पता लगाना...',
  'YOLOv8 · 47 cameras · 5 cities',
  'No hardware required · Zero deployment cost',
  'महाराष्ट्र स्मार्ट सिटी मिशन...',
];

const HERO_FEED = [
  { badge: 'fb-red', emoji: '🪖', type: 'No Helmet', isNew: true, loc: '📍 Linking Road, Bandra · CAM-04', time: '09:42:11' },
  { badge: 'fb-orange', emoji: '🚦', type: 'Signal Jump', isNew: false, loc: '📍 FC Road, Pune · CAM-11', time: '09:41:58' },
  { badge: 'fb-red', emoji: '👥', type: 'Triple Riding', isNew: true, loc: '📍 Shivaji Park, Dadar · CAM-07', time: '09:41:33' },
  { badge: 'fb-blue', emoji: '🚗', type: 'Wrong Lane', isNew: false, loc: '📍 Sadar, Nagpur · CAM-02', time: '09:41:19' },
  { badge: 'fb-orange', emoji: '🦺', type: 'Zebra Crossing', isNew: false, loc: '📍 MG Road, Nashik · CAM-09', time: '09:41:04' },
  { badge: 'fb-red', emoji: '🪖', type: 'No Helmet', isNew: true, loc: '📍 Wakad, Pune · CAM-15', time: '09:40:52' },
];

function animCount(setter, target, suffix = '') {
  let n = 0;
  const step = Math.max(1, Math.floor(target / 60));
  const interval = setInterval(() => {
    n = Math.min(n + step, target);
    setter(n.toLocaleString('en-IN') + suffix);
    if (n >= target) clearInterval(interval);
  }, 20);
}

export default function Hero({ onOpenSignIn }) {
  const canvasRef = useRef(null);
  const [twText, setTwText] = useState('');
  const [violations, setViolations] = useState('0');
  const [cameras, setCameras] = useState('0');
  const [accuracy, setAccuracy] = useState('0%');

  // Typewriter effect
  useEffect(() => {
    let i = 0, c = 0, deleting = false;
    let timer;
    const tick = () => {
      const word = phrases[i];
      if (!deleting) {
        c++;
        setTwText(word.slice(0, c));
        if (c === word.length) { deleting = true; timer = setTimeout(tick, 1800); return; }
      } else {
        c--;
        setTwText(word.slice(0, c));
        if (c === 0) { deleting = false; i = (i + 1) % phrases.length; }
      }
      timer = setTimeout(tick, deleting ? 40 : 60);
    };
    timer = setTimeout(tick, 200);
    return () => clearTimeout(timer);
  }, []);

  // Counter animation on mount
  useEffect(() => {
    const t = setTimeout(() => {
      animCount(setViolations, 1284);
      animCount(setCameras, 47);
      let n = 0;
      const t2 = setInterval(() => {
        n = Math.min(n + 2, 98);
        setAccuracy(n + '%');
        if (n >= 98) clearInterval(t2);
      }, 25);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Hero canvas not found');
      return;
    }
    
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Canvas context not available');
        return;
      }
      
      let animId;

      const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };
      resize();
      window.addEventListener('resize', resize);

      const dots = Array.from({ length: 70 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5,
      }));

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(227,240,255,.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

        dots.forEach((d) => {
          d.x += d.vx; d.y += d.vy;
          if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
          if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(227,240,255,.5)'; ctx.fill();
        });

        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
              ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
              ctx.strokeStyle = `rgba(227,240,255,${0.1 * (1 - dist / 110)})`; ctx.lineWidth = 0.5; ctx.stroke();
            }
          }
        }
        animId = requestAnimationFrame(draw);
      };
      draw();
      return () => { 
        cancelAnimationFrame(animId); 
        window.removeEventListener('resize', resize); 
      };
    } catch (err) {
      console.error('Hero canvas error:', err);
    }
  }, []);

  return (
    <section className="hero" id="home">
      <canvas id="hero-canvas" ref={canvasRef}></canvas>
      <div className="hero-overlay"></div>
      <div className="hero-row">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-pulse"></span>
            PS #67 · Maharashtra Smart Cities · YOLOv8
          </div>
          <h1 className="hero-title">
            Every road.<br />
            <span className="ital">Every violation.</span><br />
            <span className="hot">Caught live.</span>
          </h1>
          <div className="tw-wrap">
            <span className="tw-text" id="tw-text">{twText}</span>
            <span className="tw-cur"></span>
          </div>
          <div className="hero-btns">
            <button className="btn-cta" onClick={onOpenSignIn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>View Live Dashboard</span>
            </button>
            <a href="#violations" className="btn-text-link">See how it works →</a>
          </div>
          <div className="hero-stats-bar">
            <div className="hstat">
              <span className="hstat-dot"></span>
              <span className="hstat-num">{violations}</span>
              <span className="hstat-label">Violations Today</span>
            </div>
            <div className="hstat">
              <span className="hstat-dot" style={{ background: '#f4a261' }}></span>
              <span className="hstat-num">{cameras}</span>
              <span className="hstat-label">Active Cameras</span>
            </div>
            <div className="hstat" style={{ background: 'rgba(82,183,136,.12)', borderColor: 'rgba(82,183,136,.3)' }}>
              <span className="hstat-dot" style={{ background: '#52b788' }}></span>
              <span className="hstat-num" style={{ color: '#52b788' }}>{accuracy}</span>
              <span className="hstat-label">Model Accuracy</span>
            </div>
          </div>
        </div>

        <div className="dash-hero-card">
          <div className="dhc-head">
            <div>
              <div className="dhc-head-title">Live Violation Feed</div>
              <div className="dhc-head-sub">यातायात उल्लंघन लाइव फ़ीड</div>
            </div>
            <div className="live-pill"><span className="live-dot"></span>STREAMING</div>
          </div>
          <div className="dhc-body">
            {HERO_FEED.map((item, idx) => (
              <div className="feed-row" key={idx}>
                <div className={`feed-badge ${item.badge}`}>{item.emoji}</div>
                <div className="feed-info">
                  <div className="feed-type">
                    {item.type}
                    {item.isNew && <span className="new-tag">NEW</span>}
                  </div>
                  <div className="feed-loc">{item.loc}</div>
                </div>
                <div className="feed-time">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
