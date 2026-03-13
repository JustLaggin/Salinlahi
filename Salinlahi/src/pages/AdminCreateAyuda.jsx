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
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.form}>

        <h2>Create New Ayuda</h2>

        <label>Ayuda Title</label>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter Title"
          required
        />

        <label>Amount (₱)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Enter Amount"
          min="0"
          required
        />

        <label>City / Municipality</label>
        <select
          name="city"
          value={formData.city}
          onChange={handleCityChange}
          required
        >
          <option value="">Select City / Municipality</option>
          <option value="Batangas City">Batangas City</option>
          <option value="Lipa City">Lipa City</option>
          <option value="Tanauan City">Tanauan City</option>
        </select>

        <label>Barangay</label>
        <select
          name="barangay"
          value={formData.barangay}
          onChange={handleChange}
          disabled={!formData.city}
          required
        >
          <option value="">Select Barangay</option>

          {formData.city &&
            barangays[formData.city]?.map((brgy) => (
              <option key={brgy} value={brgy}>
                {brgy}
              </option>
            ))}
        </select>

        <label>Schedule</label>
        <input
          type="date"
          name="schedule"
          value={formData.schedule}
          onChange={handleChange}
        />

        <label>Requirements</label>
        <input
          name="requirements"
          value={formData.requirements}
          onChange={handleChange}
          placeholder="List of Requirements"
        />

        <label>Claiming Area</label>
        <input
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="e.g. 123 Mabini St."
        />

        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the Ayuda"
          required
        />

        <button type="submit" style={styles.button}>
          Create Ayuda
        </button>

      </form>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "40px"
  },

  form: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    width: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  button: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#007bff",
    border: "none",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default AdminCreateAyuda;