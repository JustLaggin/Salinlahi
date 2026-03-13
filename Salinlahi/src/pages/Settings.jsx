import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={styles.pageWrapper}>

      <div className="base-card" style={styles.card}>
        <div className="soft-white-glow" style={styles.title}>Logout</div>
        <div style={styles.text}>
          Sign out of your account.
        </div>

        <button
          style={styles.logoutButton}
          onClick={logout}
        >
          Logout
        </button>
      </div>

    </div>
  );
}

const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "70vh",
    padding: "20px"
  },

  card: {
    width: "100%",
    maxWidth: "320px",
    textAlign: "center",
    padding: "30px 20px"
  },

  title: {
    fontSize: "1.8rem",
    marginBottom: "10px"
  },

  text: {
    color: "var(--color-text-muted)",
    fontSize: "0.9rem",
    marginBottom: "25px"
  },

  logoutButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626", // Tailwind red-600
    color: "white",
    fontWeight: "bold",
    fontSize: "1.05rem",
    cursor: "pointer",
    transition: "transform 0.1s ease"
  }
};

export default Settings;