import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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

  return (
    <div className="admin-dashboard">
      {/* Mobile Top Bar */}
      <div className="admin-mobile-topbar">
        <h2>Salinlahi Staff</h2>
        <button 
          className="admin-mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <h2>Salinlahi Staff</h2>
        </div>
        <nav className="admin-nav">
          <Link
            to="/staff/StaffHome"
            className={`admin-nav-item ${path === "/staff/StaffHome" ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/staff/scan"
            className={`admin-nav-item ${path === "/staff/scan" ? "active" : ""}`}
          >
            <ScanLine size={20} />
            <span>Scan QR</span>
          </Link>
          <Link
            to="/staff/CurrentAyuda"
            className={`admin-nav-item ${path === "/staff/CurrentAyuda" ? "active" : ""}`}
          >
            <List size={20} />
            <span>Active Ayuda</span>
          </Link>
          <Link
            to="/staff/ManageCitizens"
            className={`admin-nav-item ${path === "/staff/ManageCitizens" ? "active" : ""}`}
          >
            <UserRoundPlus size={20} />
            <span>Manage Citizens</span>
          </Link>
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

      {/* Mobile Overlay Background */}
      <div 
        className="admin-mobile-overlay" 
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </div>
  );
}

export default StaffLayout;
