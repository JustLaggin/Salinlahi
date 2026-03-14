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
          <Link to="/admin/AdminHome" className="nav-item">🏠 Home</Link>
          <Link to="/admin/CreateAyuda" className="nav-item">➕ New</Link>
          <Link to="/admin/scan" className="nav-item">📷 Scan</Link>
          <Link to="/admin/CurrentAyuda" className="nav-item">📋 List</Link>
          <Link to="/admin/Settings" className="nav-item">⚙️ Settings</Link>
        </nav>
      </div>
  );
}

export default AdminLayout;
