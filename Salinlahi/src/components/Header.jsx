import { User, Bell, HelpCircle } from 'lucide-react';
import '../css/components.css';

function Header({ userName = 'User', userRole = 'Resident' }) {
  return (
    <header className="app-header">
      {/* Left Section */}
      <div className="app-header-left">
        <h1 className="app-header-title">Salinlahi</h1>
        <p className="app-header-subtitle">{userRole} Portal</p>
      </div>

      {/* Right Section */}
      <div className="app-header-right">
        {/* Help Button */}
        <button className="header-icon-btn" title="Help">
          <HelpCircle size={20} />
        </button>

        {/* Notifications */}
        <button className="header-icon-btn" title="Notifications">
          <Bell size={20} />
          <span className="notification-badge">2</span>
        </button>

        {/* User Menu */}
        <div className="header-user-menu">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-role">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
