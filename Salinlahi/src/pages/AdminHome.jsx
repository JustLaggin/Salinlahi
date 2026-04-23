import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  PlusSquare,
  List,
  Activity,
} from "lucide-react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function AdminHome() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  /* ── analytics state (read-only) ── */
  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive] = useState(0);

  /* ── fetch analytics from Firestore ── */
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      /* 1. All ONGOING ayudas */
      const ayudaSnap = await getDocs(collection(db, "ayudas"));
      const allAyudas = ayudaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const ongoing = allAyudas.filter(
        (a) => a.status === "ONGOING" || (a.available !== false && !a.status)
      );
      setTotalActive(ongoing.length);

    } catch (err) {
      console.error("Dashboard analytics fetch failed:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1
          className="auth-title"
          style={{ textAlign: "left", marginBottom: "0.5rem" }}
        >
          {isAdmin ? "Admin Dashboard" : "Staff Dashboard"}
        </h1>
        <p className="settings-text" style={{ textAlign: "left" }}>
          Welcome to the Salinlahi Ayuda Management System
        </p>
      </div>

      {/* ── Analytics section ── */}
      <div className="dashboard-analytics-grid">
        {/* — Card 1: Total Active Programs — */}
        <div className="dashboard-stat-card" id="stat-total-active">
          <div className="dashboard-stat-icon dashboard-stat-icon--blue">
            <Activity size={22} />
          </div>
          <div className="dashboard-stat-body">
            <span className="dashboard-stat-label">Total Active Ayuda Programs</span>
            <span className="dashboard-stat-value">
              {loading ? "—" : totalActive}
            </span>
          </div>
        </div>

      </div>

      {/* ── Quick-action cards (preserved from original) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
        }}
      >
        <div className="base-card" style={{ alignItems: "flex-start" }}>
          <ScanLine
            size={36}
            color="var(--accent-blue)"
            style={{ marginBottom: "0.5rem" }}
          />
          <h3 className="auth-title" style={{ textAlign: "left", margin: 0 }}>
            Scan QR
          </h3>
          <p
            className="settings-text"
            style={{ textAlign: "left", marginBottom: "1rem" }}
          >
            Select an active Ayuda and scan a citizen to add them as an applicant.
            After approval in Active Ayuda, scan again to record a pickup claim.
          </p>
          <button
            className="auth-button"
            onClick={() => navigate(isAdmin ? "/admin/scan" : "/staff/scan")}
          >
            Launch Scanner
          </button>
        </div>

        {isAdmin && (
          <div className="base-card" style={{ alignItems: "flex-start" }}>
            <PlusSquare
              size={36}
              color="var(--accent-green)"
              style={{ marginBottom: "0.5rem" }}
            />
            <h3 className="auth-title" style={{ textAlign: "left", margin: 0 }}>
              Create Ayuda
            </h3>
            <p
              className="settings-text"
              style={{ textAlign: "left", marginBottom: "1rem" }}
            >
              Initialize a new localized aid event with target budgets and
              items.
            </p>
            <button
              className="auth-button"
              onClick={() => navigate("/admin/CreateAyuda")}
            >
              Create Distribution
            </button>
          </div>
        )}

        <div className="base-card" style={{ alignItems: "flex-start" }}>
          <List
            size={36}
            color="var(--text-tertiary)"
            style={{ marginBottom: "0.5rem" }}
          />
          <h3 className="auth-title" style={{ textAlign: "left", margin: 0 }}>
            Active Ayudas
          </h3>
          <p
            className="settings-text"
            style={{ textAlign: "left", marginBottom: "1rem" }}
          >
            {isAdmin
              ? "View, update, and manage all active aid distributions."
              : "View ongoing events and choose one for scanning."}
          </p>
          <button
            className="auth-button"
            onClick={() => navigate(isAdmin ? "/admin/CurrentAyuda" : "/staff/CurrentAyuda")}
          >
            View Ayudas
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
