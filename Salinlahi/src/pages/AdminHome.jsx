import { useNavigate } from "react-router-dom";

function AdminHome() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h1 className="auth-title">Admin Dashboard</h1>
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
          <h3 className="auth-title">Current Ayudas</h3>
          <p className="settings-text">Manage active distributions</p>
          <button className="auth-button" onClick={() => navigate("/admin/CurrentAyuda")}>
            View Ayudas
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
