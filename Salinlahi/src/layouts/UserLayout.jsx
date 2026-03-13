import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "react-qr-code";

function UserLayout() {
    const [uuid, setUuid] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;

      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUuid(docSnap.data().uuid);
      }

      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading) return <h2>Loading...</h2>;
  return (
    <div style={styles.page}>
      
      <div style={styles.content}>
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div style={styles.navbar}>
        <Link to="/user/UserHome" style={styles.navItem}>🏠</Link>
        <Link to="/user/ApplyAyuda" style={styles.navItem}>➕</Link>
        <Link to="/user/CurrentAyuda" style={styles.navItem}>📋</Link>
        <Link to="/user/Settings" style={styles.navItem}>⚙️</Link>
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

export default UserLayout;