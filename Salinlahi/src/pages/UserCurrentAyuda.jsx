import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Package, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

function UserCurrentAyuda() {
  const [userAyudas, setUserAyudas] = useState({
    applied: [],
    beneficiary: [],
    received: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAyudas = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const allIds = [
            ... (data.ayudas_applied || []),
            ... (data.ayudas_beneficiary || []),
            ... (data.ayudas_received || [])
          ];

          // Fetch all unique ayuda details
          const ayudaPromises = allIds.map(async (ayudaId) => {
            const ayudaDoc = await getDoc(doc(db, "ayudas", ayudaId));
            return { id: ayudaId, ...ayudaDoc.data(), status: ayudaId in (data.ayudas_received || {}) ? 'received' : 
                     ayudaId in (data.ayudas_beneficiary || {}) ? 'beneficiary' : 'applied' };
          });

          const ayundasDetails = await Promise.all(ayudaPromises);
          
          // Categorize
          const categorized = ayundasDetails.reduce((acc, ayuda) => {
            acc[ayuda.status].push(ayuda);
            return acc;
          }, { applied: [], beneficiary: [], received: [] });

          setUserAyudas(categorized);
        }
      } catch (error) {
        console.error("Error fetching user ayundas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAyudas();
  }, []);

  if (loading) {
    return <div className="app-container">
      <div className="base-card">
        <h2 className="auth-title">Loading Ayudas...</h2>
      </div>
    </div>;
  }

  const Section = ({ title, icon: Icon, items, statusColor }) => (
    <div className="base-card">
      <div className="detail-row" style={{marginBottom: '1.5rem'}}>
        <div className="detail-icon" style={{background: statusColor}}>
          <Icon size={24} />
        </div>
        <div className="detail-content">
          <h3 className="auth-title">{title}</h3>
          <p className="settings-text">{items.length} records</p>
        </div>
      </div>
      
      {items.length === 0 ? (
        <p className="settings-text" style={{textAlign: 'center', opacity: 0.7}}>
          No {title.toLowerCase()} yet
        </p>
      ) : (
        items.map((ayuda) => (
          <div key={ayuda.id} className="base-card" style={{padding: '1.5rem', marginBottom: '1rem'}}>
            <h4 style={{color: 'var(--color-text-main)', marginBottom: '0.5rem'}}>{ayuda.title || 'Untitled Ayuda'}</h4>
            <div className="detail-row">
              <span style={{color: 'var(--color-text-muted)', fontSize: '0.95rem'}}>
                {ayuda.description || 'No description'} • {ayuda.amount ? `₱${ayuda.amount}` : 'Amount TBD'}
              </span>
            </div>
            <div className="detail-row">
              <span style={{color: 'var(--color-text-accent)', fontSize: '0.9rem'}}>
                {ayuda.barangay}, {ayuda.schedule || 'TBA'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="app-container">
      <div className="search-container">
        <h1 className="auth-title">My Ayuda History</h1>
        <p className="settings-text">Track your applications, approvals, and received benefits</p>
      </div>

      <Section 
        title="Applied" 
        icon={Package}
        items={userAyudas.applied}
        statusColor="rgba(245,158,11,0.2)"
      />
      
      <Section 
        title="Approved (Beneficiary)" 
        icon={Users}
        items={userAyudas.beneficiary}
        statusColor="rgba(34,197,94,0.2)"
      />

      <Section 
        title="Received" 
        icon={CheckCircle}
        items={userAyudas.received}
        statusColor="rgba(34,197,94,0.3)"
      />
    </div>
  );
}

export default UserCurrentAyuda;

