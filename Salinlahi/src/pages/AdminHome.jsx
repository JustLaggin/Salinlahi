import { useNavigate } from "react-router-dom";

function AdminHome() {
  const navigate = useNavigate();

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.grid}>
        <button
          className="base-card"
          style={styles.card}
          onClick={() => navigate("/admin/scan")}
        >
          <h3 className="soft-white-glow" style={styles.cardTitle}>
            Scan QR
          </h3>
          <p style={styles.cardText}>
            Verify and claim ayuda quickly using QR scanning.
          </p>
        </button>

        <button
          className="base-card"
          style={styles.card}
          onClick={() => navigate("/admin/CreateAyuda")}
        >
          <h3 className="soft-white-glow" style={styles.cardTitle}>
            Create Ayuda
          </h3>
          <p style={styles.cardText}>
            Set up new ayuda distributions with full details.
          </p>
        </button>

        <button
          className="base-card"
          style={styles.card}
          onClick={() => navigate("/admin/CurrentAyuda")}
        >
          <h3 className="soft-white-glow" style={styles.cardTitle}>
            Current Ayudas
          </h3>
          <p style={styles.cardText}>
            View and manage all active ayuda programs.
          </p>
        </button>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    width: "100%"
  },
  card: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px"
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.1rem"
  },
  cardText: {
    margin: 0,
    color: "var(--color-text-muted)",
    fontSize: "0.9rem"
  }
};

export default AdminHome;