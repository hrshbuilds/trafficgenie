import React, { useState, useMemo } from 'react';
import { useViolations } from '../hooks/useViolations';
import LoadingSkeleton from './common/LoadingSkeleton';
import ErrorMessage from './common/ErrorMessage';
import EmptyState from './common/EmptyState';

const ViolationLog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // Fetch violations from API via hook
  const { violations, loading, error, refetch } = useViolations({ limit: 100 });

  const filteredData = useMemo(() => {
    return (violations || []).filter(v => {
      const matchesSearch = 
        (v.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (v.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.owner || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All Types' || v.type === typeFilter;
      const matchesStatus = statusFilter === 'All Status' || v.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [violations, searchTerm, typeFilter, statusFilter]);

  const typeOptions = ['All Types', 'No Helmet', 'Signal Jump', 'Triple Riding', 'Wrong Lane'];
  const statusOptions = ['All Status', 'Issued', 'Pending', 'Void'];

  // Calculate stats from current data
  const totalLogged = violations?.length || 0;
  const resolved = violations?.filter(v => v.status === 'Issued')?.length || 0;

  return (
    <div style={{ background: '#0d1720', height: '100%', display: 'flex', flexDirection: 'column', color: '#E3F0FF', fontFamily: "'DM Sans', sans-serif" }}>
      {/* HEADER SECTION */}
      <div style={{ padding: '24px', background: '#1a2535', borderBottom: '1px solid #2a3548' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Violation Log — Nashik District</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Real-time audit trail of all detected traffic offences</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: 'rgba(232, 93, 38, 0.1)', border: '1px solid rgba(232, 93, 38, 0.3)', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', color: 'rgba(232,93,38,0.7)' }}>Total Logged</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{totalLogged}</span>
            </div>
            <div style={{ background: 'rgba(82, 183, 136, 0.1)', border: '1px solid rgba(82, 183, 136, 0.3)', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', color: 'rgba(82, 183, 136, 0.7)' }}>Resolved</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{resolved}</span>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Search by ID, Plate, or Owner..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', background: '#0d1720', border: '1px solid #2a3548',
                color: '#fff', fontSize: '13px', borderRadius: '4px', outline: 'none'
              }}
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', background: '#0d1720', border: '1px solid #2a3548', color: '#fff', fontSize: '13px', outline: 'none' }}
          >
            {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', background: '#0d1720', border: '1px solid #2a3548', color: '#fff', fontSize: '13px', outline: 'none' }}
          >
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <button style={{ padding: '8px 16px', background: '#e85d26', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}>
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* TABLE AREA */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        {loading && <LoadingSkeleton type="table" />}
        {error && <ErrorMessage error={error} onRetry={refetch} />}
        {!loading && !error && filteredData.length === 0 && (
          <EmptyState 
            icon="🔍" 
            title="No violations found" 
            message="Try adjusting your filters or search terms"
          />
        )}
        {!loading && !error && filteredData.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#1a2535', borderBottom: '2px solid #2a3548' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Case ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Vehicle Details</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Violation Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Location / Cam</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Confidence</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Fine</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: 'bold', color: '#1565C0' }}>{v.id}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{v.vehicle}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{v.owner}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                      background: v.type === 'Signal Jump' ? 'rgba(232, 93, 38, 0.15)' : 'rgba(21, 101, 192, 0.15)',
                      color: v.type === 'Signal Jump' ? '#f4a261' : '#42a5f5',
                      border: `1px solid ${v.type === 'Signal Jump' ? 'rgba(232, 93, 38, 0.3)' : 'rgba(21, 101, 192, 0.3)'}`
                    }}>
                      {v.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px' }}>{v.section}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{v.camera} · {v.time}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: v.conf > 90 ? '#52b788' : '#f4a261' }}>{v.conf}%</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>YOLOv8 Precise</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }}>₹{v.fine}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                      color: v.status === 'Issued' ? '#52b788' : '#f4a261'
                    }}>
                      ● {v.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button style={{ 
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
                      padding: '4px 10px', fontSize: '10px', cursor: 'pointer', borderRadius: '2px' 
                    }}>
                      VIEW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ViolationLog;
