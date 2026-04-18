import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Package, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

function UserCurrentAyuda() {
  const [userAyudas, setUserAyudas] = useState({
    applied: [],
    beneficiary: [],
    received: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUserAyudas = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const applied = data.ayudas_applied || [];
          const beneficiary = data.ayudas_beneficiary || [];
          const received = data.ayudas_received || [];
          
          console.log('User arrays:', { applied, beneficiary, received }); // DEBUG
          
          const allIds = Array.from(new Set([...applied, ...beneficiary, ...received]));

          // Fetch all unique ayuda details
          const ayudaPromises = allIds.map(async (ayudaId) => {
            const ayudaDoc = await getDoc(doc(db, "ayudas", ayudaId));
            return { 
              id: ayudaId, 
              ...(ayudaDoc.exists() ? ayudaDoc.data() : { title: 'Ayuda no longer available' }),
              status: received.includes(ayudaId) ? 'received' : 
                      beneficiary.includes(ayudaId) ? 'beneficiary' : 'applied'
            };
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
        setError('Failed to load ayundas. Check console.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAyudas();
  }, [refreshKey]);

  if (loading) {
    return <LoadingSpinner message="Loading your ayuda history..." />;
  }

  if (error) {
    return <div className="app-container">
      <div className="base-card">
        <h2 className="auth-title">Error</h2>
        <p className="settings-text">{error}</p>
        <button className="auth-btn" onClick={() => {setError(null); setRefreshKey(k => k+1);}}>
          Retry
        </button>
      </div>
    </div>;
  }

  const Section = ({ title, icon: Icon, items, statusColor }) => {
    const filteredItems = items.filter(item => 
      item.title.toLowerCase().includes(searchTerm)
    );
    
    return (
    <div className="base-card">
      <div className="detail-row" style={{marginBottom: '1.5rem'}}>
        <div className="detail-icon" style={{background: statusColor}}>
          <Icon size={24} />
        </div>
        <div className="detail-content">
          <h3 className="auth-title">{title}</h3>
          <p className="settings-text">{filteredItems.length} records</p>
        </div>
      </div>
      
      {filteredItems.length === 0 ? (
        <p className="settings-text" style={{textAlign: 'center', opacity: 0.7}}>
          {searchTerm ? 'No matches found' : `No ${title.toLowerCase()} yet`}
        </p>
      ) : (
        filteredItems.map((ayuda) => (
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
  };

  return (
    <div className="app-container">
      <div className="search-container">
        <h1 className="auth-title">My Ayuda History</h1>
        <p className="settings-text">Track your applications, approvals, and received benefits</p>
        <input 
          className="input-field" 
          type="text" 
          placeholder="🔍 Search Ayudas by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          style={{marginBottom: '1rem'}}
        />
        <button 
          className="approve-btn"
          onClick={() => setRefreshKey(k => k+1)}
          style={{marginBottom: '2rem'}}
        >
          🔄 Refresh Data
        </button>
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

