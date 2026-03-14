import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

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

      <div className="input-row">
        <input className="input-field" type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="input-row">
        <input className="input-field" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <button type="submit" className="auth-button">
        Login
      </button>
      
      <p className="settings-text" style={{textAlign: 'center', marginTop: '0.5rem'}}>
        <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
      </p>
      
      <p style={{ textAlign: "center", marginTop: "1rem", color: 'var(--color-text-muted)' }}>
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Register here
          </Link>
        </p>
    </form>
    </div>
  );
}


export default Login;
