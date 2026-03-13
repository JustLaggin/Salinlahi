import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

function UserTracker() {
  const [uuid, setUuid] = useState("");
  const [claimedAyudas, setClaimedAyudas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }

      const userUuid = userSnap.data().uuid;
      setUuid(userUuid);

      const ayudasSnapshot = await getDocs(collection(db, "ayudas"));
      const list = ayudasSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => Array.isArray(a.beneficiaries) && a.beneficiaries.includes(userUuid));

      setClaimedAyudas(list);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="page-root page-scroll">
      <div className="stack-md">
        <header className="base-card card card--compact">
          <h2 className="soft-white-glow" style={{ margin: 0 }}>
            Claim History
          </h2>
          <p className="text-muted" style={{ margin: 0 }}>
            Ayuda events that have been claimed using your QR.
          </p>
        </header>

        <main className="stack-md">
          {claimedAyudas.length === 0 && (
            <div className="base-card card card--compact">
              <p className="text-muted" style={{ margin: 0 }}>
                You have not claimed any ayuda yet.
              </p>
            </div>
          )}

          {claimedAyudas.map((ayuda) => (
            <div
              key={ayuda.id}
              className="base-card card card--compact"
            >
              <div className="stack-sm">
                <h3
                  className="soft-white-glow"
                  style={{ margin: 0, fontSize: "1.05rem" }}
                >
                  {ayuda.title}
                </h3>
                <p className="text-muted" style={{ margin: 0 }}>
                  {ayuda.barangay}, {ayuda.city}
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem" }}>
                  ₱{ayuda.amount} · {ayuda.schedule || "Schedule not specified"}
                </p>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

export default UserTracker;

