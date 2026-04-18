import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoadingScreen() {
  return (
    <div className="app-container">
      <div className="base-card">
        <h2 className="auth-title">Loading…</h2>
        <p className="settings-text">Checking your session</p>
      </div>
    </div>
  );
}

/** @param {{ children: React.ReactNode, allowedRoles: string[] }} props */
export function ProtectedRoute({ children, allowedRoles }) {
  const { firebaseUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!role || !allowedRoles.includes(role)) {
    if (role === "citizen") return <Navigate to="/user" replace />;
    if (role === "staff" || role === "admin")
      return <Navigate to="/admin/AdminHome" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role !== "admin") return <Navigate to="/admin/AdminHome" replace />;
  return children;
}
