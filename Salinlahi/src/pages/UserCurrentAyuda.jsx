import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Package, Users, CheckCircle, RefreshCw, MapPin } from "lucide-react";

function mightBeAyudaId(s) {
  return typeof s === "string" && /^[A-Za-z0-9]{15,}$/.test(s);
}

function isLegacyDateEntry(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function UserCurrentAyuda() {
  const [userAyudas, setUserAyudas] = useState({
    applied: [],
    beneficiary: [],
    received: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);

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
      const user = auth.currentUser;
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
            return {
              id: ayudaId,
              ...base,
              status,
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
  }, [refreshKey]);

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

  const Section = ({ title, icon: Icon, items, tone }) => (
    <section className="base-card user-ayuda-section">
      <div className="user-ayuda-section__header">
        <div className={`user-ayuda-icon user-ayuda-icon--${tone}`}>
          <Icon size={20} />
        </div>
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
        <div className="data-table-container">
          <table className="data-table user-ayuda-table">
            <thead>
              <tr>
                <th>Ayuda</th>
                <th>Details</th>
                <th>Schedule</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ayuda) => (
                <tr key={ayuda.id}>
                  <td>
                    <div className="data-table__title-block">
                      <div className="data-table__title">
                        {ayuda.title || "Untitled Ayuda"}
                      </div>
                      <span className={`pill-badge user-ayuda-badge--${tone}`}>
                        {title}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="user-ayuda-description">
                      {ayuda.description || "No description available"}
                    </div>
                    <div className="data-table__sub">
                      {ayuda.amount ? `₱${ayuda.amount}` : "Amount TBD"}
                    </div>
                  </td>
                  <td>
                    <div className="data-table__loc-main">
                      {ayuda.schedule || "TBA"}
                    </div>
                  </td>
                  <td>
                    <div className="user-ayuda-location">
                      <MapPin size={14} />
                      <span>{ayuda.barangay || "Barangay TBA"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className="app-container user-ayuda-page">
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
        icon={Package}
        items={userAyudas.applied}
        tone="amber"
      />

      <Section
        title="Approved (Beneficiary)"
        icon={Users}
        items={userAyudas.beneficiary}
        tone="green"
      />

      <Section
        title="Received"
        icon={CheckCircle}
        items={userAyudas.received}
        tone="blue"
      />
    </div>
  );
}

export default UserCurrentAyuda;
