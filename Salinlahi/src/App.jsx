import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminLayout from './layouts/AdminLayout';
import AdminHome from './pages/AdminHome';
import AdminScanner from './pages/AdminScan';
import AdminCreateAyuda from './pages/AdminCreateAyuda';
import AdminCurrentAyuda from './pages/AdminCurrentAyuda';
import Settings from './pages/Settings';
import UserLayout from './layouts/UserLayout';
import UserHome from './pages/UserHome';
import UserCurrentAyuda from './pages/UserCurrentAyuda';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserHome />} />
        <Route path="currentayuda" element={<UserCurrentAyuda />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="AdminHome" element={<AdminHome />} />
        <Route path="CreateAyuda" element={<AdminCreateAyuda />} />
        <Route path="scan" element={<AdminScanner />} />
        <Route path="CurrentAyuda" element={<AdminCurrentAyuda />} />
        <Route path="Settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
