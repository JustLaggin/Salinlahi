import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  PlusSquare,
  List,
  Activity,
  Users,
  Briefcase,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

/* ── colour constants (match CSS vars so Recharts cells are theme-coherent) ── */
const CLAIMED_COLOR = "#34d399"; // --accent-green (dark)
const PENDING_COLOR = "#475569"; // muted slate-blue/gray

/* ── custom tooltip that follows the dark-card aesthetic ── */
function DarkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="dashboard-chart-tooltip">
      <span style={{ color: payload[0].payload.fill, fontWeight: 700 }}>
        {name}
      </span>
      <span style={{ marginLeft: "0.5rem" }}>{value}</span>
    </div>
  );
}

/* ── custom legend rendered beneath the pie ── */
function DarkLegend({ payload }) {
  if (!payload) return null;
  return (
    <div className="dashboard-chart-legend">
      {payload.map((entry, i) => (
        <div key={i} className="dashboard-chart-legend-item">
          <span
            className="dashboard-chart-legend-dot"
            style={{ background: entry.color }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function AdminHome() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  /* ── analytics state (read-only) ── */
  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive] = useState(0);
  const [pieData, setPieData] = useState([]);
  const [tupadWorkers, setTupadWorkers] = useState([]);

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

      /* 2. Total citizens (role === "citizen") */
      const citizenSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "citizen"))
      );
      const totalCitizens = citizenSnap.size;

      /* 3. ONE_TIME events → count claimed docs across all of them */
      const oneTimeAyudas = ongoing.filter(
        (a) => (a.programType || "ONE_TIME") === "ONE_TIME"
      );

      let totalClaimed = 0;
      for (const ayuda of oneTimeAyudas) {
        const claimsSnap = await getDocs(
          collection(db, "ayudas", ayuda.id, "claims")
        );
        totalClaimed += claimsSnap.size;
      }

      const pending = Math.max(0, totalCitizens - totalClaimed);

      setPieData([
        { name: "Claimed", value: totalClaimed, fill: CLAIMED_COLOR },
        { name: "Pending", value: pending, fill: PENDING_COLOR },
      ]);

      /* 4. SERVICE (TUPAD) workers → claims with programType === "SERVICE" */
      const serviceAyudas = ongoing.filter(
        (a) => a.programType === "SERVICE"
      );

      const workers = [];
      for (const ayuda of serviceAyudas) {
        const claimsSnap = await getDocs(
          collection(db, "ayudas", ayuda.id, "claims")
        );
        claimsSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.programType !== "SERVICE") return;
          workers.push({
            id: `${ayuda.id}_${d.id}`,
            name: data.displayName || d.id,
            attended: (data.attendance || []).length,
            required: data.requiredDays || ayuda.requiredDays || 1,
            completed: !!data.completed,
            ayudaTitle: ayuda.title || ayuda.id,
          });
        });
      }
      setTupadWorkers(workers);
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

        {/* — Card 2: Pie Chart — */}
        <div className="dashboard-chart-card" id="chart-claimed-pending">
          <h3 className="dashboard-section-title">
            <Users size={18} style={{ opacity: 0.7 }} />
            ONE_TIME — Claimed vs Pending
          </h3>
          {loading ? (
            <div className="dashboard-chart-placeholder">Loading chart…</div>
          ) : pieData.every((d) => d.value === 0) ? (
            <div className="dashboard-chart-placeholder">
              No ONE_TIME data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  stroke="none"
                  animationDuration={700}
                  animationBegin={100}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend content={<DarkLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* — Card 3: TUPAD Workers Progress — */}
        <div className="dashboard-tupad-card" id="list-tupad-workers">
          <h3 className="dashboard-section-title">
            <Briefcase size={18} style={{ opacity: 0.7 }} />
            Active TUPAD Workers
          </h3>
          {loading ? (
            <p className="settings-text">Loading…</p>
          ) : tupadWorkers.length === 0 ? (
            <p className="settings-text">No active SERVICE workers yet.</p>
          ) : (
            <div className="dashboard-tupad-list">
              {tupadWorkers.map((w) => {
                const pct = Math.min(
                  100,
                  Math.round((w.attended / w.required) * 100)
                );
                return (
                  <div key={w.id} className="dashboard-tupad-row">
                    <div className="dashboard-tupad-info">
                      <span className="dashboard-tupad-name">{w.name}</span>
                      <span className="dashboard-tupad-meta">
                        {w.ayudaTitle} · {w.attended}/{w.required} days
                        {w.completed && (
                          <span className="dashboard-tupad-done"> ✓ Done</span>
                        )}
                      </span>
                    </div>
                    <div className="dashboard-progress-track">
                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: w.completed
                            ? CLAIMED_COLOR
                            : "var(--accent-blue)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
