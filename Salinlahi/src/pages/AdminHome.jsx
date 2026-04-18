import { useNavigate } from "react-router-dom";
import { ScanLine, PlusSquare, List } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function AdminHome() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div>
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
            Select an active Ayuda, then verify beneficiaries and confirm
            claims.
          </p>
          <button
            className="auth-button"
            onClick={() => navigate("/admin/scan")}
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
            onClick={() => navigate("/admin/CurrentAyuda")}
          >
            View Ayudas
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
