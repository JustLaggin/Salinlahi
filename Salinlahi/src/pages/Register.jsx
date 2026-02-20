import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

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
    <form onSubmit={handleRegister}>
      <h2>Register</h2>

      <input name="first_name" placeholder="First Name" onChange={handleChange} required />
      <input name="last_name" placeholder="Last Name" onChange={handleChange} required />
      <input name="middle_name" placeholder="Middle Name" onChange={handleChange} />
      <input type="date" name="birth_date" onChange={handleChange} required />
      <input name="contact_number" placeholder="Contact Number" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <input name="address_line" placeholder="Street Address" onChange={handleChange} required />
      <input name="barangay" placeholder="Barangay" onChange={handleChange} required />
      <input name="city" placeholder="City" onChange={handleChange} required />
      <input name="province" placeholder="Province" onChange={handleChange} required />

      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
