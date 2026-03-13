function AdminHome() {
  return (
     <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.text}>Scan a QR code to verify and claim ayuda.</p>
        <button
          style={styles.button}
          onClick={() => navigate("/scan")}
        >
          Scan QR
        </button>
      </div>

      <div style={styles.card}>
        <p style={styles.text}>Create a new ayuda for distribution.</p>
        <button
          style={styles.button}
          onClick={() => navigate("/create-ayuda")}
        >
          Create Ayuda
        </button>
      </div>

      <div style={styles.card}>
        <p style={styles.text}>View the currently active ayudas.</p>
        <button
          style={styles.button}
          onClick={() => navigate("/current-ayudas")}
        >
          View Ayudas
        </button>
      </div>
    </div>
  );
}  

const styles = {
    container: {
      height: "flex",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "30px",
      flexWrap: "wrap",
    },

    card: {
      width: "220px",
      padding: "20px",
      borderRadius: "12px",
      background: "white",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      textAlign: "center",
    },

    text: {
      marginBottom: "15px",
      fontSize: "14px",
    },

    button: {
      width: "100%",
      padding: "10px",
      border: "none",
      background: "#2b7cff",
      color: "white",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
    },
  };
export default AdminHome;