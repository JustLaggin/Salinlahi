import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Package, Users, CheckCircle } from "lucide-react";

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

  const Section = ({ title, icon: Icon, items, statusColor }) => (
    <div className="base-card">
      <div className="detail-row" style={{ marginBottom: "1.5rem" }}>
        <div className="detail-icon" style={{ background: statusColor }}>
          <Icon size={24} />
        </div>
        <div className="detail-content">
          <h3 className="auth-title">{title}</h3>
          <p className="settings-text">{items.length} records</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="settings-text" style={{ textAlign: "center", opacity: 0.7 }}>
          No {title.toLowerCase()} yet
        </p>
      ) : (
        items.map((ayuda) => (
          <div
            key={ayuda.id}
            className="base-card"
            style={{ padding: "1.5rem", marginBottom: "1rem" }}
          >
            <h4 style={{ color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
              {ayuda.title || "Untitled Ayuda"}
            </h4>
            <div className="detail-row">
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                {ayuda.description || "No description"} •{" "}
                {ayuda.amount ? `₱${ayuda.amount}` : "Amount TBD"}
              </span>
            </div>
            <div className="detail-row">
              <span style={{ color: "var(--color-text-accent)", fontSize: "0.9rem" }}>
                {ayuda.barangay}, {ayuda.schedule || "TBA"}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="app-container">
      <div className="search-container">
        <h1 className="auth-title">My Ayuda History</h1>
        <p className="settings-text">
          Track your applications, approvals, and received benefits
        </p>
        <button
          type="button"
          className="approve-btn"
          onClick={() => setRefreshKey((k) => k + 1)}
          style={{ marginBottom: "2rem" }}
        >
          Refresh data
        </button>
      </div>

      <Section
        title="Applied"
        icon={Package}
        items={userAyudas.applied}
        statusColor="rgba(245,158,11,0.2)"
      />

      <Section
        title="Approved (Beneficiary)"
        icon={Users}
        items={userAyudas.beneficiary}
        statusColor="rgba(34,197,94,0.2)"
      />

      <Section
        title="Received"
        icon={CheckCircle}
        items={userAyudas.received}
        statusColor="rgba(34,197,94,0.3)"
      />
    </div>
  );
}

export default UserCurrentAyuda;
