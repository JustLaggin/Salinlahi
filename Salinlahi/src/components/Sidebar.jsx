import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  ScanLine,
  ClipboardList,
  Settings,
  Home,
  Package,
} from 'lucide-react';
import logo from '../assets/Logo_Black.png';
import '../css/components.css';

function Sidebar({ role = 'user' }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine navigation items based on role
  const navItems = role === 'admin' 
    ? [
        { label: 'Dashboard', path: '/admin/AdminHome', icon: LayoutDashboard },
        { label: 'Create Ayuda', path: '/admin/CreateAyuda', icon: PlusCircle },
        { label: 'Scan QR', path: '/admin/scan', icon: ScanLine },
        { label: 'Current List', path: '/admin/CurrentAyuda', icon: ClipboardList },
        { label: 'Settings', path: '/admin/Settings', icon: Settings },
      ]
    : [
        { label: 'Dashboard', path: '/user', icon: Home },
        { label: 'My Ayuda', path: '/user/currentayuda', icon: Package },
        { label: 'Settings', path: '/user/settings', icon: Settings },
      ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Add your logout logic here
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="mobile-menu-btn">
        <button 
          className="btn btn-ghost"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo Section */}
        <div className="app-sidebar-top">
          <Link to="/" className="sidebar-logo">
            <img src={logo} alt="Salinlahi" />
          </Link>
          <p className="sidebar-subtitle">Assistance Distribution System</p>
        </div>

        {/* Navigation */}
        <nav className="app-sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="nav-icon">
                <item.icon size={18} strokeWidth={2} />
              </span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="app-sidebar-bottom">
          <button
            className="nav-item nav-item-logout"
            onClick={handleLogout}
          >
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
