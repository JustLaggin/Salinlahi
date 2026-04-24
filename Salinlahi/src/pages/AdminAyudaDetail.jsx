import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, addDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ArrowLeft, Check, X, Undo2, MapPin, Calendar, PhilippinePeso, Archive, Lock, RotateCcw } from "lucide-react";

const COLORS = {
  CLAIMED: "#34d399", // accent-green
  PENDING: "#475569", // text-secondary
  ACTIVE: "#38bdf8",  // accent-blue
};

function RatioTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="dashboard-chart-tooltip">
      <span style={{ color: payload[0].payload.fill, fontWeight: 700 }}>{name}</span>
      <span style={{ marginLeft: "0.5rem" }}>{value}</span>
    </div>
  );
}

function RatioLegend({ payload }) {
  if (!payload) return null;
  return (
    <div className="dashboard-chart-legend">
      {payload.map((entry, i) => (
        <div key={i} className="dashboard-chart-legend-item">
          <span className="dashboard-chart-legend-dot" style={{ background: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAyudaDetail() {
  const { ayudaId } = useParams();
  const navigate = useNavigate();
  const { isStaffOrAdmin, isAdmin } = useAuth();
  
  const [ayuda, setAyuda] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [claimsMap, setClaimsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!ayudaId) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "ayudas", ayudaId));
      if (!snap.exists()) {
        setAyuda(null);
        setLoading(false);
        return;
      }
      const data = { id: snap.id, ...snap.data() };
      setAyuda(data);
      
      const appList = data.applicants || [];
      const benList = data.beneficiaries || [];
      
      const fetchUsers = async (uids) => {
        return Promise.all(uids.map(async (uid) => {
          try {
             const u = await getDoc(doc(db, "users", uid));
             let displayName = uid;
             if (u.exists()) {
               const ud = u.data();
               displayName = `${ud.first_name || ""} ${ud.last_name || ""}`.trim() || uid;
               return { uid, displayName, profile: ud };
             }
             return { uid, displayName, profile: null };
          } catch(e) {
             return { uid, displayName: uid, profile: null };
          }
        }));
      };

      const [applicantsData, beneficiariesData] = await Promise.all([
        fetchUsers(appList),
        fetchUsers(benList)
      ]);
      
      setApplicants(applicantsData);
      setBeneficiaries(beneficiariesData);

      const claimsSnap = await getDocs(collection(db, "ayudas", ayudaId, "claims"));
      const cMap = {};
      claimsSnap.docs.forEach((d) => {
         cMap[d.id] = d.data();
      });
      setClaimsMap(cMap);

    } catch (e) {
      console.error(e);
      setAyuda(null);
    }
    setLoading(false);
  }, [ayudaId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approveApplicant = async (uid) => {
    if (!isStaffOrAdmin) return;
    try {
      const batch = writeBatch(db);
      const ayudaRef = doc(db, "ayudas", ayudaId);
      batch.update(ayudaRef, {
        applicants: arrayRemove(uid),
        beneficiaries: arrayUnion(uid)
      });
      batch.update(doc(db, "users", uid), {
        ayudas_applied: arrayRemove(ayudaId),
        ayudas_beneficiary: arrayUnion(ayudaId)
      });
      await batch.commit();
      await refresh();
    } catch(err) {
      console.error(err);
      alert("Error approving applicant.");
    }
  };

  const rejectApplicant = async (uid) => {
    if (!isStaffOrAdmin) return;
    if (!window.confirm("Reject this applicant?")) return;
    try {
      const batch = writeBatch(db);
      const ayudaRef = doc(db, "ayudas", ayudaId);
      batch.update(ayudaRef, { applicants: arrayRemove(uid) });
      batch.update(doc(db, "users", uid), {
        ayudas_applied: arrayRemove(ayudaId)
      });
      await batch.commit();
      await refresh();
    } catch(err) {
      console.error(err);
      alert("Error rejecting applicant.");
    }
  };

  const removeBeneficiary = async (uid) => {
    if (!isAdmin) return;
    if (!window.confirm("Move this user back to applicants? This will revoke their approval.")) return;
    try {
      const batch = writeBatch(db);
      const ayudaRef = doc(db, "ayudas", ayudaId);
      batch.update(ayudaRef, {
        beneficiaries: arrayRemove(uid),
        applicants: arrayUnion(uid)
      });
      batch.update(doc(db, "users", uid), {
        ayudas_beneficiary: arrayRemove(ayudaId),
        ayudas_applied: arrayUnion(ayudaId)
      });
      await batch.commit();
      await refresh();
    } catch(err) {
      console.error(err);
      alert("Error moving beneficiary back.");
    }
  };

  const [isCloning, setIsCloning] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const isCompleted = ayuda?.status === "COMPLETED";

  const confirmArchiveEvent = async () => {
    if (!isAdmin || !ayuda) return;
    setIsArchiving(true);
    try {
      await updateDoc(doc(db, "ayudas", ayudaId), { status: "COMPLETED" });
      setArchiveModalOpen(false);
      await refresh();
    } catch (err) {
      console.error("Archive failed:", err);
      alert("Error archiving event. Check console.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleReopenEvent = async () => {
    if (!isAdmin || !ayuda) return;
    if (!window.confirm("Reopen this archived event? It will become active again and appear on the Active Programs dashboard.")) return;
    setIsArchiving(true);
    try {
      await updateDoc(doc(db, "ayudas", ayudaId), { status: "ONGOING" });
      await refresh();
    } catch (err) {
      console.error("Reopen failed:", err);
      alert("Error reopening event. Check console.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCloneEvent = async () => {
    if (!isAdmin || !ayuda) return;
    if (!window.confirm("This will create a new Ayuda event and copy all currently APPROVED beneficiaries over. Claims will be reset to 0. Proceed?")) return;
    
    setIsCloning(true);
    try {
      // 1. Create the new Ayuda document
      const newAyudaData = {
        title: `${ayuda.title} - Iteration`,
        description: ayuda.description || "",
        amount: Number(ayuda.amount || 0),
        programType: ayuda.programType || "ONE_TIME",
        requiredDays: ayuda.requiredDays || null,
        aidKind: ayuda.aidKind || null,
        address: ayuda.address || "",
        barangay: ayuda.barangay || "",
        city: ayuda.city || "",
        requirements: ayuda.requirements || "",
        schedule: "",
        timeStart: "",
        timeEnd: "",
        applicants: [],
        beneficiaries: [...(ayuda.beneficiaries || [])],
        status: "ONGOING"
      };

      const newAyudaRef = await addDoc(collection(db, "ayudas"), newAyudaData);
      const newId = newAyudaRef.id;

      // 2. Batch update users to add the new Ayuda ID to their ayudas_beneficiary array
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const b of beneficiaries) {
        const userRef = doc(db, "users", b.uid);
        batch.update(userRef, {
          ayudas_beneficiary: arrayUnion(newId)
        });
        batchCount++;
        
        // Firestore batch has a limit of 500 operations
        if (batchCount === 450) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }

      // Archive the current (old) event
      await updateDoc(doc(db, "ayudas", ayudaId), { status: "COMPLETED" });

      alert("Event successfully cloned and the previous iteration has been archived! Redirecting to the new event...");
      navigate(`/admin/ayuda/${newId}`);
    } catch (err) {
      console.error("Clone failed:", err);
      alert("Error cloning event. Check console.");
    } finally {
      setIsCloning(false);
    }
  };

  if (loading) {
    return <div className="page-content" style={{ padding: "2rem" }}><p className="settings-text">Loading command center...</p></div>;
  }

  if (!ayuda) {
    return (
      <div className="page-content" style={{ padding: "2rem" }}>
        <p className="settings-text">Ayuda not found.</p>
        <button className="action-btn" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const programType = (ayuda.programType || "ONE_TIME").toUpperCase();
  const isService = programType === "SERVICE";
  const requiredDays = Math.max(1, Number(ayuda.requiredDays || 1));

  let chartData = [];
  if (isService) {
    let completedCount = 0;
    let inProgressCount = 0;
    beneficiaries.forEach(b => {
       const claim = claimsMap[b.uid];
       if (claim?.completed || (claim?.attendance?.length >= requiredDays)) completedCount++;
       else inProgressCount++;
    });
    chartData = [
       { name: "Hit Quota", value: completedCount, fill: COLORS.CLAIMED },
       { name: "In Progress", value: inProgressCount, fill: COLORS.ACTIVE }
    ];
  } else {
    let claimedCount = 0;
    let unclaimedCount = 0;
    beneficiaries.forEach(b => {
       const claim = claimsMap[b.uid];
       if (claim) claimedCount++;
       else unclaimedCount++;
    });
    chartData = [
       { name: "Claimed", value: claimedCount, fill: COLORS.CLAIMED },
       { name: "Pending", value: unclaimedCount, fill: COLORS.PENDING }
    ];
  }

  const hasChartData = chartData.some(d => d.value > 0);

  return (
    <div className="ayuda-detail-command-center">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <Link to={isAdmin ? "/admin/CurrentAyuda" : "/staff/CurrentAyuda"} className="action-btn">
            <ArrowLeft size={16} /> Back to List
          </Link>
          
          {isAdmin && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button 
                type="button" 
                className="action-btn" 
                style={{ background: "var(--accent-gradient)", color: "white", border: "none" }}
                onClick={handleCloneEvent}
                disabled={isCloning}
              >
                {isCloning ? "Cloning..." : "Start Next Iteration"}
              </button>
              {!isCompleted && (
                <button
                  type="button"
                  className="action-btn"
                  style={{ borderColor: "#94a3b8", color: "#94a3b8" }}
                  onClick={() => setArchiveModalOpen(true)}
                  disabled={isArchiving}
                >
                  <Archive size={14} />
                  {isArchiving ? "Archiving..." : "Archive Event"}
                </button>
              )}
              {isCompleted && (
                <button
                  type="button"
                  className="action-btn"
                  style={{ borderColor: "#38bdf8", color: "#38bdf8" }}
                  onClick={handleReopenEvent}
                  disabled={isArchiving}
                >
                  <RotateCcw size={14} />
                  {isArchiving ? "Reopening..." : "Reopen Event"}
                </button>
              )}
            </div>
          )}
        </div>

        {isCompleted && (
          <div className="archived-banner">
            <Lock size={18} />
            <div>
              <strong>Archived Event — Read Only</strong>
              <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>This Ayuda has been completed and archived. No further modifications are permitted.</p>
            </div>
          </div>
        )}

        <h1 className="auth-title" style={{ textAlign: "left", marginBottom: "0.25rem", marginTop: 0 }}>Command Center</h1>
        <p className="settings-text">Manage operations and monitor analytics for {ayuda.title}.</p>
      </div>

      {/* Top Section */}
      <div className="ayuda-detail-top-grid">
        <div className="base-card ayuda-info-card">
          <div className="ayuda-info-header">
            <h2>{ayuda.title}</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className={`pill-badge ${isService ? "" : "green"}`}>{programType}</span>
              {isCompleted && <span className="pill-badge archived-badge">ARCHIVED</span>}
            </div>
          </div>
          <p className="settings-text" style={{ marginBottom: "1.5rem" }}>{ayuda.description}</p>
          
          <div className="ayuda-info-metrics">
            <div className="metric-row">
              <PhilippinePeso size={18} className="metric-icon" />
              <span><strong>Payout:</strong> ₱{Number(ayuda.amount || 0).toLocaleString()}</span>
            </div>
            {isService && (
              <div className="metric-row">
                <Calendar size={18} className="metric-icon" />
                <span><strong>Required Days:</strong> {requiredDays}</span>
              </div>
            )}
            <div className="metric-row">
              <MapPin size={18} className="metric-icon" />
              <span><strong>Location:</strong> {ayuda.barangay}, {ayuda.city}</span>
            </div>
          </div>
        </div>

        <div className="base-card ayuda-chart-card">
          <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Analytics Overview</h3>
          {!hasChartData ? (
             <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
               <p className="settings-text">No data to display yet.</p>
             </div>
          ) : (
             <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<RatioTooltip />} />
                  <Legend content={<RatioLegend />} />
                </PieChart>
              </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Middle Section: Applicants — hidden if archived and empty */}
      {!(isCompleted && applicants.length === 0) && (
      <div className="data-table-container">
        <div className="table-header-block">
          <h3>Applicants <span>({applicants.length})</span></h3>
          <p>Pending citizens awaiting approval.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID (Citizen Code)</th>
              <th>Name</th>
              <th>Status</th>
              {!isCompleted && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {applicants.length === 0 ? (
              <tr><td colSpan={isCompleted ? 3 : 4} style={{ textAlign: "center", padding: "2rem" }}>No pending applicants.</td></tr>
            ) : (
              applicants.map(a => (
                <tr key={a.uid}>
                  <td style={{ fontFamily: "monospace" }}>{a.profile?.citizenCode || a.uid.slice(0,8)}</td>
                  <td style={{ fontWeight: 500 }}>{a.displayName}</td>
                  <td><span className="pill-badge" style={{ background: "rgba(71,85,105,0.2)", color: "var(--text-secondary)" }}>PENDING</span></td>
                  {!isCompleted && (
                  <td>
                    {isStaffOrAdmin && (
                      <div className="table-actions">
                        <button className="action-btn" style={{ borderColor: COLORS.CLAIMED, color: COLORS.CLAIMED }} onClick={() => approveApplicant(a.uid)} title="Approve">
                          <Check size={16} /> Accept
                        </button>
                        <button className="action-btn" style={{ borderColor: "#ef4444", color: "#ef4444" }} onClick={() => rejectApplicant(a.uid)} title="Reject">
                          <X size={16} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Bottom Section: Beneficiaries */}
      <div className="data-table-container">
        <div className="table-header-block">
          <h3>{isService ? "Active Workers" : "Beneficiaries"} <span>({beneficiaries.length})</span></h3>
          <p>Approved citizens enrolled in this event.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID (Citizen Code)</th>
              <th>Name</th>
              <th>Status</th>
              <th>{isService ? "Quota" : "Claimed Date"}</th>
              {isAdmin && !isCompleted && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {beneficiaries.length === 0 ? (
              <tr><td colSpan={(isAdmin && !isCompleted) ? 5 : 4} style={{ textAlign: "center", padding: "2rem" }}>No approved beneficiaries yet.</td></tr>
            ) : (
              beneficiaries.map(b => {
                const claim = claimsMap[b.uid];
                let statusText = "APPROVED";
                let quotaText = "Unclaimed";
                
                if (isService) {
                  const attendedDays = claim?.attendance?.length || 0;
                  const finished = claim?.completed || (attendedDays >= requiredDays);
                  statusText = finished ? "FINISHED" : "ACTIVE";
                  quotaText = `${attendedDays} / ${requiredDays}`;
                } else {
                  if (claim) {
                    statusText = "CLAIMED";
                    // Try to format claimed date if exists, else just "Claimed"
                    if (claim.timestamp?.toDate) {
                       quotaText = claim.timestamp.toDate().toLocaleDateString();
                    } else if (claim.timestamp) {
                       quotaText = new Date(claim.timestamp).toLocaleDateString();
                    } else {
                       quotaText = "Claimed";
                    }
                  }
                }

                return (
                  <tr key={b.uid}>
                    <td style={{ fontFamily: "monospace" }}>{b.profile?.citizenCode || b.uid.slice(0,8)}</td>
                    <td style={{ fontWeight: 500 }}>{b.displayName}</td>
                    <td>
                      <span className={`pill-badge ${statusText === "FINISHED" || statusText === "CLAIMED" ? "green" : ""}`}>
                        {statusText}
                      </span>
                    </td>
                    <td>{quotaText}</td>
                    {isAdmin && !isCompleted && (
                      <td>
                        <div className="table-actions">
                          <button className="action-btn" onClick={() => removeBeneficiary(b.uid)} title="Move back to applicants">
                            <Undo2 size={16} /> Revert
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Archive Confirmation Modal */}
      {archiveModalOpen && (
        <div className="modal-overlay modal-overlay--padded">
          <div className="base-card modal-panel" style={{ textAlign: "center", padding: "2.5rem", maxWidth: "440px" }}>
            <div style={{ marginBottom: "1rem", color: "#94a3b8" }}>
              <Archive size={36} />
            </div>
            <h2 className="auth-title" style={{ marginBottom: "1rem" }}>Archive This Event?</h2>
            <p className="settings-text" style={{ marginBottom: "1.5rem", fontSize: "1rem", lineHeight: 1.5 }}>
              Are you sure you want to archive this event? This will <strong>lock the event as read-only</strong> and move it to the Completed tab.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                type="button"
                className="auth-button"
                style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                onClick={() => setArchiveModalOpen(false)}
                disabled={isArchiving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="auth-button"
                style={{ background: "#94a3b8" }}
                onClick={confirmArchiveEvent}
                disabled={isArchiving}
              >
                {isArchiving ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
