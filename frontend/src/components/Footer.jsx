export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand-col">
          <div className="footer-brand">Traffic<em>Watch</em></div>
          <p>AI-powered traffic violation detection for Maharashtra's Smart Cities. Built on the Civic Pulse infrastructure.</p>
          <div style={{ marginTop: '1rem', fontSize: '.68rem', color: 'rgba(255,255,255,.3)', letterSpacing: '1px' }}>
            यातायात निगरानी प्रणाली · PS #67
          </div>
        </div>
        <div className="footer-col">
          <h4>Detection</h4>
          <a href="#">No Helmet</a>
          <a href="#">Signal Jump</a>
          <a href="#">Triple Riding</a>
          <a href="#">Wrong Lane</a>
          <a href="#">Zebra Crossing</a>
        </div>
        <div className="footer-col">
          <h4>Zones</h4>
          <a href="#">Mumbai · मुंबई</a>
          <a href="#">Pune · पुणे</a>
          <a href="#">Nagpur · नागपुर</a>
          <a href="#">Nashik · नाशिक</a>
          <a href="#">Amravati · अमरावती</a>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <a href="#">Dashboard</a>
          <a href="#">Camera Setup</a>
          <a href="#">API Docs</a>
          <a href="#">Officer App</a>
          <a href="#">About PS #67</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 · TrafficWatch · Built on Civic Pulse · Maharashtra Smart City Mission</p>
        <p className="footer-hindi">भारत सरकार · यातायात प्रवर्तन विभाग</p>
      </div>
    </footer>
  );
}
