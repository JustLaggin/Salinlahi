import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
import { generateUniqueCitizenCode } from "../utils/citizenCode";

function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    birth_date: "",
    contact_number: "",
    email: "",
    password: "",
    confirm_password: "",
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

    if (form.password !== form.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;
      const generatedUUID = uuidv4();
      const citizenCode = await generateUniqueCitizenCode(db);

      await setDoc(doc(db, "users", user.uid), {
        uuid: generatedUUID,
        citizenCode,
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
        created_at: new Date(),
        role: "citizen",
        ayudas_applied: [],
        ayudas_beneficiary: [],
        ayudas_received: [],
        claim_history: [],
      });

      alert("Registration successful!");

      // Reset form
      setForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        birth_date: "",
        contact_number: "",
        email: "",
        password: "",
        confirm_password: "",
        address_line: "",
        barangay: "",
        city: "",
        province: ""
      });

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="app-container">
      <form onSubmit={handleRegister} className="base-card auth-form">
  <h2 className="auth-title">Registration</h2>

        <div className="input-row">
          <input
            className="input-field"
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            required
          />
          <input
            className="input-field"
            name="middle_name"
            placeholder="Middle Name (Optional)"
            value={form.middle_name}
            onChange={handleChange}
          />
        </div>

        <div className="input-row">
          <input
            className="input-field"
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            required
          />
          <input
            className="input-field"
            type="date"
            name="birth_date"
            placeholder="Birth Date"
            value={form.birth_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-row">
          <input
            className="input-field"
            name="contact_number"
            placeholder="Contact Number"
            value={form.contact_number}
            onChange={handleChange}
            required
          />

          <input
            className="input-field"
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-row">
          <input
            className="input-field"
            name="address_line"
            placeholder="Street Address"
            value={form.address_line}
            onChange={handleChange}
            required
          />

          <input
            className="input-field"
            name="barangay"
            placeholder="Barangay"
            value={form.barangay}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-row">
          <input
            className="input-field"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
          />

          <input
            className="input-field"
            name="province"
            placeholder="Province"
            value={form.province}
            onChange={handleChange}
            required
          />
        </div>
        {/* PASSWORD SECTION */}
        <div className="input-row">
          <input
            className="input-field"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <input
            className="input-field"
            type="password"
            name="confirm_password"
            placeholder="Confirm Password"
            value={form.confirm_password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="auth-button">
          Register
        </button>

        <p style={{ textAlign: "center", marginTop: "1rem", color: 'var(--color-text-muted)' }}>
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}



export default Register;