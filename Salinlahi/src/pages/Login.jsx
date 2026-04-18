import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import Alert from "../components/Alert";
import "../css/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState({ type: "error", message: "", visible: false });
  const navigate = useNavigate();

  const showAlert = (message, type = "error") => {
    setAlert({ type, message, visible: true });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 🔥 Get user document from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;

        if (role === "admin") {
          navigate("/admin/AdminHome");
        } else {
          navigate("/user");
        }
      } else {
        showAlert("No user record found.", "error");
      }
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <>
      <Alert
        type={alert.type}
        message={alert.message}
        isVisible={alert.visible}
        onClose={hideAlert}
        autoClose={5000}
      />
      <div className="auth-form-wrapper">
        <form onSubmit={handleLogin} className="base-card auth-form">
          <h2 className="auth-title">Sign In</h2>
          <p className="form-subtitle">Access your Salinlahi account</p>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input-field"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Sign In
          </button>

          <p className="settings-text">
            <Link to="/forgot-password" className="auth-link">Forgot your password?</Link>
          </p>

          <p style={{ color: 'var(--color-text-muted)' }}>
            New to Salinlahi?{" "}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}

export default Login;
