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
        navigate("/admin");
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
    <div style={styles.page}>
    <form onSubmit={handleLogin} style={styles.form}>
      <h2 style={styles.title}>Login</h2>

      <input style={styles.input}type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)}required/>

      <input style={styles.input}type="password" placeholder="Password"onChange={(e) => setPassword(e.target.value)}required/>

      <button type="submit" style={styles.button}>
        Login
      </button>
      <p style={{ textAlign: "center", marginTop: "10px" }}>
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
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#ffffff",
  },
  form: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    width: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: {
    textAlign: "center",
    marginBottom: "10px",
  },
  row: {
    display: "grid",
    gap: "10px",
  },
  input: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    flex: 0.5,
  },
  button: {
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  }
};
export default Login;
