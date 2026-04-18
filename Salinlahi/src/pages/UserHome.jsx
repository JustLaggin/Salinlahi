import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "react-qr-code";
import { Download, QrCode } from "lucide-react";

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

  const downloadQR = () => {
    const svg = document.getElementById("citizen-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40; // padding
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "Salinlahi_Offline_QR.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) return <div className="app-container"><div className="base-card"><h2 className="auth-title">Loading...</h2></div></div>;

  return (
    <div className="app-container qr-container" style={{maxWidth: '600px', margin: '0 auto', textAlign: 'center'}}>
      <div className="base-card" style={{alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center'}}>
          <QrCode size={28} color="var(--accent-blue)" />
          <h2 className="auth-title" style={{marginBottom: 0}}>Your Identity Pass</h2>
        </div>
        <p className="settings-text">Scan this QR code offline with Barangay staff for instant Ayuda verification without data connection.</p>
        
        {uuid && (
          <div className="qr-box qr-surface" style={{margin: '1.5rem 0'}}>
            <QRCode id="citizen-qr" value={uuid} size={280} />
          </div>
        )}

        <button className="auth-button" onClick={downloadQR} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
          <Download size={20} />
          Save Offline QR
        </button>
      </div>
    </div>
  );
}

export default UserHome;
