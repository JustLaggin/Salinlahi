import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/user");
        }
      } else {
        alert("No user record found.");
      }

      
      // Temporary preview alert
      alert("Login simulation successful! (Uncomment Firebase code for local use)");
      navigate("/admin");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <form onSubmit={handleLogin} className="base-card" style={styles.formContainer}>
        
        {/* The Title using our Soft Glow */}
        <h2 className="soft-white-glow" style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to Salinlahi Portal</p>

        {/* The Glassmorphism Inputs */}
        <div style={styles.inputGroup}>
          <input 
            style={styles.input} 
            type="email" 
            placeholder="Email Address" 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <input 
            style={styles.input} 
            type="password" 
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
        </div>

        {/* Gradient Button */}
        <button type="submit" style={styles.gradientButton}>
          Login
        </button>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--color-text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={styles.link}>
              Register here
            </Link>
          </p>
      </form>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh", /* Gives it room to breathe under the banner */
    padding: "20px"
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "2.5rem 2rem",
  },
  title: {
    textAlign: "center",
    marginBottom: "0.25rem",
    fontSize: "2rem"
  },
  subtitle: {
    textAlign: "center",
    color: "var(--color-text-muted)",
    marginBottom: "1.5rem",
    fontSize: "0.9rem"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.2)", /* Dark glass effect */
    color: "var(--color-text-main)",
    fontSize: "1rem",
    outline: "none",
  },
  gradientButton: {
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(to right, var(--color-primary-blue), var(--color-primary-green))",
    color: "#0B1121", /* Dark text for contrast */
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginTop: "10px",
    transition: "transform 0.1s ease",
  },
  link: {
    color: "var(--color-primary-blue)",
    fontWeight: "bold",
    textDecoration: "none"
  }
};

export default Login;