import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  List,
  LogOut,
  UserRoundPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function StaffLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const { logout } = useAuth();

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
      <aside className="admin-sidebar">
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
    </div>
  );
}

export default StaffLayout;
