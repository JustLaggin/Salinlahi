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

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>User Dashboard</h2>

      <p>Your Unique QR Code</p>

      {uuid && (
        <div style={{ background: "white", padding: "20px", display: "inline-block" }}>
          <QRCode value={uuid} size={200} />
        </div>
      )}

      <p style={{ marginTop: "20px" }}>
        UUID: {uuid}
      </p>
    </div>
  );
}

export default UserDashboard;
