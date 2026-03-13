import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function StaffEvents() {
  const [ayudas, setAyudas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAyudas = async () => {
      const snapshot = await getDocs(collection(db, "ayudas"));
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        const beneficiaries = data.beneficiaries || [];
        return {
          id: d.id,
          ...data,
          beneficiariesCount: beneficiaries.length,
        };
      });
      setAyudas(list);
      setLoading(false);
    };

    fetchAyudas();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="page-root">
      <div className="page-scroll stack-md">
        <header className="base-card card card--compact">
          <h2 className="soft-white-glow" style={{ margin: 0 }}>
            Ayuda Events
          </h2>
          <p className="text-muted" style={{ margin: 0 }}>
            View active ayuda events and total beneficiaries.
          </p>
        </header>

        <main className="grid-auto">
          {ayudas.length === 0 && (
            <div className="base-card card card--compact">
              <p className="text-muted" style={{ margin: 0 }}>
                No ayuda events found.
              </p>
            </div>
          )}

          {ayudas.map((ayuda) => (
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
                <p style={{ margin: "6px 0 0 0", fontSize: "0.85rem" }}>
                  <span className="text-label">Beneficiaries</span>{" "}
                  {ayuda.beneficiariesCount}
                </p>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

export default StaffEvents;

