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
    <div style={styles.container}>

      {/*<div style={styles.card}>
        <div style={styles.title}>Update Profile</div>
        <div style={styles.text}>
          Change your account information.
        </div>

        <button
          style={styles.button}
          onClick={() => navigate("/update-profile")}
        >
          Update Profile
        </button>
      </div>*/}

      <div style={styles.card}>
        <div style={styles.title}>Logout</div>
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
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "30px",
    flexWrap: "wrap",
    flexDirection: "column",
  },

  card: {
    width: "250px",
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    textAlign: "center"
  },

  title: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px"
  },

  text: {
    fontSize: "14px",
    marginBottom: "15px"
  },

  button: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#2b7cff",
    color: "white",
    cursor: "pointer"
  },

  logoutButton: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer"
  }
};

export default Settings;