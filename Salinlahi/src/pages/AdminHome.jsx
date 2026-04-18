import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import LoadingSpinner from "../components/LoadingSpinner";

function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAyudas: 0,
    ongoingAyudas: 0,
    completedAyudas: 0,
    totalApplicants: 0,
    totalBeneficiaries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "ayudas"));
        const ayudas = snapshot.docs.map(doc => doc.data());
        
        const totalAyudas = ayudas.length;
        const ongoingAyudas = ayudas.filter(a => a.status === 'ONGOING').length;
        const completedAyudas = ayudas.filter(a => a.status === 'COMPLETED').length;
        const totalApplicants = ayudas.reduce((sum, a) => sum + (a.applicants?.length || 0), 0);
        const totalBeneficiaries = ayudas.reduce((sum, a) => sum + (a.beneficiaries?.length || 0), 0);
        
        setStats({
          totalAyudas,
          ongoingAyudas,
          completedAyudas,
          totalApplicants,
          totalBeneficiaries
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="app-container">
      <h1 className="auth-title">Admin Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="base-card stat-card">
          <div className="stat-number">{stats.totalAyudas}</div>
          <div className="stat-label">Total Ayudas</div>
        </div>
        
        <div className="base-card stat-card">
          <div className="stat-number">{stats.ongoingAyudas}</div>
          <div className="stat-label">Ongoing</div>
        </div>
        
        <div className="base-card stat-card">
          <div className="stat-number">{stats.completedAyudas}</div>
          <div className="stat-label">Completed</div>
        </div>
        
        <div className="base-card stat-card">
          <div className="stat-number">{stats.totalApplicants}</div>
          <div className="stat-label">Total Applicants</div>
        </div>
        
        <div className="base-card stat-card">
          <div className="stat-number">{stats.totalBeneficiaries}</div>
          <div className="stat-label">Total Beneficiaries</div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="admin-grid">
        <div className="base-card">
          <h3 className="auth-title">Scan QR</h3>
          <p className="settings-text">Verify beneficiary and process claim</p>
          <button className="auth-button" onClick={() => navigate("/admin/scan")}>
            Scan QR
          </button>
        </div>

        <div className="base-card">
          <h3 className="auth-title">Create Ayuda</h3>
          <p className="settings-text">Launch new aid distribution program</p>
          <button className="auth-button" onClick={() => navigate("/admin/CreateAyuda")}>
            Create Ayuda
          </button>
        </div>

        <div className="base-card">
          <h3 className="auth-title">Manage Ayudas</h3>
          <p className="settings-text">View and manage all aid distributions</p>
          <button className="auth-button" onClick={() => navigate("/admin/CurrentAyuda")}>
            Manage Ayudas
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
