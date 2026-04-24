import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, QrCode, LogOut, History } from "lucide-react";
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
          <QrCode size={24} />
          <span>QR ID</span>
        </Link>
        <Link
          to="/user/history"
          className={`nav-item ${path === "/user/history" ? "active" : ""}`}
        >
          <History size={24} />
          <span>History</span>
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
