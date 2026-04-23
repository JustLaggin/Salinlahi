import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
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
  const [manualReason, setManualReason] = useState(""); // <-- Mitigation 3: Fallback Audit
  
  const [userUid, setUserUid] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  
  const [idVerified, setIdVerified] = useState(false); // <-- Mitigation 2: Physical ID Verify

  /** Role of this citizen for the active Ayuda (set when scan confirm opens). */
  const [scanAyudaStatus, setScanAyudaStatus] = useState(null);
  const [activeAyudaMeta, setActiveAyudaMeta] = useState(null);

  const [successOverlay, setSuccessOverlay] = useState(null);

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const [pendingMethod, setPendingMethod] = useState("qr");
  const pendingManualReasonRef = useRef(""); // To store manual reason for the transaction

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

  useEffect(() => {
    if (!activeAyudaId) {
      setActiveAyudaMeta(null);
      return;
    }
    const local = ongoingAyudas.find((a) => a.id === activeAyudaId);
    if (local) {
      setActiveAyudaMeta(local);
      return;
    }
    const loadAyudaMeta = async () => {
      try {
        const snap = await getDoc(doc(db, "ayudas", activeAyudaId));
        if (snap.exists()) setActiveAyudaMeta({ id: snap.id, ...snap.data() });
      } catch (e) {
        console.error(e);
      }
    };
    void loadAyudaMeta();
  }, [activeAyudaId, ongoingAyudas]);

  const isServiceProgram = (activeAyudaMeta?.programType || "ONE_TIME") === "SERVICE";
  const requiredDays = Math.max(1, Number(activeAyudaMeta?.requiredDays || 1));

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        if (scannerRef.current) scannerRef.current.clear();
      } catch {
        // ignore
      }
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
        { fps: 5, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (claiming || confirmOpen) return; // Prevent double trigger
          scannerRef.current.pause(true);
          setScanResult("Scanned");
          setPendingMethod("qr");
          pendingManualReasonRef.current = "";
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
    setScanAyudaStatus(null);
    setLoadingUser(true);
    setIdVerified(false); // Reset verification state
    try {
      const userDoc = await findUserDocByScanPayload(payload);
      if (!userDoc) {
        alert("Citizen not found for this code.");
        setLoadingUser(false);
        if (scannerRef.current?.getState() === 2) {
          await scannerRef.current.resume();
        }
        return;
      }
      const uid = userDoc.id;
      setUserUid(uid);
      setUserData(userDoc.data());

      if (activeAyudaId) {
        const ayudaSnap = await getDoc(doc(db, "ayudas", activeAyudaId));
        if (ayudaSnap.exists()) {
          const d = ayudaSnap.data();
          const applicants = d.applicants || [];
          const beneficiaries = d.beneficiaries || [];
          setScanAyudaStatus({
            isApplicant: applicants.includes(uid),
            isBeneficiary: beneficiaries.includes(uid),
          });
        } else {
          setScanAyudaStatus({ isApplicant: false, isBeneficiary: false });
        }
      } else {
        setScanAyudaStatus(null);
      }

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
    setScanAyudaStatus(null);
    setIdVerified(false);
    if (scannerRef.current && isRunningRef.current && scannerRef.current.getState() === 2) {
      try {
        await scannerRef.current.resume();
      } catch {
        /* */
      }
    }
  };

  /** Gate / registration: add scanned citizen to this Ayuda's applicants (Admin approves later). */
  const registerAsApplicant = async () => {
    if (!activeAyudaId || !userUid || !userData) return;
    if (!idVerified) {
      setClaimError("You must verify the physical ID before proceeding.");
      return;
    }
    
    setClaiming(true);
    setClaimError("");
    try {
      const ayudaRef = doc(db, "ayudas", activeAyudaId);
      
      const displayName =
        `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
        "Citizen";
      const ayudaTitle = activeAyudaTitle || activeAyudaId;

      // Mitigation 1: Run Transaction to prevent double addition race conditions
      const success = await runTransaction(db, async (transaction) => {
        const ayudaSnap = await transaction.get(ayudaRef);
        if (!ayudaSnap.exists()) {
          throw new Error("Ayuda not found.");
        }
        
        const applicants = ayudaSnap.data().applicants || [];
        const beneficiaries = ayudaSnap.data().beneficiaries || [];

        if (beneficiaries.includes(userUid)) {
          throw new Error("ALREADY_BENEFICIARY");
        }

        if (applicants.includes(userUid)) {
          throw new Error("ALREADY_APPLICANT");
        }

        transaction.update(ayudaRef, { applicants: arrayUnion(userUid) });
        return true;
      });

      if (success) {
        // Non-critical update, safe to run outside transaction
        try {
          await updateDoc(doc(db, "users", userUid), {
            ayudas_applied: arrayUnion(activeAyudaId),
          });
        } catch (userErr) {
          console.error(userErr);
        }

        await stopScanner();
        setConfirmOpen(false);
        setManualOpen(false);
        setManualInput("");
        setManualReason("");
        setUserUid(null);
        setUserData(null);
        setScanAyudaStatus(null);
        setSuccessOverlay({
          type: "applicant",
          name: displayName,
          ayudaTitle,
        });
        playSuccessBeep();
      }

    } catch (e) {
      console.error(e);
      if (e.message === "ALREADY_BENEFICIARY") {
        setClaimError("This citizen is already an approved beneficiary. Use “Record claim” to log pickup.");
      } else if (e.message === "ALREADY_APPLICANT") {
        await stopScanner();
        setConfirmOpen(false);
        setManualOpen(false);
        setUserUid(null);
        setUserData(null);
        setSuccessOverlay({
          type: "already_applicant",
          name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "Citizen",
          ayudaTitle: activeAyudaTitle || activeAyudaId,
        });
      } else {
        setClaimError(e.message || "Could not register applicant.");
      }
    }
    setClaiming(false);
  };

  /** After approval only: log physical distribution (pickup). */
  const recordClaim = async () => {
    if (!activeAyudaId || !userUid || !userData) return;
    if (!idVerified) {
      setClaimError("You must verify the physical ID before proceeding.");
      return;
    }
    
    setClaiming(true);
    setClaimError("");
    try {
      const ayudaRef = doc(db, "ayudas", activeAyudaId);
      const claimRef = doc(db, "ayudas", activeAyudaId, "claims", userUid);
      
      const displayName =
        `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
        "Citizen";

      const programType = (activeAyudaMeta?.programType || "ONE_TIME").toUpperCase();
      const required = Math.max(1, Number(activeAyudaMeta?.requiredDays || 1));
      const todayKey = new Date().toISOString().slice(0, 10);
      const now = Timestamp.now();
      const method = pendingMethod;
      const reason = pendingManualReasonRef.current;
      
      // Mitigation 1: Run Transaction to prevent double claiming / double attendance logging
      await runTransaction(db, async (transaction) => {
        const ayudaSnap = await transaction.get(ayudaRef);
        if (!ayudaSnap.exists()) {
          throw new Error("Ayuda not found.");
        }
        
        const beneficiaries = ayudaSnap.data().beneficiaries || [];
        if (!beneficiaries.includes(userUid)) {
          throw new Error("Only approved beneficiaries can have a claim recorded.");
        }

        const existing = await transaction.get(claimRef);
        
        if (programType === "SERVICE") {
          const previousAttendance = existing.exists()
            ? existing.data().attendance || []
            : [];
          
          const alreadyToday = previousAttendance.some((a) => a.dateKey === todayKey);
          if (alreadyToday) {
            throw new Error("Error: Attendance already recorded for today. Please scan again tomorrow.");
          }

          if (previousAttendance.length >= required) {
            throw new Error("Required attendance days already completed.");
          }

          const nextAttendance = [
            ...previousAttendance,
            { dateKey: todayKey, checkedAt: now, method, manualReason: reason || null },
          ];

          transaction.set(claimRef, {
            displayName,
            citizenCode: userData.citizenCode || null,
            programType: "SERVICE",
            requiredDays: required,
            attendance: nextAttendance,
            completed: nextAttendance.length >= required,
            lastCheckInAt: now,
          });

          transaction.update(doc(db, "users", userUid), {
            claim_history: arrayUnion({
              ayudaId: activeAyudaId,
              claimedAt: now,
              type: "SERVICE_ATTENDANCE",
              attendanceDay: nextAttendance.length,
              requiredDays: required,
            }),
          });
        } else {
          if (existing.exists()) {
            throw new Error("Claim already recorded for this citizen.");
          }

          transaction.set(claimRef, {
            claimedAt: now,
            method,
            manualReason: reason || null,
            displayName,
            citizenCode: userData.citizenCode || null,
            programType: "ONE_TIME",
          });

          transaction.update(doc(db, "users", userUid), {
            claim_history: arrayUnion({
              ayudaId: activeAyudaId,
              claimedAt: now,
              type: "ONE_TIME_CLAIM",
            }),
          });
        }
      });

      await stopScanner();
      setConfirmOpen(false);
      setManualOpen(false);
      setManualInput("");
      setManualReason("");
      setUserUid(null);
      setUserData(null);
      setScanAyudaStatus(null);
      setSuccessOverlay({
        type: isServiceProgram ? "attendance" : "claim",
        name: displayName,
        ayudaTitle: activeAyudaTitle || activeAyudaId,
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
    setManualReason("");
    setManualOpen(true);
    setPendingMethod("manual");
  };

  const submitManual = async () => {
    const norm = normalizeCitizenCodeInput(manualInput);
    if (norm.length < 4) {
      alert("Enter the manual code (at least 4 characters).");
      return;
    }
    if (!manualReason) {
      alert("Please select a reason for manual entry to maintain the audit trail.");
      return;
    }
    setManualOpen(false);
    setPendingMethod("manual");
    pendingManualReasonRef.current = manualReason;
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

  // Clean unmount for Html5Qrcode to fix the persistent camera bug
  useEffect(() => {
    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) {
             scannerRef.current.clear();
          }
        }).catch(() => {});
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
            <div className="settings-text" style={{ marginTop: "0.3rem" }}>
              {isServiceProgram
                ? `SERVICE · ${requiredDays} required attendance day${requiredDays > 1 ? "s" : ""}`
                : `ONE_TIME · ${(activeAyudaMeta?.aidKind || "RELIEF_GOODS").replaceAll("_", " ")}`}
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
          <button type="button" className="auth-button" style={{ flex: 1, minWidth: "140px", background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }} onClick={openManual}>
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
              style={{ marginBottom: "1rem" }}
            />
            
            {/* Mitigation 3: Fallback Audit Trail */}
            <label className="settings-text" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Reason for Manual Entry (Required)
            </label>
            <select
              className="input-field"
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              style={{ marginBottom: "1.25rem" }}
            >
              <option value="">— Select Reason —</option>
              <option value="SUNLIGHT_GLARE">Sunlight Glare / Poor Lighting</option>
              <option value="DAMAGED_QR">Damaged or Crumpled QR Printout</option>
              <option value="CAMERA_FAILURE">Device Camera Failure / Lag</option>
              <option value="UNREADABLE_SCREEN">Citizen Phone Screen Unreadable</option>
              <option value="OTHER">Other Technical Issue</option>
            </select>

            <div style={{ display: "flex", gap: "0.75rem" }}>
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
            <h3 className="auth-title">
              {scanAyudaStatus?.isBeneficiary
                ? isServiceProgram
                  ? "Record attendance"
                  : "Record pickup"
                : scanAyudaStatus?.isApplicant
                  ? "Already an applicant"
                  : "Add to applicants"}
            </h3>
            <p className="settings-text" style={{ marginBottom: "1rem" }}>
              Ayuda:{" "}
              <strong>{activeAyudaTitle || activeAyudaId}</strong>
            </p>
            
            <div className="modal-inset-panel" style={{ marginBottom: "1rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "#166534" }}>
                {userData.first_name} {userData.last_name}
              </p>
              {userData.citizenCode && (
                <p className="settings-text" style={{ color: "#15803d" }}>Code: {userData.citizenCode}</p>
              )}
              <div className="settings-text" style={{ color: "#166534", marginTop: "0.75rem", textAlign: "left" }}>
                <p><strong>Email:</strong> {userData.email || "N/A"}</p>
                <p><strong>Phone:</strong> {userData.phone || userData.contact_number || "N/A"}</p>
                <p><strong>Birthday:</strong> {userData.birthday || "N/A"}</p>
                <p><strong>Address:</strong> {userData.address || "N/A"}</p>
                <p><strong>Barangay:</strong> {userData.barangay || "N/A"}</p>
                <p><strong>City:</strong> {userData.city || "N/A"}</p>
              </div>
            </div>

            {/* Mitigation 2: Mandatory Physical ID Verification */}
            {!scanAyudaStatus?.isApplicant && (
              <div style={{ 
                marginBottom: "1.25rem", 
                padding: "1rem", 
                backgroundColor: "var(--bg-muted)", 
                borderRadius: "8px",
                borderLeft: "4px solid #f59e0b"
              }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={idVerified}
                    onChange={(e) => setIdVerified(e.target.checked)}
                    style={{ width: "20px", height: "20px", marginTop: "0.1rem" }}
                  />
                  <span style={{ fontSize: "0.95rem", lineHeight: "1.4" }}>
                    <strong>Physical ID Verified</strong><br/>
                    <span className="settings-text">I have checked a physical ID card and confirmed the face matches the registered name above.</span>
                  </span>
                </label>
              </div>
            )}

            {scanAyudaStatus?.isBeneficiary ? (
              <p className="settings-text" style={{ marginBottom: "1rem" }}>
                This citizen is already an <strong>approved beneficiary</strong>. Use
                the button below to{" "}
                {isServiceProgram
                  ? "record today's attendance."
                  : "record that aid was physically handed out."}{" "}
                Approvals stay in <strong>Active Ayuda</strong> (applicants list).
              </p>
            ) : scanAyudaStatus?.isApplicant ? (
              <p className="settings-text" style={{ marginBottom: "1rem" }}>
                They are already on the <strong>applicant</strong> list for this
                event. An admin or staff member can <strong>Accept</strong> or{" "}
                <strong>Reject</strong> them under Active Ayuda → Applicants.
              </p>
            ) : (
              <p className="settings-text" style={{ marginBottom: "1rem" }}>
                Register them as an <strong>applicant</strong> for this Ayuda. They
                are <strong>not</strong> a beneficiary until someone accepts them in
                Active Ayuda.
              </p>
            )}

            {claimError && (
              <p style={{ color: "#ef4444", fontWeight: 500, marginBottom: "1rem", padding: "0.5rem", backgroundColor: "#fee2e2", borderRadius: "6px" }}>
                {claimError}
              </p>
            )}
            
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", width: "100%" }}>
              {scanAyudaStatus?.isBeneficiary ? (
                <button
                  type="button"
                  className="auth-button approve-btn"
                  disabled={claiming || !idVerified}
                  onClick={() => void recordClaim()}
                  style={{ opacity: (!idVerified || claiming) ? 0.6 : 1, flex: 1, minWidth: "160px" }}
                >
                  {claiming
                    ? "Saving…"
                    : isServiceProgram
                      ? "Record attendance"
                      : "Record claim"}
                </button>
              ) : scanAyudaStatus?.isApplicant ? null : (
                <button
                  type="button"
                  className="auth-button approve-btn"
                  disabled={claiming || !idVerified}
                  onClick={() => void registerAsApplicant()}
                  style={{ opacity: (!idVerified || claiming) ? 0.6 : 1, flex: 1, minWidth: "160px" }}
                >
                  {claiming ? "Saving…" : "Add to applicants"}
                </button>
              )}
              <button
                type="button"
                className="auth-button btn-neutral-gradient"
                disabled={claiming}
                onClick={() => void closeConfirm()}
                style={{ flex: 1, minWidth: "160px" }}
              >
                {scanAyudaStatus?.isApplicant ? "Close" : "Cancel"}
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
              {successOverlay.type === "already_applicant" ? "ℹ" : "✓"}
            </div>
            <h2 className="claim-success-title">
              {successOverlay.type === "claim"
                ? "Claim recorded"
                : successOverlay.type === "attendance"
                  ? "Attendance recorded"
                : successOverlay.type === "already_applicant"
                  ? "Already on applicant list"
                  : "Applicant registered"}
            </h2>
            <p className="claim-success-name">{successOverlay.name}</p>
            <p className="claim-success-ayuda">{successOverlay.ayudaTitle}</p>
            {successOverlay.type === "applicant" && (
              <p className="settings-text" style={{ marginTop: "0.75rem", opacity: 0.9 }}>
                Approve or reject in Active Ayuda → Applicants.
              </p>
            )}
            {successOverlay.type === "already_applicant" && (
              <p className="settings-text" style={{ marginTop: "0.75rem", opacity: 0.9 }}>
                Waiting for approval in Active Ayuda.
              </p>
            )}
            <p className="claim-success-tap">Tap to continue</p>
          </div>
        </button>
      )}
    </div>
  );
}

export default AdminScan;
