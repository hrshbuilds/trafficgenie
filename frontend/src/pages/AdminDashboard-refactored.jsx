import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useViolations } from '../hooks/useViolations';
import { useTopStats } from '../hooks/useAnalytics';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';

import HotspotHeatmap from '../components/HotspotHeatmap';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ViolationLog from '../components/ViolationLog';
import ChallanSection from '../components/ChallanSection';
import './AdminDashboard.css';

// Constants
const WARDS = [
  'All Wards', 'Sadar', 'Panchavati', 'Nashik Road', 'Deolali Camp', 'Cidco', 'Satpur', 
  'Gangapur Road', 'Indira Nagar', 'Trimbak Road', 'MG Road', 'College Road', 'Ambad', 'Dwarka'
];

const VIOLATION_TYPES = [
  'All Types', 'No Helmet', 'Red Light', 'Triple Riding', 'Wrong Side', 'Speed Breach', 'Zebra Cross'
];

const ZONES = [
  'Nashik Zone', 'Mumbai West', 'Pune Central', 'Nagpur South', 'Amravati City'
];

export default function AdminDashboard({ onOpenModal }) {
  const { signOut } = useAuth();
  
  // ✅ Fetch real data from API instead of hardcoded
  const { violations, loading: violationsLoading, error: violationsError, refetch: refetchViolations } = useViolations({
    limit: 25
  });
  
  const { stats, loading: statsLoading, error: statsError } = useTopStats();

  // UI State
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));
  const [tlSeconds, setTlSeconds] = useState(18);
  const [tlPhase, setTlPhase] = useState('red');
  const [activeZone, setActiveZone] = useState('Nashik Zone');
  const [filters, setFilters] = useState({ ward: '', type: '', status: '', plate: '' });
  const [agentCollapsed, setAgentCollapsed] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [activeCam, setActiveCam] = useState('CAM-01');
  const [activeTab, setActiveTab] = useState('live');

  // Clock & Traffic Light Effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour12: false }));

      setTlSeconds(prev => {
        if (prev <= 1) {
          if (tlPhase === 'red') { setTlPhase('green'); return 22; }
          if (tlPhase === 'green') { setTlPhase('amber'); return 4; }
          setTlPhase('red'); return 18;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [tlPhase]);

  // Fallback stats if API not ready
  const displayStats = stats || {
    violations: 0,
    alerts: violations.filter(v => v.status === 'urgent').length,
    challans: 0,
    fine: '₹0'
  };

  const filteredViolations = violations.filter(v => {
    if (filters.ward && v.ward !== filters.ward) return false;
    if (filters.type && v.type !== filters.type) return false;
    if (filters.status && v.status !== filters.status) return false;
    if (filters.plate && !v.plate.toUpperCase().includes(filters.plate.toUpperCase())) return false;
    return true;
  });

  // Show loading state
  if (violationsLoading || statsLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (violationsError) {
    return (
      <ErrorMessage 
        error={violationsError}
        onRetry={refetchViolations}
      />
    );
  }

  return (
    <div className="adm-shell">
      {/* TOP BAR */}
      <header className="adm-topbar">
        <div className="adm-topbar-brand">
          <svg viewBox="0 0 34 44" fill="none">
            <rect x="4" y="4" width="26" height="36" rx="3" fill="#E3F0FF" opacity=".9" />
            <path d="M10 14h14M10 20h10M10 26h12" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round" />
            <circle cx="27" cy="34" r="6" fill="#e85d26" />
            <path d="M25 34l1.5 1.5L29 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          TrafficWatch — Nashik
        </div>

        <div className="adm-topbar-stats">
          <div className="adm-tstat">
            <div className="adm-tstat-num">{displayStats.violations?.toLocaleString?.('en-IN') || 0}</div>
            <div className="adm-tstat-label">Violations Today</div>
          </div>
          <div className="adm-tstat">
            <div className="adm-tstat-num" style={{ color: displayStats.alerts > 5 ? '#e85d26' : '#52b788' }}>
              {displayStats.alerts || 0}
            </div>
            <div className="adm-tstat-label">Alerts</div>
          </div>
          <div className="adm-tstat">
            <div className="adm-tstat-num">{displayStats.challans || 0}</div>
            <div className="adm-tstat-label">Challans</div>
          </div>
          <div className="adm-tstat">
            <div className="adm-tstat-num" style={{ color: '#f4a261' }}>
              {displayStats.fine}
            </div>
            <div className="adm-tstat-label">Fine Collected</div>
          </div>
        </div>

        <div className="adm-topbar-right">
          <div className="adm-time">{time}</div>
          <button onClick={signOut} className="adm-signout" title="Sign Out">
            ⎋
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="adm-main">
        {/* LEFT: VIOLATIONS FEED */}
        <div className="adm-feed-section">
          <div className="feed-toolbar">
            <h2>Live Violation Feed</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="live-pill">
                <span className="live-dot"></span>LIVE · {filteredViolations.length}
              </span>
              <button onClick={refetchViolations} className="tool-btn" title="Refresh">
                ↻
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="feed-filters">
            <select 
              value={filters.ward} 
              onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
              className="feed-select"
            >
              {WARDS.map(w => <option key={w} value={w === 'All Wards' ? '' : w}>{w}</option>)}
            </select>

            <select 
              value={filters.type} 
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="feed-select"
            >
              {VIOLATION_TYPES.map(t => <option key={t} value={t === 'All Types' ? '' : t}>{t}</option>)}
            </select>

            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="feed-select"
            >
              <option value="">All Status</option>
              <option value="urgent">Urgent</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>

            <input 
              type="text" 
              placeholder="Search plate..." 
              value={filters.plate}
              onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
              className="feed-input"
            />
          </div>

          {/* VIOLATION CARDS */}
          <div className="feed-list">
            {filteredViolations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                📭 No violations found with current filters
              </div>
            ) : (
              filteredViolations.map((v, i) => (
                <div 
                  key={v.id} 
                  className="v-card" 
                  style={{
                    animation: `slideUp 0.5s ease ${i * 0.1}s both`
                  }}
                  onClick={() => setSelectedViolation(v)}
                >
                  <div className="v-card-glow"></div>
                  <div className="v-badge">
                    <span className="v-icon">{v.icon}</span>
                    {v.type} · {v.status.toUpperCase()}
                  </div>
                  <h3>{v.loc}</h3>
                  <p>{v.narration}</p>
                  <div className="conf-meter">
                    <span className="conf-label">Model Confidence</span>
                    <div className="conf-num">{v.conf}%</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${v.conf}%` }}></div>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    <span>{v.plate}</span>
                    <span>{v.cam} · {v.time}</span>
                    <span style={{ color: v.risk > 75 ? '#e85d26' : '#52b788' }}>Risk: {v.risk}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: PANELS */}
        <div className="adm-right-panels">
          {/* HEATMAP */}
          <div className="adm-panel">
            <HotspotHeatmap />
          </div>

          {/* ANALYTICS */}
          <div className="adm-panel">
            <AnalyticsDashboard />
          </div>
        </div>
      </div>

      {/* BOTTOM TABS */}
      <div className="adm-bottom-tabs">
        <button 
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          📊 Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'violations' ? 'active' : ''}`}
          onClick={() => setActiveTab('violations')}
        >
          🚨 All Violations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'challans' ? 'active' : ''}`}
          onClick={() => setActiveTab('challans')}
        >
          📋 Challans
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="adm-tab-content">
        {activeTab === 'live' && <div style={{ height: '300px' }}>Live content here</div>}
        {activeTab === 'violations' && <ViolationLog />}
        {activeTab === 'challans' && <ChallanSection />}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(82, 183, 136, 0.15);
          border: 1px solid #52b788;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          color: #52b788;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          background: #52b788;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .tool-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .feed-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #2a3548;
          flex-wrap: wrap;
        }

        .feed-select, .feed-input {
          padding: 8px 12px;
          background: #0d1720;
          border: 1px solid #2a3548;
          color: #fff;
          border-radius: 4px;
          font-size: 12px;
        }

        .feed-select:focus, .feed-input:focus {
          outline: none;
          border-color: #1565C0;
        }
      `}</style>
    </div>
  );
}