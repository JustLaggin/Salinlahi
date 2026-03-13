import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import logo from "./assets/logo.png";
import AdminLayout from "./layouts/AdminLayout";
import AdminScanner from "./pages/AdminScan";
import AdminCreateAyuda from "./pages/AdminCreateAyuda";
import AdminCurrentAyuda from "./pages/AdminCurrentAyuda";
import AdminHome from "./pages/AdminHome";
import Settings from "./pages/Settings";
import UserLayout from "./layouts/UserLayout";
import UserHome from "./pages/UserHome";

function App() {
  return (
    <div>
      {/* 1. Inject the Background Glow globally! */}
      <div className="glow-background">
        <div className="glow-orb glow-blue"></div>
        <div className="glow-orb glow-green"></div>
      </div>

      {/* 2. Top Banner (Updated to Glassmorphism Dark Theme) */}
      <div style={styles.banner}>
        {/* Note: You might need a white version of the logo if the current one is dark text! */}
        <img src={logo} style={styles.image} alt="Salinlahi Logo" />
      </div>

      {/* Page Content */}
      <div style={styles.pageContent}>
        <Routes>
          <Route path="/" element={<Navigate to="/register" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user" element={<UserLayout/>}>
            <Route path="/user/UserHome" element={<UserHome />} />
            <Route path="/user/Settings" element={<Settings />} />
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

const styles = {
  banner: {
    position: "sticky",
    top: 0,
    left: 0,
    width: "100%",
    backgroundColor: "rgba(11, 17, 33, 0.7)", /* Dark transparent blue */
    backdropFilter: "blur(12px)", /* Glass effect */
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    justifyContent: "center",
    padding: "10px 0",
    zIndex: 1000
  },
  image: {
    maxWidth: "150px",
    height: "auto",
  },
  pageContent: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
    paddingBottom: "80px" /* Space for bottom navbar */
  }
};

export default App;