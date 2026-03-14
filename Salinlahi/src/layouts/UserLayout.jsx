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
        <Link to="/user" className="nav-item">🏠</Link>
        <Link to="/user/currentayuda" className="nav-item">📋</Link>
        <Link to="/user/settings" className="nav-item">⚙️</Link>
      </nav>
    </div>
  );
}

export default UserLayout;
