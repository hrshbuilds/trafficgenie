import React, { useState, useMemo } from 'react';

const VIOLATIONS_DATA = [
  { id: 'TW-3001', vehicle: 'MH-15-AB-1234', owner: 'Rajesh Kumar Patil', phone: '9823011234', type: 'No Helmet', section: 'CBS Chowk', camera: 'CAM-01', date: '2026-03-20', time: '08:12:04', conf: 96, fine: 500, challan: 'NK-CH-301', officer: 'Sub-Insp. Desai S.R.', status: 'Issued' },
  { id: 'TW-3002', vehicle: 'MH-15-CD-5678', owner: 'Suresh Baban Jadhav', phone: '9765432100', type: 'Signal Jump', section: 'CBS Chowk', camera: 'CAM-01', date: '2026-03-20', time: '08:34:19', conf: 91, fine: 1000, challan: 'NK-CH-302', officer: 'Constable Mane P.K.', status: 'Issued' },
  { id: 'TW-3003', vehicle: 'MH-15-EF-9101', owner: 'Priya Nilesh Sharma', phone: '9870012345', type: 'Triple Riding', section: 'CBS Chowk', camera: 'CAM-02', date: '2026-03-20', time: '09:05:33', conf: 98, fine: 1500, challan: 'NK-CH-303', officer: 'Sub-Insp. Desai S.R.', status: 'Issued' },
  { id: 'TW-3004', vehicle: 'MH-15-GH-1121', owner: 'Amit Vishnu Chopra', phone: '9012345678', type: 'No Helmet', section: 'CBS Chowk', camera: 'CAM-02', date: '2026-03-20', time: '09:41:07', conf: 93, fine: 500, challan: 'NK-CH-304', officer: 'Constable Shinde R.D.', status: 'Pending' },
  { id: 'TW-3005', vehicle: 'MH-15-IJ-3141', owner: 'Meera Ramesh Kulkarni', phone: '9823456789', type: 'Wrong Lane', section: 'CBS Chowk', camera: 'CAM-01', date: '2026-03-20', time: '10:15:52', conf: 87, fine: 500, challan: 'NK-CH-305', officer: 'Constable Mane P.K.', status: 'Issued' },
  { id: 'TW-3006', vehicle: 'MH-15-KL-5161', owner: 'Deepak Anand Wagh', phone: '9765001122', type: 'Signal Jump', section: 'CBS Chowk', camera: 'CAM-01', date: '2026-03-20', time: '10:52:44', conf: 90, fine: 1000, challan: 'NK-CH-306', officer: 'Sub-Insp. Desai S.R.', status: 'Issued' },
  { id: 'TW-3007', vehicle: 'MH-15-MN-7181', owner: 'Sunita Prakash Deshpande', phone: '9011223344', type: 'No Helmet', section: 'CBS Chowk', camera: 'CAM-02', date: '2026-03-20', time: '11:28:09', conf: 95, fine: 500, challan: 'NK-CH-307', officer: 'Constable Shinde R.D.', status: 'Issued' },
  { id: 'TW-3008', vehicle: 'MH-15-OP-9202', owner: 'Vijay Narayan Bhosale', phone: '9876543210', type: 'Triple Riding', section: 'MG Road', camera: 'CAM-03', date: '2026-03-21', time: '08:03:17', conf: 97, fine: 1500, challan: 'NK-CH-308', officer: 'Sub-Insp. Patil M.S.', status: 'Issued' },
  { id: 'TW-3009', vehicle: 'MH-15-QR-2223', owner: 'Kavita Sunil Gaikwad', phone: '9823112233', type: 'No Helmet', section: 'MG Road', camera: 'CAM-04', date: '2026-03-21', time: '08:44:38', conf: 92, fine: 500, challan: 'NK-CH-309', officer: 'Constable Mane P.K.', status: 'Pending' },
  { id: 'TW-3010', vehicle: 'MH-15-ST-4244', owner: 'Rohit Ashok Nale', phone: '9765443322', type: 'Signal Jump', section: 'MG Road', camera: 'CAM-03', date: '2026-03-21', time: '09:22:55', conf: 89, fine: 1000, challan: 'NK-CH-310', officer: 'Constable Shinde R.D.', status: 'Issued' },
  { id: 'TW-3011', vehicle: 'MH-15-UV-6261', owner: 'Anita Manoj Shirke', phone: '9012334455', type: 'No Helmet', section: 'Gangapur Road', camera: 'CAM-05', date: '2026-03-20', time: '08:08:21', conf: 94, fine: 500, challan: 'NK-CH-311', officer: 'Sub-Insp. Yadav R.P.', status: 'Issued' },
  { id: 'TW-3012', vehicle: 'MH-15-WX-8281', owner: 'Sanjay Dilip More', phone: '9823224455', type: 'Wrong Lane', section: 'Gangapur Road', camera: 'CAM-05', date: '2026-03-20', time: '08:51:44', conf: 86, fine: 500, challan: 'NK-CH-312', officer: 'Constable Salve D.N.', status: 'Issued' },
  { id: 'TW-3013', vehicle: 'MH-15-YZ-0301', owner: 'Pooja Rajan Nair', phone: '9876001122', type: 'Signal Jump', section: 'Gangapur Road', camera: 'CAM-05', date: '2026-03-20', time: '09:17:08', conf: 91, fine: 1000, challan: 'NK-CH-313', officer: 'Sub-Insp. Yadav R.P.', status: 'Issued' },
  { id: 'TW-3014', vehicle: 'MH-15-AA-1323', owner: 'Nitin Shankar Pawar', phone: '9765554433', type: 'Triple Riding', section: 'Dwarka Circle', camera: 'CAM-06', date: '2026-03-20', time: '09:59:33', conf: 96, fine: 1500, challan: 'NK-CH-314', officer: 'Constable Salve D.N.', status: 'Pending' },
  { id: 'TW-3015', vehicle: 'MH-15-BB-3434', owner: 'Rekha Gopal Ingole', phone: '9011445566', type: 'No Helmet', section: 'Dwarka Circle', camera: 'CAM-06', date: '2026-03-20', time: '10:33:50', conf: 93, fine: 500, challan: 'NK-CH-315', officer: 'Sub-Insp. Yadav R.P.', status: 'Issued' },
  { id: 'TW-3016', vehicle: 'MH-15-CC-5454', owner: 'Aakash Hemant Lokhande', phone: '9823335566', type: 'Signal Jump', section: 'Panchavati', camera: 'CAM-07', date: '2026-03-21', time: '08:21:16', conf: 88, fine: 1000, challan: 'NK-CH-316', officer: 'Constable Salve D.N.', status: 'Issued' },
  { id: 'TW-3017', vehicle: 'MH-15-DD-7474', owner: 'Shilpa Kiran Thombare', phone: '9876223344', type: 'No Helmet', section: 'Panchavati', camera: 'CAM-07', date: '2026-03-21', time: '09:04:29', conf: 95, fine: 500, challan: 'NK-CH-317', officer: 'Sub-Insp. Yadav R.P.', status: 'Issued' },
  { id: 'TW-3018', vehicle: 'MH-15-EE-9494', owner: 'Kiran Vinod Sonawane', phone: '9765665544', type: 'Wrong Lane', section: 'Satpur MIDC', camera: 'CAM-08', date: '2026-03-21', time: '09:47:11', conf: 84, fine: 500, challan: 'NK-CH-318', officer: 'Constable Salve D.N.', status: 'Pending' },
];

const ViolationLog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const filteredData = useMemo(() => {
    return VIOLATIONS_DATA.filter(v => {
      const matchesSearch = v.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All Types' || v.type === typeFilter;
      const matchesStatus = statusFilter === 'All Status' || v.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter]);

  const typeOptions = ['All Types', 'No Helmet', 'Signal Jump', 'Triple Riding', 'Wrong Lane'];
  const statusOptions = ['All Status', 'Issued', 'Pending', 'Void'];

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
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>1,248</span>
            </div>
            <div style={{ background: 'rgba(82, 183, 136, 0.1)', border: '1px solid rgba(82, 183, 136, 0.3)', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', color: 'rgba(82, 183, 136, 0.7)' }}>Resolved</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>982</span>
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
        {filteredData.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', opacity: 0.3 }}>
            <span style={{ fontSize: '40px' }}>🔍</span>
            <p>No violations matches your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViolationLog;
