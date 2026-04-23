import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, QrCode, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

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

      <nav className="bottom-nav">
        <Link
          to="/user"
          className={`nav-item ${path === "/user" ? "active" : ""}`}
        >
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link
          to="/user/currentayuda"
          className={`nav-item ${path === "/user/currentayuda" ? "active" : ""}`}
        >
          <QrCode size={24} />
          <span>QR</span>
        </Link>
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
