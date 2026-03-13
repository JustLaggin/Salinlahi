import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import QRCode from "react-qr-code";

function UserHome() {
  const [uuid, setUuid] = useState("");
  const [ayudas, setAyudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAyuda, setSelectedAyuda] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Get user UUID
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }

      const userUuid = userSnap.data().uuid;
      setUuid(userUuid);

      // Get ayudas
      const ayudasSnapshot = await getDocs(collection(db, "ayudas"));
      const ayudaList = ayudasSnapshot.docs.map((d) => {
        const data = d.data();
        const beneficiaries = data.beneficiaries || [];
        const isClaimed = beneficiaries.includes(userUuid);
        return {
          id: d.id,
          ...data,
          isClaimed,
        };
      });

      setAyudas(ayudaList);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  const handleCardClick = (ayuda) => {
    if (ayuda.isClaimed) return;
    setSelectedAyuda(ayuda);
  };

  const closeModal = () => setSelectedAyuda(null);

  return (
    <div className="page-root page-scroll">
      <div className="stack-md">
        <header className="base-card card card--compact">
          <h2 className="soft-white-glow" style={{ margin: 0 }}>
            Available Ayudas
          </h2>
          <p className="text-muted" style={{ margin: 0 }}>
            Tap an available ayuda to view details and show your QR.
          </p>
        </header>

        <main className="stack-md">
          {ayudas.length === 0 && (
            <div className="base-card card card--compact">
              <p className="text-muted" style={{ margin: 0 }}>
                No ayudas are currently available. Please check again later.
              </p>
            </div>
          )}

          {ayudas.map((ayuda) => (
            <div
              key={ayuda.id}
              className={`base-card card card--compact ${
                ayuda.isClaimed ? "card--muted" : "card--clickable"
              }`}
              onClick={() => handleCardClick(ayuda)}
            >
              <div className="stack-sm">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <h3
                    className="soft-white-glow"
                    style={{ margin: 0, fontSize: "1.1rem" }}
                  >
                    {ayuda.title}
                  </h3>
                  <span
                    className={`status-pill ${
                      ayuda.isClaimed
                        ? "status-pill--claimed"
                        : "status-pill--available"
                    }`}
                  >
                    {ayuda.isClaimed ? "Claimed" : "Available"}
                  </span>
                </div>

                <p className="text-muted" style={{ margin: 0 }}>
                  {ayuda.barangay}, {ayuda.city}
                </p>

                <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem" }}>
                  ₱{ayuda.amount} ·{" "}
                  {ayuda.schedule || "Schedule not specified"}
                </p>
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Detail + QR modal */}
      {selectedAyuda && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
          }}
        >
          <div
            className="base-card card card--wide"
            style={{
              width: "90%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2
              className="soft-white-glow"
              style={{ marginTop: 0, marginBottom: "0.5rem" }}
            >
              {selectedAyuda.title}
            </h2>
            <p className="text-muted" style={{ marginTop: 0 }}>
              {selectedAyuda.barangay}, {selectedAyuda.city}
            </p>

            <p style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
              <span className="text-label">Amount</span> ₱{selectedAyuda.amount}
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
              <span className="text-label">Schedule</span>{" "}
              {selectedAyuda.schedule || "Not specified"}
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
              <span className="text-label">Claiming Area</span>{" "}
              {selectedAyuda.address || "Not specified"}
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
              <span className="text-label">Requirements</span>{" "}
              {selectedAyuda.requirements || "None"}
            </p>

            <p className="text-muted" style={{ marginTop: "1rem" }}>
              Present this QR to Barangay Staff to claim this ayuda.
            </p>

            {uuid && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    padding: "16px",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.5)",
                  }}
                >
                  <QRCode
                    value={uuid}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>
            )}

            <p className="text-label" style={{ marginBottom: "0.25rem" }}>
              Your UUID
            </p>
            <p className="text-mono" style={{ wordBreak: "break-all" }}>
              {uuid}
            </p>

            <button
              className="btn btn-ghost btn--full"
              style={{ marginTop: "14px" }}
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserHome;