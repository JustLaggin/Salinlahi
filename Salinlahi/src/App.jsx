import { Routes, Route, Link, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import logo from "./assets/Logo_Black.png";
import AdminLayout from "./layouts/AdminLayout";
import AdminScanner from "./pages/AdminScan";
import AdminCreateAyuda from "./pages/AdminCreateAyuda";
import AdminCurrentAyuda from "./pages/AdminCurrentAyuda";
import AdminHome from "./pages/AdminHome";
import Settings from "./pages/Settings";
import UserLayout from "./layouts/UserLayout";
import UserHome from "./pages/UserHome";
import ForgotPassword from "./pages/ForgotPassword";
import UserCurrentAyuda from "./pages/UserCurrentAyuda";
import EditProfile from "./pages/EditProfile";

function App() {
  return (
    <div>
      {/* Top Banner */}
      <header className="header-banner">
        <Link to="/" style={{textDecoration: 'none'}}>
          <img src={logo} style={{maxWidth: '200px', height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.3))'}} alt="Salinlahi Logo" />
        </Link>
      </header>

      {/* Page Content */}
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/register" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/user" element={<UserLayout/>}>
            <Route index element={<UserHome />} />
            <Route path="currentayuda" element={<UserCurrentAyuda />} />
            <Route path="settings" element={<Settings />} />
            <Route path="edit-profile" element={<EditProfile />} />
          </Route>
          <Route path="/admin" element={<AdminLayout/>}>
            <Route path="/admin/AdminHome" element={<AdminHome />} />
            <Route path="/admin/CreateAyuda" element={<AdminCreateAyuda />} />
            <Route path="/admin/scan" element={<AdminScanner />} />
            <Route path="/admin/CurrentAyuda" element={<AdminCurrentAyuda />} />
            <Route path="/admin/Settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;
