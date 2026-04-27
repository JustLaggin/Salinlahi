import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Package, Users, CheckCircle, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CLAIMED_COLOR = "#34d399";
const PENDING_COLOR = "#475569";

function RatioTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div
      className="dashboard-chart-tooltip"
      style={{ transform: "translate(-50%, calc(-100% - 12px))", pointerEvents: "none" }}
    >
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

const formatTime = (time24) => {
  if (!time24) return "";
  const [hour, min] = time24.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedH = h % 12 || 12;
  return `${formattedH}:${min} ${ampm}`;
};

/**
 * @param {{ ayudaId: string, readOnly?: boolean, onDataChange?: () => void, embedded?: boolean }} props
 */
export default function AyudaDetailContent({
  ayudaId,
  readOnly = false,
  onDataChange,
  embedded = false,
}) {
  const [ayuda, setAyuda] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [claimRatio, setClaimRatio] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const { isAdmin } = useAuth();
  const backLink = isAdmin ? "/admin/events" : "/staff/events";

  const refresh = useCallback(async () => {
    if (!ayudaId) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "ayudas", ayudaId));
      if (!snap.exists()) {
        setAyuda(null);
        setApplicants([]);
        setLoading(false);
        return;
      }
      const data = { id: snap.id, ...snap.data() };
      setAyuda(data);
      const list = data.applicants || [];
      const beneficiaryList = data.beneficiaries || [];
      const objs = [];
      for (const applicantId of list) {
        try {
          const u = await getDoc(doc(db, "users", applicantId));
          let displayName = applicantId;
          if (u.exists()) {
            const ud = u.data();
            displayName =
              `${ud.first_name || ""} ${ud.last_name || ""}`.trim() ||
              applicantId;
          }
          objs.push({ uid: applicantId, displayName, profile: u.exists() ? u.data() : null });
        } catch {
          objs.push({ uid: applicantId, displayName: applicantId, profile: null });
        }
      }
      setApplicants(objs);
      const bObjs = [];
      for (const beneficiaryId of beneficiaryList) {
        try {
          const u = await getDoc(doc(db, "users", beneficiaryId));
          let displayName = beneficiaryId;
          if (u.exists()) {
            const ud = u.data();
            displayName =
              `${ud.first_name || ""} ${ud.last_name || ""}`.trim() ||
              beneficiaryId;
          }
          bObjs.push({ uid: beneficiaryId, displayName, profile: u.exists() ? u.data() : null });
        } catch {
          bObjs.push({ uid: beneficiaryId, displayName: beneficiaryId, profile: null });
        }
      }
      setBeneficiaries(bObjs);

      const claimsSnap = await getDocs(collection(db, "ayudas", ayudaId, "claims"));
      const claims = claimsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const programType = (data.programType || "ONE_TIME").toUpperCase();
      if (programType === "ONE_TIME") {
        const claimed = claims.length;
        const totalExpected = Math.max(
          claimed,
          Number((data.beneficiaries || []).length || 0)
        );
        const unclaimed = Math.max(0, totalExpected - claimed);
        setClaimRatio([
          { name: "Claimed", value: claimed, fill: CLAIMED_COLOR },
          { name: "Unclaimed", value: unclaimed, fill: PENDING_COLOR },
        ]);
        setWorkers([]);
      } else {
        const workerRows = claims.map((claim) => ({
          id: claim.id,
          name: claim.displayName || claim.id,
          attended: (claim.attendance || []).length,
          required: Math.max(1, Number(claim.requiredDays || data.requiredDays || 1)),
          completed: !!claim.completed,
        }));
        setWorkers(workerRows);
        setClaimRatio([]);
      }
    } catch (e) {
      console.error(e);
      setAyuda(null);
    }
    setLoading(false);
  }, [ayudaId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approveApplicant = async (applicantUid) => {
    if (!ayuda || readOnly) return;
    const ayudaRef = doc(db, "ayudas", ayuda.id);
    await updateDoc(ayudaRef, {
      applicants: arrayRemove(applicantUid),
      beneficiaries: arrayUnion(applicantUid),
    });
    try {
      await updateDoc(doc(db, "users", applicantUid), {
        ayudas_applied: arrayRemove(ayuda.id),
        ayudas_beneficiary: arrayUnion(ayuda.id),
      });
    } catch (err) {
      console.error(err);
    }
    setApplicants((prev) => prev.filter((a) => a.uid !== applicantUid));
    onDataChange?.();
    await refresh();
  };

  const rejectApplicant = async (applicantUid) => {
    if (!ayuda || readOnly) return;
    const ayudaRef = doc(db, "ayudas", ayuda.id);
    await updateDoc(ayudaRef, {
      applicants: arrayRemove(applicantUid),
    });
    try {
      await updateDoc(doc(db, "users", applicantUid), {
        ayudas_applied: arrayRemove(ayuda.id),
      });
    } catch (err) {
      console.error(err);
    }
    setApplicants((prev) => prev.filter((a) => a.uid !== applicantUid));
    onDataChange?.();
    await refresh();
  };

  if (loading) {
    return (
      <div className="base-card ayuda-detail-card">
        <p className="settings-text">Loading…</p>
      </div>
    );
  }

  if (!ayuda) {
    return (
      <div className="base-card ayuda-detail-card">
        <p className="settings-text">Ayuda not found.</p>
        {!embedded && (
          <Link to={backLink} className="auth-link">
            Back to list
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="base-card ayuda-detail-card">
      {!embedded && (
        <Link
          to={backLink}
          className="auth-link"
          style={{ display: "inline-block", marginBottom: "1rem" }}
        >
          ← Back to Active Ayuda
        </Link>
      )}
      <h1 className="auth-title" style={{ textAlign: "left", marginBottom: "0.5rem" }}>
        {ayuda.title}
      </h1>
      <p className="settings-text" style={{ marginBottom: "1.5rem" }}>
        {ayuda.description}
      </p>

      <div className="ayuda-detail-meta">
        <div className="ayuda-detail-meta__item">
          <Calendar size={18} />
          <span>
            {ayuda.schedule || "TBA"}
            {ayuda.timeStart && ayuda.timeEnd
              ? ` · ${formatTime(ayuda.timeStart)}–${formatTime(ayuda.timeEnd)}`
              : ""}
          </span>
        </div>
        <div className="ayuda-detail-meta__item">
          <MapPin size={18} />
          <span>
            {ayuda.address || "—"} · {ayuda.barangay}, {ayuda.city}
          </span>
        </div>
        <div className="ayuda-detail-meta__item">
          <Package size={18} />
          <span>₱{Number(ayuda.amount || 0).toLocaleString()}</span>
        </div>
        <div className="ayuda-detail-meta__item">
          <Package size={18} />
          <span>
            {(ayuda.programType || "ONE_TIME") === "SERVICE"
              ? `SERVICE · ${Math.max(1, Number(ayuda.requiredDays || 1))} day(s)`
              : `ONE_TIME · ${(ayuda.aidKind || "RELIEF_GOODS").replaceAll("_", " ")}`}
          </span>
        </div>
        <div className="ayuda-detail-meta__item">
          <Users size={18} />
          <span>Applicants: {applicants.length}</span>
        </div>
        <div className="ayuda-detail-meta__item">
          <CheckCircle size={18} />
          <span>Beneficiaries: {(ayuda.beneficiaries || []).length}</span>
        </div>
      </div>

      <h2 className="auth-title" style={{ fontSize: "1.1rem", margin: "1.75rem 0 1rem" }}>
        Applicants
      </h2>
      {readOnly && (
        <p className="settings-text" style={{ marginBottom: "1rem" }}>
          You can view applicants but cannot accept or reject them on this account.
        </p>
      )}
      {applicants.length === 0 ? (
        <p className="settings-text">No pending applicants.</p>
      ) : (
        <ul className="ayuda-detail-applicants">
          {applicants.map((a) => (
            <li key={a.uid} className="ayuda-detail-applicant-row">
              <button
                type="button"
                className="linklike-btn"
                onClick={() => setSelectedUser(a)}
              >
                {a.displayName}
              </button>
              {!readOnly && (
                <div className="row-buttons">
                  <button
                    type="button"
                    className="approve-btn"
                    onClick={() => void approveApplicant(a.uid)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="reject-btn"
                    onClick={() => void rejectApplicant(a.uid)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="auth-title" style={{ fontSize: "1.1rem", margin: "1.75rem 0 1rem" }}>
        Beneficiaries
      </h2>
      {beneficiaries.length === 0 ? (
        <p className="settings-text">No approved beneficiaries yet.</p>
      ) : (
        <ul className="ayuda-detail-applicants">
          {beneficiaries.map((b) => (
            <li key={b.uid} className="ayuda-detail-applicant-row">
              <button
                type="button"
                className="linklike-btn"
                onClick={() => setSelectedUser(b)}
              >
                {b.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {(ayuda.programType || "ONE_TIME") === "ONE_TIME" && (
        <>
          <h2 className="auth-title" style={{ fontSize: "1.1rem", margin: "1.75rem 0 1rem" }}>
            Claimed vs Unclaimed
          </h2>
          {claimRatio.length === 0 || claimRatio.every((d) => d.value === 0) ? (
            <p className="settings-text">No claim data available yet for this ayuda.</p>
          ) : (
            <div className="dashboard-chart-card" style={{ marginBottom: "0.5rem" }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart
                  onMouseMove={(state) => {
                    if (
                      typeof state?.chartX === "number" &&
                      typeof state?.chartY === "number"
                    ) {
                      setTooltipPosition({ x: state.chartX, y: state.chartY });
                    }
                  }}
                  onMouseLeave={() => setTooltipPosition(null)}
                >
                  <Pie
                    data={claimRatio}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {claimRatio.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<RatioTooltip />}
                    cursor={false}
                    position={tooltipPosition || undefined}
                    offset={12}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ pointerEvents: "none", zIndex: 10000 }}
                    isAnimationActive={false}
                  />
                  <Legend content={<RatioLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {(ayuda.programType || "ONE_TIME") === "SERVICE" && (
        <>
          <h2 className="auth-title" style={{ fontSize: "1.1rem", margin: "1.75rem 0 1rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <Briefcase size={18} /> Active Workers
            </span>
          </h2>
          {workers.length === 0 ? (
            <p className="settings-text">No active workers yet.</p>
          ) : (
            <div className="dashboard-tupad-list">
              {workers.map((w) => {
                const pct = Math.min(100, Math.round((w.attended / w.required) * 100));
                return (
                  <div key={w.id} className="dashboard-tupad-row">
                    <div className="dashboard-tupad-info">
                      <span className="dashboard-tupad-name">{w.name}</span>
                      <span className="dashboard-tupad-meta">
                        {w.attended}/{w.required} days
                        {w.completed && <span className="dashboard-tupad-done"> ✓ Done</span>}
                      </span>
                    </div>
                    <div className="dashboard-progress-track">
                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: w.completed ? CLAIMED_COLOR : "var(--accent-blue)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {selectedUser && createPortal(
        <div className="modal-overlay modal-overlay--padded modal-overlay--scroll-follow">
          <div className="base-card modal-panel">
            <h2 className="auth-title">User Information</h2>
            <div className="modal-inset-panel" style={{ textAlign: "left" }}>
              <p><strong>Name:</strong> {selectedUser.displayName}</p>
              <p><strong>UID:</strong> {selectedUser.uid}</p>
              <p><strong>Email:</strong> {selectedUser.profile?.email || "N/A"}</p>
              <p><strong>Citizen Code:</strong> {selectedUser.profile?.citizenCode || "N/A"}</p>
              <p><strong>Phone:</strong> {selectedUser.profile?.phone || selectedUser.profile?.contact_number || "N/A"}</p>
              <p><strong>Birthday:</strong> {selectedUser.profile?.birth_date || "N/A"}</p>
              <p><strong>Address:</strong> {selectedUser.profile?.address || "N/A"}</p>
              <p><strong>Barangay:</strong> {selectedUser.profile?.barangay || "N/A"}</p>
              <p><strong>City:</strong> {selectedUser.profile?.city || "N/A"}</p>
            </div>
            <button
              type="button"
              className="auth-button close-btn"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
