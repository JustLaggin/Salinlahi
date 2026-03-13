import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "react-qr-code";

function UserDashboard() {
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

  if (loading) return <h2 style={{color: "var(--color-text-main)", textAlign: "center", marginTop: "50px"}}>Loading...</h2>;

  return (
    <div style={styles.pageWrapper}>
      <div className="base-card" style={styles.card}>
        <h2 className="soft-white-glow" style={{margin: "0 0 5px 0", fontSize: "1.8rem"}}>User Dashboard</h2>
        <p style={{color: "var(--color-text-muted)", marginBottom: "20px"}}>Your Unique QR Code</p>

        {uuid && (
          <div style={styles.qrWrapper}>
            <QRCode value={uuid} size={200} bgColor="#ffffff" fgColor="#000000" />
          </div>
        )}

        <p style={{ marginTop: "20px", fontSize: "0.9rem", color: "var(--color-text-main)" }}>
          <span style={{color: "var(--color-text-muted)", display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px"}}>UUID</span>
          <br/>
          <span style={{wordBreak: "break-all", fontFamily: "monospace"}}>{uuid}</span>
        </p>
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
    maxWidth: "400px",
    textAlign: "center"
  },
  qrWrapper: {
    background: "#ffffff",
    padding: "16px",
    borderRadius: "16px",
    display: "inline-block",
    boxShadow: "0 10px 30px rgba(15,23,42,0.5)",
  }
};

export default UserDashboard;
