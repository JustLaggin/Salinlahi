import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusSquare,
  ScanLine,
  List,
  UserRoundPlus,
  UsersRound,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { isAdmin, logout } = useAuth();
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
        <span className="admin-mobile-title">Admin</span>,
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
          <h2>Salinlahi Admin</h2>
        </div>
        <nav className="admin-nav" aria-label="Sidebar Navigation">
          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Main</span>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              end
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin/create-event"
                className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              >
                <PlusSquare size={20} />
                <span>New Event</span>
              </NavLink>
            )}
            <NavLink
              to="/admin/scan"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              <ScanLine size={20} />
              <span>Scan QR</span>
            </NavLink>
            <NavLink
              to="/admin/events"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              <List size={20} />
              <span>Events</span>
            </NavLink>
          </div>

          {isAdmin && (
            <div className="admin-nav-group">
              <span className="admin-nav-group-title">Management</span>
              <NavLink
                to="/admin/manage-staff"
                className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              >
                <UsersRound size={20} />
                <span>Manage Staff</span>
              </NavLink>
              <NavLink
                to="/admin/manage-citizens"
                className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              >
                <UserRoundPlus size={20} />
                <span>Manage Citizens</span>
              </NavLink>
            </div>
          )}

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

export default AdminLayout;
