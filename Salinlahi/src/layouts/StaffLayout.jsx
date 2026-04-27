import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  List,
  LogOut,
  UserRoundPlus,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function StaffLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const headerActionsNode = document.getElementById("global-header-actions");
  const headerTitleNode = document.getElementById("global-header-title");

  return (
    <div className="admin-dashboard">
      {headerTitleNode && createPortal(
        <span className="admin-mobile-title">Staff</span>,
        headerTitleNode
      )}
      {headerActionsNode && createPortal(
        <button 
          className="admin-mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>,
        headerActionsNode
      )}

      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <h2>Salinlahi Staff</h2>
        </div>
        <nav className="admin-nav" aria-label="Sidebar Navigation">
          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Main</span>
            <NavLink
              to="/staff/dashboard"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              end
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/staff/scan"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              <ScanLine size={20} />
              <span>Scan QR</span>
            </NavLink>
            <NavLink
              to="/staff/events"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              <List size={20} />
              <span>Events</span>
            </NavLink>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Management</span>
            <NavLink
              to="/staff/manage-citizens"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              <UserRoundPlus size={20} />
              <span>Manage Citizens</span>
            </NavLink>
          </div>

          <div className="admin-nav-spacer"></div>

          <button
            type="button"
            className="admin-nav-item admin-nav-item--button logout-button"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="dashboard-content page-transition" key={path}>
        <Outlet />
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="admin-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}

export default StaffLayout;
