import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

function AdminScan() {
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
    <div style={{ textAlign: "center" }}>
      <h2>QR Scanner</h2>

      {!scanning ? (
        <button style={{padding: "12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",}} onClick={startScanner}>Start Scanner</button>
      ) : (
        <button style={{padding: "12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#dc2626",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",}} onClick={stopScanner}>Stop Scanner</button>
      )}

      <div id="reader" style={{ width: "300px", margin: "auto" }}></div>
    </div>
  );
}

export default AdminScan;