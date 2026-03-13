import { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function AdminCreateAyuda() {

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    city: "",
    barangay: "",
    schedule: "",
    requirements: "",
    address: "",
    description: ""
  });

  const barangays = {
    "Batangas City": [
      "Alangilan","Pallocan","Sta. Rita","San Isidro",
      "Kumintang Ibaba","Bolbok","Calicanto",
      "Libjo","Tingga Itaas","Santo Niño"
    ],
    "Lipa City": [
      "Balintawak","Sabang","Anilao","Marawoy",
      "Banaybanay","Bolbok","Sico",
      "Tambo","Plaridel","San Carlos"
    ],
    "Tanauan City": [
      "Altura Bata","Altura Matanda","Darasa",
      "Janopol","Mabini","Sambat",
      "Santol","Ulango","Wawa"
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCityChange = (e) => {
    const city = e.target.value;

    setFormData({
      ...formData,
      city: city,
      barangay: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const user = auth.currentUser;

      if (!user) {
        alert("Admin not logged in.");
        return;
      }

      await addDoc(collection(db, "ayudas"), {
        title: formData.title,
        amount: Number(formData.amount),
        city: formData.city,
        barangay: formData.barangay,
        schedule: formData.schedule,
        requirements: formData.requirements,
        address: formData.address,
        description: formData.description,
        available: true,
        beneficiaries: [],
        applicants: [],
        created_by: user.uid,
        created_at: new Date()
      });

      alert("Ayuda successfully created!");

      // Reset form
      setFormData({
        title: "",
        amount: "",
        city: "",
        barangay: "",
        schedule: "",
        requirements: "",
        address: "",
        description: ""
      });

    } catch (error) {
      console.error("Error creating Ayuda:", error);
      alert("Failed to create Ayuda. Please try again.");
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className="base-card" style={styles.formContainer}>

        <h2 className="soft-white-glow" style={styles.title}>Create New Ayuda</h2>
        <p style={styles.subtitle}>Set up a new ayuda distribution</p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Ayuda Title</label>
          <input
            style={styles.input}
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter Title"
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Amount (₱)</label>
          <input
            style={styles.input}
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter Amount"
            min="0"
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>City / Municipality</label>
          <select
            style={styles.input}
            name="city"
            value={formData.city}
            onChange={handleCityChange}
            required
          >
            <option value="" style={{color: "black"}}>Select City / Municipality</option>
            <option value="Batangas City" style={{color: "black"}}>Batangas City</option>
            <option value="Lipa City" style={{color: "black"}}>Lipa City</option>
            <option value="Tanauan City" style={{color: "black"}}>Tanauan City</option>
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Barangay</label>
          <select
            style={styles.input}
            name="barangay"
            value={formData.barangay}
            onChange={handleChange}
            disabled={!formData.city}
            required
          >
            <option value="" style={{color: "black"}}>Select Barangay</option>
            {formData.city &&
              barangays[formData.city]?.map((brgy) => (
                <option key={brgy} value={brgy} style={{color: "black"}}>
                  {brgy}
                </option>
              ))}
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Schedule</label>
          <input
            style={styles.input}
            type="date"
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Requirements</label>
          <input
            style={styles.input}
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="List of Requirements"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Claiming Area</label>
          <input
            style={styles.input}
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 123 Mabini St."
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            style={{...styles.input, resize: "vertical", minHeight: "80px"}}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the Ayuda"
            required
          />
        </div>

        <button type="submit" style={styles.gradientButton}>
          Create Ayuda
        </button>

      </form>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px"
  },
  formContainer: {
    width: "100%",
    maxWidth: "500px",
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
    gap: "6px"
  },
  label: {
    fontSize: "0.9rem",
    color: "var(--color-text-main)",
    fontWeight: "500"
  },
  input: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "var(--color-text-main)",
    fontSize: "1rem",
    outline: "none",
  },
  gradientButton: {
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(to right, var(--color-primary-blue), var(--color-primary-green))",
    color: "#0B1121",
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginTop: "10px",
    transition: "transform 0.1s ease",
  }
};

export default AdminCreateAyuda;