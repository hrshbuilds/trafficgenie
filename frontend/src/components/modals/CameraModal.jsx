import { useAuth } from '../../context/AuthContext';

export default function CameraModal({ open, onClose, onOpenUpload, onSignIn }) {
  const { currentUser } = useAuth();

  if (!open) return null;
  return (
    <div className="tw-modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tw-modal">
        <div className="tw-modal-head">
          <button className="tw-modal-close" onClick={onClose}>✕</button>
          <div className="eyebrow">CAMERA SYSTEM</div>
          <h3>Connect a<br /><em>Camera Feed</em></h3>
        </div>
        <div className="tw-modal-body">
          <p style={{ fontSize: '.8rem', color: '#546E7A', marginBottom: '1.4rem', lineHeight: 1.6 }}>
            Choose how you'd like to connect your surveillance feed for real-time violation detection.
          </p>

          {/* Coming soon option */}
          <div className="cam-option disabled">
            <span className="coming-soon-badge">COMING SOON</span>
            <div className="cam-option-inner">
              <div className="cam-option-icon blue">📡</div>
              <div style={{ flex: 1 }}>
                <h4>Connect Live CCTV Camera</h4>
                <p>Stream live RTSP/IP camera feeds directly to TrafficWatch for real-time AI violation detection. Zero hardware changes required.</p>
                <div className="cam-tags">
                  <span className="cam-tag blue">RTSP</span>
                  <span className="cam-tag blue">IP Camera</span>
                  <span className="cam-tag blue">Real-time</span>
                  <span className="cam-tag blue">Zero Lag</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload option */}
          <div className="cam-option enabled" onClick={() => { if (!currentUser) { onSignIn('camera'); return; } onClose(); onOpenUpload(); }}>
            <div className="cam-option-inner">
              <div className="cam-option-icon navy">📤</div>
              <div style={{ flex: 1 }}>
                <h4>Upload CCTV Footage</h4>
                <p>Upload existing CCTV recordings for batch analysis. YOLOv8 processes each frame to flag violations with timestamps and confidence scores.</p>
                <div className="cam-tags">
                  <span className="cam-tag navy">MP4</span>
                  <span className="cam-tag navy">AVI</span>
                  <span className="cam-tag navy">MOV</span>
                  <span className="cam-tag navy">MKV</span>
                  <span className="cam-tag navy">Batch Analysis</span>
                </div>
              </div>
              <div className="cam-option-arrow">›</div>
            </div>
          </div>

          {!currentUser && (
            <div className="tw-info" style={{ marginTop: '1.5rem' }}>
              ⚠ Please <button onClick={() => onSignIn('camera')}>Sign In</button> to use camera features.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
