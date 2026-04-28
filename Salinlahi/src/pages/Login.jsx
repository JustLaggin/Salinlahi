import { useState } from "react";
import { createPortal } from "react-dom";
import { auth } from "../firebase";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { normalizeCitizenCodeInput } from "../utils/citizenCode";

function normalizeRole(raw) {
  if (raw === "super_admin" || raw === "admin" || raw === "staff" || raw === "citizen") return raw;
  if (raw === "user") return "citizen";
  return "citizen";
}

function Login() {
  const [citizenCode, setCitizenCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(true);
  const [mode, setMode] = useState("citizen");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const navigate = useNavigate();
  const { firebaseUser, role, profile, loading: authLoading, loginCitizenByCode } = useAuth();

  const requiresForcedPasswordChange =
    !!profile?.requiresPasswordChange && (role === "admin" || role === "staff");

  // Avoid navigation loop: protected pages redirect back to /login while password change is required.
  if (!authLoading && firebaseUser && role && !requiresForcedPasswordChange && !mustChangePassword) {
    let redirectPath = "/user";
    if (role === "admin") redirectPath = "/admin/dashboard";
    if (role === "super_admin") redirectPath = "/super-admin/staff-admin";
    if (role === "staff") redirectPath = "/staff/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // Helper: wait for AuthContext to finish loading after Firebase sign-in
  const waitForAuthReady = () => {
    return new Promise((resolve) => {
      // Short-poll AuthContext readiness (it reacts to onAuthStateChanged)
      const check = () => {
        // Access latest values via the ref-like behavior of re-renders;
        // since this is inside the component, we resolve once the effect
        // will have fired. 200ms is sufficient for the Firestore getDoc.
        setTimeout(resolve, 600);
      };
      check();
    });
  };

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

      // If there is an existing citizen session, clear it so failed staff/admin login
      // doesn't "fall back" into citizen login via AuthContext.
      try {
        localStorage.removeItem("citizen_session_uid");
      } catch {
        // ignore
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

        if (docSnap.data().requiresPasswordChange && (r === "admin" || r === "staff")) {
          setMustChangePassword(true);
          return;
        }

        // Wait for AuthContext to finish processing the new auth state
        await waitForAuthReady();

        if (r === "admin") {
          navigate("/admin/dashboard");
        } else if (r === "super_admin") {
          navigate("/super-admin/staff-admin");
        } else if (r === "staff") {
          navigate("/staff/dashboard");
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

  const handleForcedPasswordChange = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }
    setPasswordChanging(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        requiresPasswordChange: false,
      });
      const updatedUserDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const updatedRole = normalizeRole(updatedUserDoc.data()?.role);
      setMustChangePassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      window.location.href = updatedRole === "admin" ? "/admin/dashboard" : "/staff/dashboard";
    } catch (error) {
      alert(error.message || "Failed to update password.");
    } finally {
      setPasswordChanging(false);
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
      {mustChangePassword && createPortal(
        <div className="modal-overlay modal-overlay--padded modal-overlay--scroll-follow">
          <form className="base-card modal-panel" onSubmit={handleForcedPasswordChange}>
            <h2 className="auth-title">Change Password Required</h2>
            <p className="settings-text">
              This is your first login. You must replace your temporary password before continuing.
            </p>
            <div className="input-group">
              <label>New Password</label>
              <input
                className="input-field"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                className="input-field"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button" disabled={passwordChanging}>
              {passwordChanging ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Login;
