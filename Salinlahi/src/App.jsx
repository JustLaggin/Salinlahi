import { Routes, Route, Link, Navigate } from "react-router-dom";
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
{/* import ApplyAyuda from "./pages/ApplyAyuda";
import CurrentAyuda from "./pages/CurrentAyuda";*/}

function App() {
  return (
    <div>
      {/* Top Banner */}
      <div style={styles.banner}>
        <img src={logo} style= {styles.image} />
      </div>

      {/* Page Content */}
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/register" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user" element={<UserLayout/>}>
            <Route path="/user/UserHome" element={<UserHome />} />
            <Route path="/user/Settings" element={<Settings />} />*
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
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "center",
    zIndex: 1000
  },

  image: {
    maxWidth: "200px",
    height: "auto"
  },

  
};

export default App;