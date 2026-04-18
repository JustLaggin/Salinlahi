import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useActiveAyuda } from "../context/ActiveAyudaContext";
import { normalizeCitizenCodeInput } from "../utils/citizenCode";
import { playSuccessBeep } from "../utils/playSuccessBeep";

async function findUserDocByScanPayload(decodedText) {
  const raw = String(decodedText || "").trim();
  if (!raw) return null;
  const byUuid = query(collection(db, "users"), where("uuid", "==", raw));
  let snap = await getDocs(byUuid);
  if (!snap.empty) return snap.docs[0];
  const code = normalizeCitizenCodeInput(raw);
  if (code.length >= 4) {
    snap = await getDocs(
      query(collection(db, "users"), where("citizenCode", "==", code))
    );
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

function AdminScan() {
  const {
    activeAyudaId,
    activeAyudaTitle,
    setActiveAyuda,
    clearActiveAyuda,
  } = useActiveAyuda();

  const [ongoingAyudas, setOngoingAyudas] = useState([]);
  const [pickerValue, setPickerValue] = useState("");
  const [loadingAyudas, setLoadingAyudas] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [userUid, setUserUid] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  const [successOverlay, setSuccessOverlay] = useState(null);

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const [pendingMethod, setPendingMethod] = useState("qr");

  const loadOngoing = useCallback(async () => {
    setLoadingAyudas(true);
    try {
      const snapshot = await getDocs(collection(db, "ayudas"));
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (a) =>
            a.status === "ONGOING" ||
            (a.available !== false && !a.status)
        );
      setOngoingAyudas(list);
    } catch (err) {
      console.error(err);
    }
    setLoadingAyudas(false);
  }, []);

  useEffect(() => {
    void loadOngoing();
  }, [loadOngoing]);

  useEffect(() => {
    if (activeAyudaId) setPickerValue(activeAyudaId);
  }, [activeAyudaId]);

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      await scannerRef.current.stop().catch(() => {});
      isRunningRef.current = false;
    }
    scannerRef.current = null;
    setScanning(false);
    setScanResult("");
  };

  const startScanner = async () => {
    if (!activeAyudaId) return;
    try {
      await stopScanner();
      const readerEl = document.getElementById("reader");
      if (readerEl) readerEl.innerHTML = "";
      setScanning(true);
      setScanResult("Starting camera…");
      scannerRef.current = new Html5Qrcode("reader", { verbose: false });
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 5, qrbox: { width: 200, height: 200 } },
        async (decodedText) => {
          scannerRef.current.pause(true);
          setScanResult("Scanned");
          setPendingMethod("qr");
          await openConfirmForPayload(decodedText);
        },
        () => {}
      );
      isRunningRef.current = true;
      setScanResult("Scanning…");
    } catch (err) {
      setScanResult(`Camera error: ${err?.message || err}`);
      setScanning(false);
    }
  };

  const openConfirmForPayload = async (payload) => {
    setClaimError("");
    setLoadingUser(true);
    try {
      const userDoc = await findUserDocByScanPayload(payload);
      if (!userDoc) {
        alert("Citizen not found for this code.");
        setLoadingUser(false);
        await scannerRef.current?.resume();
        return;
      }
      setUserUid(userDoc.id);
      setUserData(userDoc.data());
      setConfirmOpen(true);
    } catch (e) {
      console.error(e);
      alert("Lookup failed.");
    }
    setLoadingUser(false);
  };

  const closeConfirm = async () => {
    setConfirmOpen(false);
    setUserUid(null);
    setUserData(null);
    setClaimError("");
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.resume();
      } catch {
        /* */
      }
    }
  };

  const confirmClaim = async () => {
    if (!activeAyudaId || !userUid || !userData) return;
    setClaiming(true);
    setClaimError("");
    try {
      const ayudaSnap = await getDoc(doc(db, "ayudas", activeAyudaId));
      if (!ayudaSnap.exists()) {
        setClaimError("Ayuda not found.");
        setClaiming(false);
        return;
      }
      const beneficiaries = ayudaSnap.data().beneficiaries || [];
      if (!beneficiaries.includes(userUid)) {
        setClaimError("This citizen is not an approved beneficiary for this Ayuda.");
        setClaiming(false);
        return;
      }
      const claimRef = doc(db, "ayudas", activeAyudaId, "claims", userUid);
      const existing = await getDoc(claimRef);
      if (existing.exists()) {
        setClaimError("Claim already recorded for this citizen.");
        setClaiming(false);
        return;
      }
      const displayName =
        `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
        "Citizen";
      await setDoc(claimRef, {
        claimedAt: Timestamp.now(),
        method: pendingMethod,
        displayName,
        citizenCode: userData.citizenCode || null,
      });
      await updateDoc(doc(db, "users", userUid), {
        claim_history: arrayUnion({
          ayudaId: activeAyudaId,
          claimedAt: Timestamp.now(),
        }),
      });
      await stopScanner();
      setConfirmOpen(false);
      setManualOpen(false);
      setManualInput("");
      setUserUid(null);
      setUserData(null);
      setSuccessOverlay({
        name: displayName,
        ayudaTitle: activeAyudaTitle || ayudaSnap.data().title || activeAyudaId,
      });
      playSuccessBeep();
    } catch (e) {
      console.error(e);
      setClaimError(e.message || "Could not save claim.");
    }
    setClaiming(false);
  };

  const dismissSuccess = () => setSuccessOverlay(null);

  const openManual = () => {
    setManualInput("");
    setManualOpen(true);
    setPendingMethod("manual");
  };

  const submitManual = async () => {
    const norm = normalizeCitizenCodeInput(manualInput);
    if (norm.length < 4) {
      alert("Enter the manual code (at least 4 characters).");
      return;
    }
    setManualOpen(false);
    setPendingMethod("manual");
    await openConfirmForPayload(norm);
  };

  const handlePickAyuda = () => {
    const a = ongoingAyudas.find((x) => x.id === pickerValue);
    if (!a) {
      alert("Select an Ayuda event.");
      return;
    }
    setActiveAyuda(a.id, a.title || "");
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  if (!activeAyudaId) {
    return (
      <div style={{ maxWidth: "560px", margin: "0 auto", paddingBottom: "2rem" }}>
        <div className="base-card">
          <h2 className="auth-title">Select active Ayuda</h2>
          <p className="settings-text" style={{ marginBottom: "1.25rem" }}>
            Choose the distribution you are scanning for. This is required before
            opening the camera.
          </p>
          {loadingAyudas ? (
            <p className="settings-text">Loading events…</p>
          ) : ongoingAyudas.length === 0 ? (
            <p className="settings-text">No ongoing Ayuda events available.</p>
          ) : (
            <>
              <div className="input-group" style={{ marginBottom: "1rem" }}>
                <label>Ongoing event</label>
                <select
                  className="input-field"
                  value={pickerValue}
                  onChange={(e) => setPickerValue(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {ongoingAyudas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title || a.id}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="auth-button" onClick={handlePickAyuda}>
                Continue to scanner
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "2rem" }}>
      <div
        className="scanner-ayuda-banner"
        style={{
          marginBottom: "1rem",
          padding: "1rem 1.25rem",
          borderRadius: "14px",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-muted)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-secondary)",
              }}
            >
              Scanning for
            </div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {activeAyudaTitle || activeAyudaId}
            </div>
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              void stopScanner();
              clearActiveAyuda();
            }}
          >
            Change event
          </button>
        </div>
      </div>

      <div className="base-card qr-scanner-card">
        <h2 className="auth-title">QR Scanner</h2>

        <div className="scanner-controls" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          {!scanning ? (
            <button type="button" className="auth-button" onClick={startScanner}>
              Start camera
            </button>
          ) : (
            <button
              type="button"
              className="auth-button btn-neutral-gradient"
              onClick={() => void stopScanner()}
            >
              Stop camera
            </button>
          )}
          <button type="button" className="action-btn" onClick={openManual}>
            Manual ID
          </button>
        </div>

        <div id="reader" style={{ minHeight: "350px", width: "100%" }} />

        <div className="scanner-status mono-text scanner-status-panel">
          {loadingUser ? "Looking up citizen…" : scanResult || "Ready"}
        </div>
      </div>

      {manualOpen && (
        <div className="modal-overlay modal-overlay--padded">
          <div className="base-card modal-panel modal-panel--scan">
            <h3 className="auth-title">Manual citizen code</h3>
            <p className="settings-text" style={{ marginBottom: "1rem" }}>
              Enter the code shown under the citizen&apos;s QR (letters and numbers
              only).
            </p>
            <input
              className="input-field"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. ABC12F"
              autoCapitalize="characters"
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button type="button" className="auth-button" onClick={submitManual}>
                Look up
              </button>
              <button
                type="button"
                className="auth-button btn-neutral-gradient"
                onClick={() => setManualOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && userData && (
        <div className="modal-overlay modal-overlay--padded">
          <div className="base-card modal-panel modal-panel--scan">
            <h3 className="auth-title">Confirm claim</h3>
            <p className="settings-text" style={{ marginBottom: "1rem" }}>
              Ayuda:{" "}
              <strong>{activeAyudaTitle || activeAyudaId}</strong>
            </p>
            <div className="modal-inset-panel" style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {userData.first_name} {userData.last_name}
              </p>
              {userData.citizenCode && (
                <p className="settings-text">Code: {userData.citizenCode}</p>
              )}
            </div>
            {claimError && (
              <p style={{ color: "#f87171", marginBottom: "1rem" }}>{claimError}</p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="auth-button approve-btn"
                disabled={claiming}
                onClick={() => void confirmClaim()}
              >
                {claiming ? "Saving…" : "Confirm claim"}
              </button>
              <button
                type="button"
                className="auth-button btn-neutral-gradient"
                disabled={claiming}
                onClick={() => void closeConfirm()}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {successOverlay && (
        <button
          type="button"
          className="claim-success-overlay"
          onClick={dismissSuccess}
          aria-label="Dismiss success"
        >
          <div className="claim-success-card">
            <div className="claim-success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="claim-success-title">Claim recorded</h2>
            <p className="claim-success-name">{successOverlay.name}</p>
            <p className="claim-success-ayuda">{successOverlay.ayudaTitle}</p>
            <p className="claim-success-tap">Tap to continue</p>
          </div>
        </button>
      )}
    </div>
  );
}

export default AdminScan;
