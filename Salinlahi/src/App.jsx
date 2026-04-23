import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import logo from "./assets/Logo_Black.png";
import { ThemeToggle } from "./components/ThemeToggle";
import AdminLayout from "./layouts/AdminLayout";
import StaffLayout from "./layouts/StaffLayout";
import AdminScanner from "./pages/AdminScan";
import AdminCreateAyuda from "./pages/AdminCreateAyuda";
import AdminCurrentAyuda from "./pages/AdminCurrentAyuda";
import AdminAyudaDetail from "./pages/AdminAyudaDetail";
import AdminHome from "./pages/AdminHome";
import AdminManageStaff from "./pages/AdminManageStaff";
import AdminManageCitizens from "./pages/AdminManageCitizens";
import { ProtectedRoute, RequireAdmin } from "./components/ProtectedRoute";
import UserLayout from "./layouts/UserLayout";
import UserHome from "./pages/UserHome";
import ForgotPassword from "./pages/ForgotPassword";
import UserCurrentAyuda from "./pages/UserCurrentAyuda";

function App() {
  return (
    <div>
      <header className="header-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src={logo} className="header-banner__logo" alt="Salinlahi Logo" />
          <div id="global-header-title"></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} id="global-header-actions">
          <ThemeToggle />
        </div>
      </header>

      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
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
            <Route index element={<UserCurrentAyuda />} />
            <Route path="currentayuda" element={<UserHome />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
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
            <Route
              path="StaffManagement"
              element={
                <RequireAdmin>
                  <AdminManageStaff />
                </RequireAdmin>
              }
            />
            <Route
              path="ManageCitizens"
              element={
                <RequireAdmin>
                  <AdminManageCitizens />
                </RequireAdmin>
              }
            />
          </Route>

          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="StaffHome" replace />} />
            <Route path="StaffHome" element={<AdminHome />} />
            <Route path="scan" element={<AdminScanner />} />
            <Route path="CurrentAyuda" element={<AdminCurrentAyuda />} />
            <Route path="ayuda/:ayudaId" element={<AdminAyudaDetail />} />
            <Route path="ManageCitizens" element={<AdminManageCitizens />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
