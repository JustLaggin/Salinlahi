import { Link, Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div style={styles.page}>
      {/* Page content changes here */}
      <div style={styles.content}>
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div style={styles.navbar}>
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
    paddingBottom: "70px"
  },

  content: {
    padding: "20px"
  },

  navbar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "60px",
    backgroundColor: "#ffffff",
    borderTop: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    fontSize: "24px",
    zIndex: 1000
  },

  navItem: {
    textDecoration: "none",
    color: "#333"
  }
};

export default AdminLayout;