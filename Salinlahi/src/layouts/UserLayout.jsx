import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, QrCode, LogOut, History } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function UserLayout() {
  const navigate = useNavigate();

  const { logout: authLogout } = useAuth();

  const handleLogout = async () => {
    try {
      await authLogout();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-container">
      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Bottom Navigation">
        <NavLink
          to="/user"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          end
        >
          <QrCode size={24} />
          <span>My QR</span>
        </NavLink>
        <NavLink
          to="/user/history"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <History size={24} />
          <span>History</span>
        </NavLink>
        <button
          type="button"
          className="nav-item nav-item--button"
          onClick={handleLogout}
          aria-label="Log out"
        >
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}

export default UserLayout;
