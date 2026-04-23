import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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
        <nav className="admin-nav">
          <Link
            to="/admin/AdminHome"
            className={`admin-nav-item ${path === "/admin/AdminHome" ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin/CreateAyuda"
              className={`admin-nav-item ${path === "/admin/CreateAyuda" ? "active" : ""}`}
            >
              <PlusSquare size={20} />
              <span>Create</span>
            </Link>
          )}
          <Link
            to="/admin/scan"
            className={`admin-nav-item ${path === "/admin/scan" ? "active" : ""}`}
          >
            <ScanLine size={20} />
            <span>Scan QR</span>
          </Link>
          <Link
            to="/admin/CurrentAyuda"
            className={`admin-nav-item ${path === "/admin/CurrentAyuda" ? "active" : ""}`}
          >
            <List size={20} />
            <span>Active Ayuda</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin/StaffManagement"
              className={`admin-nav-item ${path === "/admin/StaffManagement" ? "active" : ""}`}
            >
              <UsersRound size={20} />
              <span>Manage Staff</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/ManageCitizens"
              className={`admin-nav-item ${path === "/admin/ManageCitizens" ? "active" : ""}`}
            >
              <UserRoundPlus size={20} />
              <span>Manage Citizens</span>
            </Link>
          )}
          <button
            type="button"
            className="admin-nav-item admin-nav-item--button"
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
