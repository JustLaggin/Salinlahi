import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useEffect, useState } from 'react';

function AdminLayout() {
  const [adminName, setAdminName] = useState('Administrator');

  useEffect(() => {
    // Get admin name from localStorage or Firebase
    const name = localStorage.getItem('userName') || 'Administrator';
    setAdminName(name);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar role="admin" />

      {/* Main Content Area */}
      <div className="app-content-wrapper">
        {/* Header */}
        <Header userName={adminName} userRole="Administrator" />

        {/* Page Content */}
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
