import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Package, Users, CheckCircle } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

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
          objs.push({ uid: applicantId, displayName });
        } catch {
          objs.push({ uid: applicantId, displayName: applicantId });
        }
      }
      setApplicants(objs);
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
          <Link to="/admin/CurrentAyuda" className="auth-link">
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
          to="/admin/CurrentAyuda"
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
          Read-only (staff). Kapitan approves or rejects applicants here.
        </p>
      )}
      {applicants.length === 0 ? (
        <p className="settings-text">No pending applicants.</p>
      ) : (
        <ul className="ayuda-detail-applicants">
          {applicants.map((a) => (
            <li key={a.uid} className="ayuda-detail-applicant-row">
              <span>{a.displayName}</span>
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
    </div>
  );
}
