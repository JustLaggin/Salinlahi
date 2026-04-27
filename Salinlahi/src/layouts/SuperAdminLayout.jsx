import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <span className="admin-mobile-title">Super Admin</span>,
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
          <h2>Salinlahi Super Admin</h2>
        </div>
        <nav className="admin-nav" aria-label="Sidebar Navigation">
          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Management</span>
            <NavLink
              to="/super-admin/staff-admin"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              <ShieldCheck size={20} />
              <span>Manage Admins</span>
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

      {mobileMenuOpen && (
        <div className="admin-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}

