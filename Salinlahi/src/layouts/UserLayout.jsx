import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, ClipboardList, Settings } from "lucide-react";

function UserLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="app-container">
      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <Link to="/user" className={`nav-item ${path === '/user' ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link to="/user/currentayuda" className={`nav-item ${path === '/user/currentayuda' ? 'active' : ''}`}>
          <ClipboardList size={24} />
          <span>Ayuda</span>
        </Link>
        <Link to="/user/settings" className={`nav-item ${path === '/user/settings' ? 'active' : ''}`}>
          <Settings size={24} />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default UserLayout;
