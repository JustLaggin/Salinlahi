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
    description: "",
    status: "ONGOING"
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
        status: formData.status,
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
        description: "",
        status: "ONGOING"
      });

    } catch (error) {
      console.error("Error creating Ayuda:", error);
      alert("Failed to create Ayuda. Please try again.");
    }
  };

  return (
    <div className="app-container">
      <form onSubmit={handleSubmit} className="base-card auth-form">
        <h2 className="auth-title">Create New Ayuda</h2>

        <div className="input-group">
          <label>Title</label>
          <input
            className="input-field"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter Title"
            required
          />
        </div>

        <div className="input-group">
          <label>Amount (₱)</label>
          <input
            className="input-field"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter Amount"
            min="0"
            required
          />
        </div>

<div className="input-row">
          <div className="input-group">
            <label>City / Municipality</label>
            <select
              className="input-field"
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
          </div>
          <div className="input-group">
            <label>Barangay</label>
            <select
              className="input-field"
              name="barangay"
              value={formData.barangay}
              onChange={handleChange}
              disabled={!formData.city}
              required
            >
              <option value="">Select Barangay</option>
              {formData.city && barangays[formData.city]?.map((brgy) => (
                <option key={brgy} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Schedule</label>
            <input
              className="input-field"
              type="date"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Address</label>
            <input
              className="input-field"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. 123 Mabini St."
            />
          </div>
        </div>

        <div className="input-group">
          <label>Requirements</label>
          <textarea
            className="input-field"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="List of Requirements"
            rows="3"
          />
        </div>

        <div className="input-group">
          <label>Description</label>
          <textarea
            className="input-field"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the Ayuda"
            rows="4"
            required
          />
        </div>

        <div className="input-group">
          <label>Status</label>
          <select
            className="input-field"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button type="submit" className="auth-button">
          Create Ayuda
        </button>

      </form>
    </div>
  );
}

export default AdminCreateAyuda;
