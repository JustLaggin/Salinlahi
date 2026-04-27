import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Lock, Eye, HelpCircle } from 'lucide-react';
import '../css/settings.css';
import { useState } from 'react';

function Settings() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setLogoutLoading(false);
    }
  };

  return (
    <div className="settings-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Settings</h1>
        <p className="text-secondary">Manage your account preferences and security</p>
      </div>

      {/* Settings Sections */}
      <div className="settings-sections">
        {/* Notifications Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon notification-icon">
              <Bell size={24} />
            </div>
            <div>
              <h3 className="settings-title">Notifications</h3>
              <p className="text-secondary">Manage how you receive notifications</p>
            </div>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <div className="setting-item-label">
                <p className="setting-label">Email Notifications</p>
                <p className="text-tertiary">Receive updates about your ayuda status</p>
              </div>
              <div className="toggle-switch">
                <input type="checkbox" id="email-notif" defaultChecked />
                <label htmlFor="email-notif"></label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-item-label">
                <p className="setting-label">SMS Notifications</p>
                <p className="text-tertiary">Get alerts via text message</p>
              </div>
              <div className="toggle-switch">
                <input type="checkbox" id="sms-notif" defaultChecked />
                <label htmlFor="sms-notif"></label>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon security-icon">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="settings-title">Privacy & Security</h3>
              <p className="text-secondary">Control your account security settings</p>
            </div>
          </div>

          <div className="settings-content">
            <button className="settings-button">
              <div className="settings-button-label">
                <p className="setting-label">Change Password</p>
                <p className="text-tertiary">Update your account password</p>
              </div>
              <span>→</span>
            </button>

            <button className="settings-button">
              <div className="settings-button-label">
                <p className="setting-label">Two-Factor Authentication</p>
                <p className="text-tertiary">Add an extra layer of security</p>
              </div>
              <span>→</span>
            </button>

            <button className="settings-button">
              <div className="settings-button-label">
                <p className="setting-label">Active Sessions</p>
                <p className="text-tertiary">View and manage your login sessions</p>
              </div>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon privacy-icon">
              <Eye size={24} />
            </div>
            <div>
              <h3 className="settings-title">Privacy</h3>
              <p className="text-secondary">Choose what information is shared</p>
            </div>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <div className="setting-item-label">
                <p className="setting-label">Profile Visibility</p>
                <p className="text-tertiary">Allow program administrators to see your profile</p>
              </div>
              <div className="toggle-switch">
                <input type="checkbox" id="profile-vis" defaultChecked />
                <label htmlFor="profile-vis"></label>
              </div>
            </div>

            <button className="settings-button">
              <div className="settings-button-label">
                <p className="setting-label">View Privacy Policy</p>
                <p className="text-tertiary">Learn how we protect your data</p>
              </div>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon help-icon">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="settings-title">Help & Support</h3>
              <p className="text-secondary">Get assistance and learn more</p>
            </div>
          </div>

          <div className="settings-content">
            <button className="settings-button">
              <div className="settings-button-label">
                <p className="setting-label">Frequently Asked Questions</p>
                <p className="text-tertiary">Find answers to common questions</p>
              </div>
              <span>→</span>
            </button>

            <button className="settings-button">
              <div className="settings-button-label">
                <p className="setting-label">Contact Support</p>
                <p className="text-tertiary">Get help from our support team</p>
              </div>
              <span>→</span>
            </button>

            <button className="settings-button">
              <div className="settings-button-label">
                <p className="setting-label">Report an Issue</p>
                <p className="text-tertiary">Help us improve by reporting problems</p>
              </div>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="settings-card logout-section">
          <button
            className="btn btn-danger btn-full btn-lg"
            onClick={() => setShowLogoutConfirm(true)}
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <LogOut size={20} />
            Sign Out
          </button>
          <p className="text-tertiary" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            You will be logged out and returned to the login page
          </p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Sign Out</h2>
              <button
                className="modal-close"
                onClick={() => setShowLogoutConfirm(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="text-secondary">
                Are you sure you want to sign out? You will need to log in again to access the program.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={logoutLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
