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
      <div className="base-card" style={styles.navbar}>
        <Link to="/user/dashboard" style={styles.navItem}>🏠</Link>
        <Link to="/user/tracker" style={styles.navItem}>📋</Link>
        <Link to="/user/settings" style={styles.navItem}>⏏</Link>
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

export default UserLayout;