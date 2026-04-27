import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Package, Users, CheckCircle, RefreshCw, AlertCircle, MapPin, CalendarDays, ClipboardList, Search } from 'lucide-react';
import '../css/user-dashboard.css';

function UserCurrentAyuda() {
  const [userAyudas, setUserAyudas] = useState({
    applied: [],
    beneficiary: [],
    received: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedCardId, setFocusedCardId] = useState(null);

  const fetchUserAyudas = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const applied = data.ayudas_applied || [];
        const beneficiary = data.ayudas_beneficiary || [];
        const received = data.ayudas_received || [];
        
        const allIds = Array.from(new Set([...applied, ...beneficiary, ...received]));

        // Fetch all unique ayuda details
        const ayudaPromises = allIds.map(async (ayudaId) => {
          const ayudaDoc = await getDoc(doc(db, 'ayudas', ayudaId));
          return {
            id: ayudaId,
            ...(ayudaDoc.exists() ? ayudaDoc.data() : { title: 'Ayuda no longer available' }),
            status: received.includes(ayudaId)
              ? 'received'
              : beneficiary.includes(ayudaId)
              ? 'beneficiary'
              : 'applied'
          };
        });

        const ayundasDetails = await Promise.all(ayudaPromises);

        // Categorize
        const categorized = ayundasDetails.reduce(
          (acc, ayuda) => {
            acc[ayuda.status].push(ayuda);
            return acc;
          },
          { applied: [], beneficiary: [], received: [] }
        );

        setUserAyudas(categorized);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching user ayudas:', err);
      setError('Failed to load ayudas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserAyudas();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserAyudas();
  };

  if (loading) {
    return (
      <div className="user-dashboard-container">
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <p className="text-secondary">Loading your ayuda history...</p>
        </div>
      </div>
    );
  }

  const Section = ({ title, icon: Icon, items, status, color }) => {
    const filteredItems = items.filter((ayuda) =>
      (ayuda.title || '').toLowerCase().includes(searchTerm)
    );
    const layoutMode =
      filteredItems.length <= 1 ? 'hero' : filteredItems.length <= 3 ? 'stacked' : 'list';

    return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <Icon size={24} />
          </div>
          <div>
            <h2 className="card-title">{title}</h2>
            <p className="card-subtitle">{filteredItems.length} program(s)</p>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-list">
          <Icon size={48} />
          <h3>No matching {title.toLowerCase()}</h3>
          <p className="text-secondary">Try a different keyword</p>
        </div>
      ) : (
        <div className={`ayuda-mobile-stack ayuda-mobile-stack-${layoutMode}`}>
          {filteredItems.map((ayuda, index) => {
            const badgeTone =
              status === 'applied' ? 'warning' : status === 'beneficiary' ? 'success' : 'info';

            return (
            <div
              key={ayuda.id}
              className={`ayuda-item ${focusedCardId === ayuda.id ? 'is-focused' : ''}`}
              data-focused={focusedCardId && focusedCardId !== ayuda.id ? 'dim' : 'normal'}
              style={{ '--card-index': index }}
              onMouseEnter={() => setFocusedCardId(ayuda.id)}
              onMouseLeave={() => setFocusedCardId(null)}
              onTouchStart={() => setFocusedCardId(ayuda.id)}
              onTouchEnd={() => setFocusedCardId(null)}
            >
              {/* Primary row: title + status for fast scanning */}
              <div className="ayuda-primary-row">
                <div className="ayuda-title-wrap">
                  <h3 className="ayuda-title">{ayuda.title || 'Untitled Program'}</h3>
                  <p className="ayuda-subtext">{ayuda.description || 'No description provided'}</p>
                </div>
                <span className={`badge badge-${badgeTone}`}>
                  {status === 'applied' && 'Pending'}
                  {status === 'beneficiary' && 'Approved'}
                  {status === 'received' && 'Received'}
                </span>
              </div>

              {/* Secondary row: structured details in aligned columns */}
              <div className="ayuda-secondary-row">
                <div className="ayuda-meta-chip">
                  <ClipboardList size={14} />
                  <span className="ayuda-meta-label">Program ID</span>
                  <span className="ayuda-meta-value ayuda-meta-mono">{ayuda.id}</span>
                </div>
                {ayuda.amount && (
                  <div className="ayuda-meta-chip">
                    <span className="ayuda-meta-label">Amount</span>
                    <span className="ayuda-meta-value ayuda-meta-mono">₱{ayuda.amount.toLocaleString()}</span>
                  </div>
                )}
                {ayuda.city && (
                  <div className="ayuda-meta-chip">
                    <MapPin size={14} />
                    <span className="ayuda-meta-label">Location</span>
                    <span className="ayuda-meta-value">
                      {ayuda.barangay}, {ayuda.city}
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata row: lower emphasis timestamps/details */}
              <div className="ayuda-meta-row">
                {ayuda.schedule && (
                  <div className="ayuda-meta-inline">
                    <CalendarDays size={14} />
                    <span className="ayuda-meta-inline-label">Schedule</span>
                    <span className="ayuda-meta-inline-value">
                      {new Date(ayuda.schedule).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {ayuda.requirements && (
                <div className="ayuda-requirements">
                  <p className="ayuda-requirements-label">Requirements</p>
                  <p className="ayuda-requirements-text">{ayuda.requirements}</p>
                </div>
              )}

              <div className="ayuda-touch-hint">Tap to view details</div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
  };

  return (
    <div className="user-dashboard-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Ayuda History</h1>
          <p className="text-secondary">Track your applications, approvals, and received benefits</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={18} style={{ opacity: refreshing ? 0.5 : 1 }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="search-command-wrap">
        <div className="search-command-shell">
          <Search size={18} />
          <input
            className="input-field search-command-input"
            type="text"
            placeholder="Search ayuda programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>
            <div className="alert-title">Error</div>
            <div className="alert-message">{error}</div>
          </div>
        </div>
      )}

      {/* Applied Section */}
      <Section
        title="Applications"
        icon={Package}
        items={userAyudas.applied}
        status="applied"
        color="#F59E0B"
      />

      {/* Approved Section */}
      <Section
        title="Approved Programs"
        icon={Users}
        items={userAyudas.beneficiary}
        status="beneficiary"
        color="#10B981"
      />

      {/* Received Section */}
      <Section
        title="Received Benefits"
        icon={CheckCircle}
        items={userAyudas.received}
        status="received"
        color="#059669"
      />
    </div>
  );
}

export default UserCurrentAyuda;

