import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Link } from "react-router-dom";

function AdminDashboard() {
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  const startScanner = async () => {
    try {
      setScanning(true);

      scannerRef.current = new Html5Qrcode("reader");

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          alert("Scanned Data:\n" + decodedText);
        }
      );

      isRunningRef.current = true;
    } catch (err) {
      console.error("Camera error:", err);
      alert("Camera failed to start. Make sure HTTPS is used.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      await scannerRef.current.stop();
      isRunningRef.current = false;
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={styles.page}>
      <div className="base-card" style={styles.card}>
        <h1 className="soft-white-glow" style={{margin: "0 0 15px 0", fontSize: "2rem"}}>Admin Dashboard</h1>

        {!scanning ? (
          <button onClick={startScanner} style={styles.gradientButton}>
            Start QR Scanner
          </button>
        ) : (
          <button onClick={stopScanner} style={styles.stopButton}>
            Stop Scanner
          </button>
        )}

        <div id="reader" style={styles.reader}></div>
      </div>

      {/* Bottom Navigation */}
      <div className="base-card" style={styles.navbar}>
        <Link to="/admin/home" style={styles.navItem}>🏠</Link>
        <Link to="/admin/scan" style={styles.navItem}>📷</Link>
        <Link to="/admin/aid" style={styles.navItem}>🎁</Link>
        <Link to="/admin/users" style={styles.navItem}>👥</Link>
        <Link to="/admin/settings" style={styles.navItem}>⚙️</Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    textAlign: "center",
    paddingBottom: "100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  card: {
    width: "100%",
    maxWidth: "500px",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  gradientButton: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(to right, var(--color-primary-blue), var(--color-primary-green))",
    color: "#0B1121",
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginBottom: "20px"
  },

  stopButton: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "white",
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginBottom: "20px"
  },

  reader: {
    width: "100%",
    maxWidth: "300px",
    margin: "auto",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.9)"
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
    margin: 0
  },

  navItem: {
    textDecoration: "none",
    color: "var(--color-text-main)",
    transition: "transform 0.2s ease"
  }
};

export default AdminDashboard;
