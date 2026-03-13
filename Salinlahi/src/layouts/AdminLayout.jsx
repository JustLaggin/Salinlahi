import { Link, Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div style={styles.page}>
      {/* Page content changes here */}
      <div style={styles.content}>
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="base-card" style={styles.navbar}>
        <Link to="/admin/AdminHome" style={styles.navItem}>🏠</Link>
        <Link to="/admin/CreateAyuda" style={styles.navItem}>➕</Link>
        <Link to="/admin/scan" style={styles.navItem}>📷</Link>
        <Link to="/admin/CurrentAyuda" style={styles.navItem}>📋</Link>
        <Link to="/admin/Settings" style={styles.navItem}>⚙️</Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: "100px"
  },

  content: {
    padding: "20px"
  },

  navbar: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "500px",
    height: "60px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    fontSize: "24px",
    padding: "0 20px",
    margin: 0,
    zIndex: 1000
  },

  navItem: {
    textDecoration: "none",
    color: "var(--color-text-main)",
    transition: "transform 0.2s ease"
  }
};

export default AdminLayout;