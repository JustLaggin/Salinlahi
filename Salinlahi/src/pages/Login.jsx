import { useState } from "react";
import { auth } from "../firebase";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { normalizeCitizenCodeInput } from "../utils/citizenCode";

function normalizeRole(raw) {
  if (raw === "admin" || raw === "staff" || raw === "citizen") return raw;
  if (raw === "user") return "citizen";
  return "citizen";
}

function Login() {
  const [citizenCode, setCitizenCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(true);
  const [mode, setMode] = useState("citizen");
  const navigate = useNavigate();
  const { firebaseUser, role, loading: authLoading, loginCitizenByCode } = useAuth();

  if (!authLoading && firebaseUser && role) {
    let redirectPath = "/user";
    if (role === "admin") redirectPath = "/admin/AdminHome";
    if (role === "staff") redirectPath = "/staff/StaffHome";
    return <Navigate to={redirectPath} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      if (mode === "citizen") {
        const normalizedCode = normalizeCitizenCodeInput(citizenCode);
        if (!normalizedCode) {
          alert("Citizen code is required.");
          return;
        }
        await loginCitizenByCode(normalizedCode);
        navigate("/user");
        return;
      }

      if (!email || !password) {
        alert("Email and password are required for staff/admin login.");
        return;
      }

      await setPersistence(
        auth,
        autoLogin ? browserLocalPersistence : browserSessionPersistence
      );
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const r = normalizeRole(docSnap.data().role);

        if (r === "admin") {
          navigate("/admin/AdminHome");
        } else if (r === "staff") {
          navigate("/staff/StaffHome");
        } else {
          alert("This account is not staff/admin.");
        }
      } else {
        alert("No user record found.");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="app-container">
      <form onSubmit={handleLogin} className="base-card auth-form">
        <h2 className="auth-title">Login</h2>

        <div className="button-group" style={{ marginTop: 0 }}>
          <button
            type="button"
            className={`admin-btn ${mode === "citizen" ? "" : "btn-neutral-gradient"}`}
            onClick={() => setMode("citizen")}
          >
            Citizen Login
          </button>
          <button
            type="button"
            className={`admin-btn ${mode === "staffAdmin" ? "" : "btn-neutral-gradient"}`}
            onClick={() => setMode("staffAdmin")}
          >
            Staff/Admin Login
          </button>
        </div>

        {mode === "citizen" ? (
          <div className="input-row">
            <input
              className="input-field"
              type="text"
              placeholder="Citizen Code"
              value={citizenCode}
              onChange={(e) => setCitizenCode(e.target.value)}
              required
            />
          </div>
        ) : (
          <>
            <div className="input-row">
              <input
                className="input-field"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-row">
              <input
                className="input-field"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
          }}
        >
          <input
            type="checkbox"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
          />
          Auto login on this device
        </label>

        <button type="submit" className="auth-button">
          Login
        </button>

        {mode === "staffAdmin" && (
          <p className="settings-text" style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
          </p>
        )}

      </form>
    </div>
  );
}

export default Login;
