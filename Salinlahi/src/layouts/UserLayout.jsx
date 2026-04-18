import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const logout = async () => {
    try {
      await signOut(auth);
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
          <ClipboardList size={24} />
          <span>Ayuda</span>
        </Link>
        <button
          type="button"
          className="nav-item nav-item--button"
          onClick={logout}
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
