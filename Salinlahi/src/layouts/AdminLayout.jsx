import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusSquare, ScanLine, List, Settings } from "lucide-react";

function AdminLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Salinlahi Admin</h2>
        </div>
        <nav className="admin-nav">
          <Link to="/admin/AdminHome" className={`admin-nav-item ${path === '/admin/AdminHome' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/CreateAyuda" className={`admin-nav-item ${path === '/admin/CreateAyuda' ? 'active' : ''}`}>
            <PlusSquare size={20} />
            <span>Create</span>
          </Link>
          <Link to="/admin/scan" className={`admin-nav-item ${path === '/admin/scan' ? 'active' : ''}`}>
            <ScanLine size={20} />
            <span>Scan QR</span>
          </Link>
          <Link to="/admin/CurrentAyuda" className={`admin-nav-item ${path === '/admin/CurrentAyuda' ? 'active' : ''}`}>
            <List size={20} />
            <span>Active Ayuda</span>
          </Link>
          <Link to="/admin/Settings" className={`admin-nav-item ${path === '/admin/Settings' ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      <main className="dashboard-content page-transition" key={path}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
