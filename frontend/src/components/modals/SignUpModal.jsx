import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
  </svg>
);

export default function SignUpModal({ open, onClose, onSwitchToSignIn }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!name || !email || !password) { setError('Please fill all required fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    try {
      const result = await signUp(email, password, name);
      if (result.success) {
        setName(''); setBadge(''); setEmail(''); setPassword(''); setConfirm('');
        onClose(true);
      } else {
        setError(result.error || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="tw-modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tw-modal">
        <div className="tw-modal-head">
          <button className="tw-modal-close" onClick={onClose}>✕</button>
          <div className="eyebrow">OFFICER REGISTRATION</div>
          <h3>Create<br /><em>Your Account</em></h3>
        </div>
        <div className="tw-modal-body">
          <div className="tw-row2">
            <div>
              <label className="tw-field-label">Full Name *</label>
              <input className="tw-input" type="text" value={name} placeholder="Officer Name" onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="tw-field-label">Badge No.</label>
              <input className="tw-input" type="text" value={badge} placeholder="MH-1234" onChange={(e) => setBadge(e.target.value)} />
            </div>
          </div>

          <label className="tw-field-label tw-mt">Email Address *</label>
          <input className="tw-input" type="email" value={email} placeholder="officer@maharashtra.gov.in" onChange={(e) => setEmail(e.target.value)} />

          <label className="tw-field-label tw-mt">Password *</label>
          <div className="tw-input-wrap">
            <input className="tw-input" type={showPass ? 'text' : 'password'} value={password}
              placeholder="Min 6 characters" style={{ paddingRight: '2.8rem' }}
              onChange={(e) => setPassword(e.target.value)} />
            <button className="tw-eye-btn" onClick={() => setShowPass(!showPass)}><EyeIcon /></button>
          </div>

          <label className="tw-field-label tw-mt">Confirm Password *</label>
          <input className="tw-input" type="password" value={confirm} placeholder="Re-enter password"
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />

          {error && <div className="tw-error">{error}</div>}

          <button className="tw-submit" disabled={loading} onClick={handleSubmit}>
            {loading ? <><span className="tw-spinner"></span> Creating Account…</> : 'Register →'}
          </button>

          <div className="tw-switch-txt">
            Already have an account?&nbsp;
            <button className="tw-switch-btn" onClick={() => { onClose(); onSwitchToSignIn(); }}>Sign In →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
