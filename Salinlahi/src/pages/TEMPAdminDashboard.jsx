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
      <h1>Admin Dashboard</h1>

      {!scanning ? (
        <button onClick={startScanner} style={styles.button}>
          Start QR Scanner
        </button>
      ) : (
        <button onClick={stopScanner} style={styles.button}>
          Stop Scanner
        </button>
      )}

      <div id="reader" style={styles.reader}></div>

      {/* Bottom Navigation */}
      <div style={styles.navbar}>
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
    paddingBottom: "80px"
  },

  button: {
    padding: "10px",
    marginBottom: "20px"
  },

  reader: {
    width: "300px",
    margin: "auto"
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
    fontSize: "24px"
  },

  navItem: {
    textDecoration: "none",
    color: "#333"
  }
};
