import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    birth_date: "",
    contact_number: "",
    email: "",
    password: "",
    address_line: "",
    barangay: "",
    city: "",
    province: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;
      const generatedUUID = uuidv4();

      await setDoc(doc(db, "users", user.uid), {
        uuid: generatedUUID,
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        birth_date: form.birth_date,
        contact_number: form.contact_number,
        email: form.email,
        address_line: form.address_line,
        barangay: form.barangay,
        city: form.city,
        province: form.province,
        role: "user",
        created_at: new Date()
      });

      alert("Registration successful!");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <form
        onSubmit={handleRegister}
        className="base-card"
        style={styles.formContainer}
      >
        <h2 className="soft-white-glow" style={styles.title}>
          Create an Account
        </h2>
        <p style={styles.subtitle}>Join the Salinlahi community</p>

        <div style={styles.row}>
          <input
            style={styles.input}
            name="first_name"
            placeholder="First Name"
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            name="middle_name"
            placeholder="Middle Name"
            onChange={handleChange}
          />
        </div>

        <input
          style={styles.input}
          name="last_name"
          placeholder="Last Name"
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="date"
          name="birth_date"
          onChange={handleChange}
          required
        />

        <div style={styles.row}>
          <input
            style={styles.input}
            name="contact_number"
            placeholder="Contact Number"
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email Address"
            onChange={handleChange}
            required
          />
        </div>

        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />

        <div style={styles.row}>
          <input
            style={styles.input}
            name="address_line"
            placeholder="Street Address"
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            name="barangay"
            placeholder="Barangay"
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.row}>
          <input
            style={styles.input}
            name="city"
            placeholder="City"
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            name="province"
            placeholder="Province"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" style={styles.gradientButton}>
          Register
        </button>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login here
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
    minHeight: "80vh",
    padding: "20px"
  },
  formContainer: {
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "2.5rem 2rem"
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
  row: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "var(--color-text-main)",
    fontSize: "0.95rem",
    outline: "none"
  },
  gradientButton: {
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(to right, var(--color-primary-blue), var(--color-primary-green))",
    color: "#0B1121",
    fontWeight: "bold",
    fontSize: "1.05rem",
    cursor: "pointer",
    marginTop: "10px",
    transition: "transform 0.1s ease"
  },
  link: {
    color: "var(--color-primary-blue)",
    fontWeight: "bold",
    textDecoration: "none"
  }
};

export default Register;