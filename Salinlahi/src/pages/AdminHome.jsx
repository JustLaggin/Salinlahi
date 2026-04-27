import { useNavigate } from 'react-router-dom';
import { QrCode, Plus, List, BarChart3, Users, Package } from 'lucide-react';
import '../css/dashboard.css';

function AdminHome() {
  const navigate = useNavigate();

  // Dashboard statistics (mock data - replace with real data from Firebase)
  const stats = [
    { label: 'Active Ayudas', value: '12', icon: Package, color: 'blue' },
    { label: 'Total Beneficiaries', value: '1,234', icon: Users, color: 'green' },
    { label: 'Claims Processed', value: '856', icon: BarChart3, color: 'purple' },
  ];

  const quickActions = [
    {
      title: 'Scan QR Code',
      description: 'Verify and process beneficiary claims',
      icon: QrCode,
      path: '/admin/scan',
      color: 'blue'
    },
    {
      title: 'Create New Ayuda',
      description: 'Launch a new aid distribution program',
      icon: Plus,
      path: '/admin/CreateAyuda',
      color: 'green'
    },
    {
      title: 'View All Ayudas',
      description: 'Manage and monitor active distributions',
      icon: List,
      path: '/admin/CurrentAyuda',
      color: 'purple'
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Administrator Dashboard</h1>
          <p className="text-secondary">Manage aid distribution programs and beneficiaries</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`stat-card stat-card-${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                className={`action-card action-card-${action.color}`}
                onClick={() => navigate(action.path)}
              >
                <div className="action-icon">
                  <Icon size={32} />
                </div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
                <span className="action-arrow">→</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity (placeholder for future data) */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          <button className="btn btn-ghost btn-sm">View All</button>
        </div>
        <div className="card">
          <div className="empty-state">
            <BarChart3 size={48} />
            <h3>No recent activity</h3>
            <p className="text-secondary">Activity logs will appear here as beneficiaries claim aid</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
