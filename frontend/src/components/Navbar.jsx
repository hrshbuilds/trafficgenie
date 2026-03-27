import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenModal }) {
  const { currentUser, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const badgeRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <nav id="main-nav">
      <div className="nav-logo">
        <svg className="logo-svg" viewBox="0 0 34 44" fill="none">
          <rect x="4" y="4" width="26" height="36" rx="3" fill="#E3F0FF" opacity=".9"/>
          <path d="M10 14h14M10 20h10M10 26h12" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="27" cy="34" r="6" fill="#e85d26"/>
          <path d="M25 34l1.5 1.5L29 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="nav-brand">Traffic<em>Watch</em></span>
      </div>

      <ul className="nav-links">
        <li><a href="#violations">Violations</a></li>
        <li><a href="#zones">Zones</a></li>
        <li><a href="#feed">Live Feed</a></li>
        <li><a href="#tools">Tools</a></li>
      </ul>

      <div className="nav-auth">
        <div className="live-pill">
          <span className="live-dot"></span>LIVE · सक्रिय
        </div>

        {!currentUser ? (
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn-ghost-nav" onClick={() => onOpenModal('signin')}>Sign In</button>
            <button className="btn-fill-nav" onClick={() => onOpenModal('signup')}>Sign Up</button>
          </div>
        ) : (
          <div className="tw-user-badge" ref={badgeRef}>
            <button className="tw-user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="tw-user-avatar">{currentUser.name.charAt(0)}</div>
              <span className="tw-user-name">{currentUser.name.split(' ')[0]}</span>
              <span className="tw-user-caret">▼</span>
            </button>
            <div className={`tw-user-dropdown ${dropdownOpen ? 'open' : ''}`}>
              <div className="tw-user-info">
                <div className="uname">{currentUser.name}</div>
                <div className="uemail">{currentUser.email}</div>
              </div>
              <button className="tw-signout-btn" onClick={() => { signOut(); setDropdownOpen(false); }}>
                Sign Out
              </button>
            </div>
          </div>
        )}

        <button className="btn-camera-nav" onClick={() => onOpenModal('camera')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          Camera
        </button>
      </div>
    </nav>
  );
}
