import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import logo from "./assets/Logo_Black.png";
import { ThemeToggle } from "./components/ThemeToggle";
import AdminLayout from "./layouts/AdminLayout";
import AdminScanner from "./pages/AdminScan";
import AdminCreateAyuda from "./pages/AdminCreateAyuda";
import AdminCurrentAyuda from "./pages/AdminCurrentAyuda";
import AdminAyudaDetail from "./pages/AdminAyudaDetail";
import AdminHome from "./pages/AdminHome";
import { ProtectedRoute, RequireAdmin } from "./components/ProtectedRoute";
import UserLayout from "./layouts/UserLayout";
import UserHome from "./pages/UserHome";
import ForgotPassword from "./pages/ForgotPassword";
import UserCurrentAyuda from "./pages/UserCurrentAyuda";

function App() {
  return (
    <div>
      <header className="header-banner">
        <img src={logo} className="header-banner__logo" alt="Salinlahi Logo" />
        <ThemeToggle />
      </header>

      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserHome />} />
            <Route path="currentayuda" element={<UserCurrentAyuda />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="AdminHome" replace />} />
            <Route path="AdminHome" element={<AdminHome />} />
            <Route
              path="CreateAyuda"
              element={
                <RequireAdmin>
                  <AdminCreateAyuda />
                </RequireAdmin>
              }
            />
            <Route path="scan" element={<AdminScanner />} />
            <Route path="CurrentAyuda" element={<AdminCurrentAyuda />} />
            <Route path="ayuda/:ayudaId" element={<AdminAyudaDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
