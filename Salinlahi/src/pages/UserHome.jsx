import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "react-qr-code";

function UserHome() {
  const [uuid, setUuid] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;

      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUuid(docSnap.data().uuid);
      }

      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={styles.pageWrapper}>
      <div className="base-card" style={styles.card}>
        <h2 className="soft-white-glow" style={styles.title}>
          User Dashboard
        </h2>
        <p style={styles.subtitle}>Your unique Salinlahi identifier</p>

        {uuid && (
          <div style={styles.qrWrapper}>
            <QRCode value={uuid} size={200} bgColor="#ffffff" fgColor="#000000" />
          </div>
        )}

        <p style={styles.uuidLabel}>UUID</p>
        <p style={styles.uuidValue}>{uuid}</p>
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
    maxWidth: "420px",
    textAlign: "center"
  },
  title: {
    marginBottom: "0.25rem",
    fontSize: "1.8rem"
  },
  subtitle: {
    color: "var(--color-text-muted)",
    marginBottom: "1.5rem",
    fontSize: "0.9rem"
  },
  qrWrapper: {
    background: "#ffffff",
    padding: "16px",
    borderRadius: "16px",
    display: "inline-block",
    boxShadow: "0 10px 30px rgba(15,23,42,0.5)",
    marginBottom: "1.5rem"
  },
  uuidLabel: {
    color: "var(--color-text-muted)",
    fontSize: "0.8rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "0.25rem"
  },
  uuidValue: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: "0.9rem",
    color: "var(--color-text-accent)",
    wordBreak: "break-all"
  }
};

export default UserHome;