import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useEffect, useState } from 'react';

function UserLayout() {
  const [userName, setUserName] = useState('Resident');

  useEffect(() => {
    // Get user name from localStorage or Firebase
    const name = localStorage.getItem('userName') || 'Resident';
    setUserName(name);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar role="user" />

      {/* Main Content Area */}
      <div className="app-content-wrapper">
        {/* Header */}
        <Header userName={userName} userRole="Resident" />

        {/* Page Content */}
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default UserLayout;
