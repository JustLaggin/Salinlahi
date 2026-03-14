import { Link, Outlet } from "react-router-dom";
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

  if (loading) return <div className="app-container"><div className="base-card"><h2 className="auth-title">Loading...</h2></div></div>;
  return ( 
    <div className="app-container qr-container">
      <div className="base-card">
        <h2 className="auth-title">Your QR</h2>
        <p className="settings-text">Show this QR to Barangay staff for instant verification</p>
        

        {uuid && (
          <div className="qr-box" style={{padding: '2rem', background: 'white', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center'}}>
            <QRCode value={uuid} size={260} />
          </div>
        )}

        
        
      </div>
    </div> 
  );
}

export default UserHome;
