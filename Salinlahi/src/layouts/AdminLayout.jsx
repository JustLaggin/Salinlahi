import { Link, Outlet } from "react-router-dom";
import { useEffect } from "react";

function AdminLayout() {
  useEffect(() => {
    const setActiveNav = () => {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      const currentPath = window.location.pathname;
      document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPath) {
          item.classList.add('active');
        }
      });
    };
    setActiveNav();
    window.addEventListener('popstate', setActiveNav);
    return () => window.removeEventListener('popstate', setActiveNav);
  }, []);

  return (

      <div className="app-container">
        <main className="page-content">
          <Outlet />
        </main>

        <nav className="bottom-nav">
          <Link to="/admin/AdminHome" className="nav-item">
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </Link>
          <Link to="/admin/CreateAyuda" className="nav-item">
            <span className="nav-icon">➕</span>
            <span className="nav-label">Create</span>
          </Link>
          <Link to="/admin/scan" className="nav-item">
            <span className="nav-icon">📷</span>
            <span className="nav-label">Scan</span>
          </Link>
          <Link to="/admin/CurrentAyuda" className="nav-item">
            <span className="nav-icon">📋</span>
            <span className="nav-label">Manage</span>
          </Link>
          <Link to="/admin/Settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </Link>
        </nav>
      </div>
  );
}

export default AdminLayout;
