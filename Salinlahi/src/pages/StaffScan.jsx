import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

function StaffScan() {
  const [scanning, setScanning] = useState(false);
  const [ayudas, setAyudas] = useState([]);
  const [selectedAyudaId, setSelectedAyudaId] = useState("");
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const fetchAyudas = async () => {
      const snapshot = await getDocs(collection(db, "ayudas"));
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setAyudas(list);
    };

    fetchAyudas();
  }, []);

  const handleScanResult = async (decodedText) => {
    try {
      if (!selectedAyudaId) {
        setMessage("Please select an Ayuda event before scanning.");
        return;
      }

      const userUuid = decodedText.trim();
      const ayudaRef = doc(db, "ayudas", selectedAyudaId);
      const ayudaSnap = await getDoc(ayudaRef);

      if (!ayudaSnap.exists()) {
        setMessage("Selected Ayuda not found.");
        return;
      }

      const data = ayudaSnap.data();
      const beneficiaries = data.beneficiaries || [];

      if (beneficiaries.includes(userUuid)) {
        setMessage("This household has already claimed this Ayuda.");
        return;
      }

      await updateDoc(ayudaRef, {
        beneficiaries: arrayUnion(userUuid),
      });

      setMessage("Claim recorded successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to record claim. Please try again.");
    }
  };

  const startScanner = async () => {
    try {
      setMessage("");
      setScanning(true);

      scannerRef.current = new Html5Qrcode("staff-reader");

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          handleScanResult(decodedText);
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
            Scan Citizen QR
          </h2>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Select an ayuda event, then scan the citizen&apos;s QR code to record a claim.
          </p>

          <div className="field-group" style={{ marginTop: "12px" }}>
            <label className="field-label">Ayuda Event</label>
            <select
              className="select"
              value={selectedAyudaId}
              onChange={(e) => setSelectedAyudaId(e.target.value)}
            >
              <option value="">Select Ayuda</option>
              {ayudas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} — {a.barangay}, {a.city}
                </option>
              ))}
            </select>
          </div>

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
            id="staff-reader"
            style={{
              width: "100%",
              maxWidth: "320px",
              margin: "16px auto 0 auto",
              backgroundColor: "rgba(15,23,42,0.6)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          />

          {message && (
            <p
              style={{
                marginTop: "14px",
                fontSize: "0.9rem",
                color: "var(--color-text-accent)",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffScan;

