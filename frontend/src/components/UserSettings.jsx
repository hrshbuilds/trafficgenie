import { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from './common/ErrorMessage';
import './UserSettings.css';

/**
 * User Settings Page
 * Allows users to manage their profile and preferences
 */
export function UserSettings({ onClose }) {
  const { currentUser, signOut } = useAuth();
  const { profile, loading, error, updateProfile, updatePreferences, clearError } = useUserProfile();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'security'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    department: profile?.department || '',
    badge: profile?.badge || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  });

  const [preferences, setPreferences] = useState({
    notifyNewViolations: profile?.notifyNewViolations ?? true,
    notifyHighRiskAreas: profile?.notifyHighRiskAreas ?? true,
    theme: profile?.theme || 'dark',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const result = await updateProfile({
      displayName: formData.displayName,
      department: formData.department,
      badge: formData.badge,
      phone: formData.phone,
      bio: formData.bio,
    });
    setIsSaving(false);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const result = await updatePreferences(preferences);
    setIsSaving(false);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      onClose?.();
    }
  };

  if (loading) {
    return (
      <div className="user-settings">
        <div className="settings-loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="user-settings">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {error && (
        <ErrorMessage error={error} onDismiss={clearError} />
      )}

      {saveSuccess && (
        <div className="success-message">✓ Changes saved successfully</div>
      )}

      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="settings-content">
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Officer Name"
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="e.g., Traffic Control"
            />
          </div>

          <div className="form-group">
            <label>Badge Number</label>
            <input
              type="text"
              name="badge"
              value={formData.badge}
              onChange={handleInputChange}
              placeholder="e.g., TC-2025-001"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Contact number"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <button
            className="save-btn"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {activeTab === 'preferences' && (
        <div className="settings-content">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="notifyNewViolations"
                checked={preferences.notifyNewViolations}
                onChange={handlePreferenceChange}
              />
              <span>Notify me of new violations</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="notifyHighRiskAreas"
                checked={preferences.notifyHighRiskAreas}
                onChange={handlePreferenceChange}
              />
              <span>Notify me of high-risk areas</span>
            </label>
          </div>

          <div className="form-group">
            <label>Theme</label>
            <select
              name="theme"
              value={preferences.theme}
              onChange={handlePreferenceChange}
            >
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <button
            className="save-btn"
            onClick={handleSavePreferences}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <div className="settings-content">
          <div className="security-section">
            <h3>Account Information</h3>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{currentUser?.email}</span>
            </div>
            <div className="info-row">
              <span className="label">User ID:</span>
              <span className="value mono">{currentUser?.uid?.substring(0, 16)}...</span>
            </div>
            <div className="info-row">
              <span className="label">Account Status:</span>
              <span className="value status-active">Active</span>
            </div>
          </div>

          <div className="danger-zone">
            <h3>Sign Out</h3>
            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Sign Out
            </button>
            <p className="help-text">You will need to sign in again to access the dashboard.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSettings;
