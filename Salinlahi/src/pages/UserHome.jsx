import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import { User, Download, AlertCircle } from 'lucide-react';
import '../css/user-dashboard.css';

function UserHome() {
  const [uuid, setUuid] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUuid(data.uuid);
          setUserData(data);
        } else {
          setError('User profile not found');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const downloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `my-qr-code-${uuid}.png`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="user-dashboard-container">
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <p className="text-secondary">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Welcome{userData?.first_name ? `, ${userData.first_name}` : ''}!</h1>
          <p className="text-secondary">Your personalized assistance dashboard</p>
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

      {/* User Profile Card */}
      {userData && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your Profile</h2>
          </div>
          <div className="profile-grid">
            <div className="profile-item">
              <span className="profile-label">Full Name</span>
              <p className="profile-value">
                {userData.first_name} {userData.middle_name} {userData.last_name}
              </p>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email</span>
              <p className="profile-value">{userData.email}</p>
            </div>
            <div className="profile-item">
              <span className="profile-label">Contact</span>
              <p className="profile-value">{userData.contact_number}</p>
            </div>
            <div className="profile-item">
              <span className="profile-label">Address</span>
              <p className="profile-value">
                {userData.address_line}, {userData.barangay}<br />
                {userData.city}, {userData.province}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Card */}
      {uuid && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your Verification QR Code</h2>
            <p className="card-subtitle">Use this for instant verification at distribution centers</p>
          </div>

          <div className="qr-section">
            <div className="qr-box">
              <QRCode 
                value={uuid} 
                size={280}
                level="H"
                includeMargin={true}
                backgroundColor="#FFFFFF"
                fgColor="#1E293B"
              />
            </div>

            <div className="qr-info">
              <div className="info-section">
                <h3>How to use your QR Code</h3>
                <ol className="info-list">
                  <li>Visit any authorized distribution center</li>
                  <li>Show this QR code to the staff</li>
                  <li>Your information will be verified instantly</li>
                  <li>Receive your assistance</li>
                </ol>
              </div>

              <button 
                className="btn btn-primary btn-full"
                onClick={downloadQR}
              >
                <Download size={20} />
                Download QR Code
              </button>

              <div className="qr-reminder">
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                  Keep this QR code safe. It uniquely identifies you in our system. Do not share with others.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <p className="stat-label">Ayudas Applied</p>
          <p className="stat-value">{userData?.ayudas_applied?.length || 0}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="stat-label">Approved</p>
          <p className="stat-value">{userData?.ayudas_beneficiary?.length || 0}</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="stat-label">Received</p>
          <p className="stat-value">{userData?.ayudas_received?.length || 0}</p>
        </div>
      </div>
    </div>
  );
}

export default UserHome;
