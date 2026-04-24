import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Package, Users, CheckCircle, RefreshCw, MapPin, Calendar, PhilippinePeso } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function mightBeAyudaId(s) {
  return typeof s === "string" && /^[A-Za-z0-9]{15,}$/.test(s);
}

function isLegacyDateEntry(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function UserCurrentAyuda() {
  const { firebaseUser } = useAuth();
  const [userAyudas, setUserAyudas] = useState({
    applied: [],
    beneficiary: [],
    received: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);
  const [selectedAyuda, setSelectedAyuda] = useState(null);

  const stats = [
    {
      key: "applied",
      label: "Applied",
      count: userAyudas.applied.length,
      icon: Package,
      tone: "amber",
    },
    {
      key: "beneficiary",
      label: "Approved",
      count: userAyudas.beneficiary.length,
      icon: Users,
      tone: "green",
    },
    {
      key: "received",
      label: "Received",
      count: userAyudas.received.length,
      icon: CheckCircle,
      tone: "blue",
    },
  ];

  useEffect(() => {
    const fetchUserAyudas = async () => {
      const user = firebaseUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const appliedIds = [...(data.ayudas_applied || [])];
          const beneficiaryIds = [...(data.ayudas_beneficiary || [])];
          const claimHistory = data.claim_history || [];
          const legacyReceived = data.ayudas_received || [];

          const receivedFromClaims = new Set(
            claimHistory.map((c) => c?.ayudaId).filter(Boolean)
          );

          for (const entry of legacyReceived) {
            if (isLegacyDateEntry(entry)) continue;
            if (mightBeAyudaId(entry)) receivedFromClaims.add(entry);
          }

          const beneficiaryActive = beneficiaryIds.filter(
            (id) => !receivedFromClaims.has(id)
          );
          const appliedActive = appliedIds.filter(
            (id) => !receivedFromClaims.has(id) && !beneficiaryIds.includes(id)
          );

          const allIds = Array.from(
            new Set([
              ...appliedActive,
              ...beneficiaryActive,
              ...receivedFromClaims,
            ])
          );

          const ayudaPromises = allIds.map(async (ayudaId) => {
            const ayudaDoc = await getDoc(doc(db, "ayudas", ayudaId));
            const base = ayudaDoc.exists()
              ? ayudaDoc.data()
              : { title: "Ayuda no longer available" };
            let status = "applied";
            if (receivedFromClaims.has(ayudaId)) status = "received";
            else if (beneficiaryIds.includes(ayudaId)) status = "beneficiary";

            let serviceProgress = null;
            if ((base.programType || "ONE_TIME") === "SERVICE") {
              try {
                const claimSnap = await getDoc(doc(db, "ayudas", ayudaId, "claims", user.uid));
                if (claimSnap.exists()) {
                  const claim = claimSnap.data();
                  serviceProgress = { attended: (claim.attendance || []).length, required: Math.max(1, Number(claim.requiredDays || base.requiredDays || 1)) };
                } else {
                  serviceProgress = { attended: 0, required: Math.max(1, Number(base.requiredDays || 1)) };
                }
              } catch (e) {
                // ignore
              }
            }

            return {
              id: ayudaId,
              ...base,
              status,
              serviceProgress
            };
          });

          const ayundasDetails = await Promise.all(ayudaPromises);

          const categorized = ayundasDetails.reduce(
            (acc, ayuda) => {
              acc[ayuda.status].push(ayuda);
              return acc;
            },
            { applied: [], beneficiary: [], received: [] }
          );

          setUserAyudas(categorized);
        }
      } catch (err) {
        console.error("Error fetching user ayundas:", err);
        setError("Failed to load ayundas. Check console.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAyudas();
  }, [refreshKey, firebaseUser]);

  if (loading) {
    return (
      <div className="app-container">
        <div className="base-card">
          <h2 className="auth-title">Loading Ayudas…</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="base-card">
          <h2 className="auth-title">Error</h2>
          <p className="settings-text">{error}</p>
          <button
            type="button"
            className="approve-btn"
            onClick={() => {
              setError(null);
              setRefreshKey((k) => k + 1);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const openAyudaDetails = async (ayuda) => {
    let serviceProgress = null;
    if ((ayuda.programType || "ONE_TIME") === "SERVICE" && firebaseUser?.uid) {
      try {
        const claimSnap = await getDoc(doc(db, "ayudas", ayuda.id, "claims", firebaseUser.uid));
        if (claimSnap.exists()) {
          const claim = claimSnap.data();
          const attended = (claim.attendance || []).length;
          const required = Math.max(1, Number(claim.requiredDays || ayuda.requiredDays || 1));
          serviceProgress = { attended, required };
        } else {
          serviceProgress = { attended: 0, required: Math.max(1, Number(ayuda.requiredDays || 1)) };
        }
      } catch (err) {
        console.error(err);
      }
    } else if (ayuda.serviceProgress) {
      serviceProgress = ayuda.serviceProgress;
    }
    setSelectedAyuda({ ...ayuda, serviceProgress });
  };

  /** Mobile-first Ayuda card */
  const AyudaCard = ({ ayuda, tone, statusLabel }) => {
    const isService = (ayuda.programType || "ONE_TIME") === "SERVICE";
    const progress = ayuda.serviceProgress;
    const progressPct = progress ? Math.min(100, Math.round((progress.attended / progress.required) * 100)) : 0;

    return (
      <div className="ayuda-list-card">
        {/* Top row: Title + Badge */}
        <div className="ayuda-list-card__top">
          <h3 className="ayuda-list-card__title">{ayuda.title || "Untitled Ayuda"}</h3>
          <span className={`pill-badge user-ayuda-badge--${tone}`}>{statusLabel}</span>
        </div>

        {/* SERVICE progress bar */}
        {isService && progress && (
          <div className="ayuda-list-card__progress-wrap">
            <div className="ayuda-list-card__progress-bar">
              <div
                className="ayuda-list-card__progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="ayuda-list-card__progress-label">
              {progress.attended} / {progress.required} Days
              {progressPct >= 100 && " ✅"}
            </span>
          </div>
        )}

        {/* Middle details */}
        <div className="ayuda-list-card__details">
          {ayuda.amount != null && (
            <div className="ayuda-list-card__detail-row">
              <PhilippinePeso size={14} className="ayuda-list-card__detail-icon" />
              <span>₱{Number(ayuda.amount).toLocaleString()}</span>
            </div>
          )}
          <div className="ayuda-list-card__detail-row">
            <Calendar size={14} className="ayuda-list-card__detail-icon" />
            <span>{ayuda.schedule || "Schedule TBA"}</span>
          </div>
          <div className="ayuda-list-card__detail-row">
            <MapPin size={14} className="ayuda-list-card__detail-icon" />
            <span>
              {[ayuda.barangay, ayuda.city].filter(Boolean).join(", ") || "Location TBA"}
            </span>
          </div>
          {isService && (
            <div className="ayuda-list-card__detail-row">
              <span className="pill-badge" style={{ fontSize: "0.7rem", marginRight: 0 }}>SERVICE</span>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <button
          type="button"
          className="ayuda-list-card__action-btn"
          onClick={() => void openAyudaDetails(ayuda)}
        >
          View Full Details
        </button>
      </div>
    );
  };

  const Section = ({ title, items, tone }) => (
    <section className="base-card user-ayuda-section">
      <div className="user-ayuda-section__header">
        <div>
          <h2 className="user-ayuda-section__title">{title}</h2>
          <p className="settings-text">{items.length} total records</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="settings-text user-ayuda-empty">
          No {title.toLowerCase()} yet
        </p>
      ) : (
        <div className="ayuda-list-card-grid">
          {items.map((ayuda) => (
            <AyudaCard key={ayuda.id} ayuda={ayuda} tone={tone} statusLabel={title} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="app-container user-ayuda-page" style={{ paddingBottom: "120px" }}>
      <div className="base-card user-ayuda-hero">
        <h1 className="auth-title">My Ayuda History</h1>
        <p className="settings-text">
          Track your applications, approvals, and received benefits
        </p>
        <div className="user-ayuda-stats">
          {stats.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div key={stat.key} className="user-ayuda-stat-card">
                <div className={`user-ayuda-icon user-ayuda-icon--${stat.tone}`}>
                  <StatIcon size={18} />
                </div>
                <div>
                  <p className="user-ayuda-stat-card__label">{stat.label}</p>
                  <p className="user-ayuda-stat-card__value">{stat.count}</p>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="action-btn user-ayuda-refresh-btn"
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          <RefreshCw size={16} />
          Refresh data
        </button>
      </div>

      <Section
        title="Applied"
        items={userAyudas.applied}
        tone="amber"
      />

      <Section
        title="Approved (Beneficiary)"
        items={userAyudas.beneficiary}
        tone="green"
      />

      <Section
        title="Received"
        items={userAyudas.received}
        tone="blue"
      />
      {selectedAyuda && (
        <div className="modal-overlay modal-overlay--padded">
          <div className="base-card modal-panel">
            <h2 className="auth-title">{selectedAyuda.title || "Ayuda Details"}</h2>
            <div className="modal-inset-panel" style={{ textAlign: "left" }}>
              <p><strong>Description:</strong> {selectedAyuda.description || "No description available"}</p>
              <p><strong>Program Type:</strong> {selectedAyuda.programType || "ONE_TIME"}</p>
              <p><strong>Amount:</strong> {selectedAyuda.amount ? `₱${selectedAyuda.amount}` : "Amount TBD"}</p>
              <p><strong>Schedule:</strong> {selectedAyuda.schedule || "TBA"}</p>
              <p><strong>Location:</strong> {selectedAyuda.address || "N/A"}, {selectedAyuda.barangay || "N/A"}, {selectedAyuda.city || "N/A"}</p>
              {selectedAyuda.requirements && (
                <p><strong>Requirements:</strong> {selectedAyuda.requirements}</p>
              )}
              {(selectedAyuda.programType || "ONE_TIME") === "SERVICE" && (
                <p>
                  <strong>Service Progress:</strong>{" "}
                  {selectedAyuda.serviceProgress
                    ? `${selectedAyuda.serviceProgress.attended}/${selectedAyuda.serviceProgress.required} days served`
                    : `0/${Math.max(1, Number(selectedAyuda.requiredDays || 1))} days served`}
                </p>
              )}
            </div>
            <button
              type="button"
              className="auth-button close-btn"
              onClick={() => setSelectedAyuda(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserCurrentAyuda;
