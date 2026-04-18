import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "react-qr-code";

function UserLayout() {
  return (
    <div className="app-container">
      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <Link to="/user" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link to="/user/currentayuda" className="nav-item">
          <span className="nav-icon">📋</span>
          <span className="nav-label">My Ayuda</span>
        </Link>
        <Link to="/user/settings" className="nav-item">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default UserLayout;
