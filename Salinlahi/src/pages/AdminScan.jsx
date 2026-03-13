import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

function AdminScan() {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  const startScanner = async () => {
    try {
      setScanning(true);

      scannerRef.current = new Html5Qrcode("admin-reader");

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
    <div className="page-root page-scroll">
      <div className="stack-md">
        <div className="base-card card card--wide">
          <h2 className="soft-white-glow" style={{ marginTop: 0 }}>
            Admin QR Scanner
          </h2>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Use this scanner for administrative checks and debugging.
          </p>

          <div style={{ marginTop: "16px" }}>
            {!scanning ? (
              <button
                className="btn btn-primary btn--full"
                onClick={startScanner}
              >
                Start Scanner
              </button>
            ) : (
              <button
                className="btn btn-danger btn--full"
                onClick={stopScanner}
              >
                Stop Scanner
              </button>
            )}
          </div>

          <div
            id="admin-reader"
            style={{
              width: "100%",
              maxWidth: "320px",
              margin: "16px auto 0 auto",
              backgroundColor: "rgba(15,23,42,0.6)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminScan;