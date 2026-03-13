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
    <div style={styles.page}>
      <form onSubmit={handleRegister} style={styles.form}>
        <h2 style={styles.title}>Registration</h2>

        
        <input style={styles.input} name="first_name" placeholder="First Name" onChange={handleChange} required />
        
        <input style={styles.input} name="middle_name" placeholder="Middle Name" onChange={handleChange} />

        <input style={styles.input} name="last_name" placeholder="Last Name" onChange={handleChange} required />
      
        <input style={styles.input} type="date" name="birth_date" onChange={handleChange} required />
        <div style={styles.row}>
        <input style={styles.input} name="contact_number" placeholder="Contact Number" onChange={handleChange} required />
        <input style={styles.input} type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
        </div>
        <div style={styles.row}>
          <input style={styles.input} name="address_line" placeholder="Street Address" onChange={handleChange} required />
          <input style={styles.input} name="barangay" placeholder="Barangay" onChange={handleChange} required />
        </div>

        <div style={styles.row}>
          <input style={styles.input} name="city" placeholder="City" onChange={handleChange} required />
        <input style={styles.input} name="province" placeholder="Province" onChange={handleChange} required />
        </div>

        
        <button type="submit" style={styles.button}>
          Register
        </button>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
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
    display: "flex",
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

export default Register;