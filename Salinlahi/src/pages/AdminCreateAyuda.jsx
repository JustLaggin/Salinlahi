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
    timeStart: "",
    timeEnd: "",
    requirements: "",
    address: "",
    description: ""
  });

  const barangays = {
    "Batangas City": [
      "Alangilan", "Pallocan", "Sta. Rita", "San Isidro",
      "Kumintang Ibaba", "Bolbok", "Calicanto",
      "Libjo", "Tingga Itaas", "Santo Niño", "Santo Tomas"
    ],
    "Lipa City": [
      "Balintawak", "Sabang", "Anilao", "Marawoy",
      "Banaybanay", "Bolbok", "Sico",
      "Tambo", "Plaridel", "San Carlos"
    ],
    "Tanauan City": [
      "Altura Bata", "Altura Matanda", "Darasa",
      "Janopol", "Mabini", "Sambat",
      "Santol", "Ulango", "Wawa"
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
        timeStart: formData.timeStart,
        timeEnd: formData.timeEnd,
        requirements: formData.requirements,
        address: formData.address,
        description: formData.description,
        available: true,
        status: "ONGOING",
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
        timeStart: "",
        timeEnd: "",
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="auth-title" style={{ textAlign: "left", marginBottom: "0.5rem" }}>Create New Distribution</h1>
        <p className="settings-text" style={{ textAlign: "left" }}>Provide the details below to initialize a new Ayuda event.</p>
      </div>

      <form onSubmit={handleSubmit} className="base-card">

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
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

          <div className="input-group">
            <label>City / Municipality</label>
            <select
              className="input-field"
              name="city"
              value={formData.city}
              onChange={handleCityChange}
              required
            >
              <option value="">Select City</option>
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

          <div className="input-group">
            <label>Schedule (Date)</label>
            <input
              className="input-field"
              type="date"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Time Start</label>
            <input
              className="input-field"
              type="time"
              name="timeStart"
              value={formData.timeStart}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Time End</label>
            <input
              className="input-field"
              type="time"
              name="timeEnd"
              value={formData.timeEnd}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Designation Point (Location)</label>
            <input
              className="input-field"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. Barangay Hall"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Requirements</label>
          <input
            className="input-field"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="List of Requirements"
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
            rows="3"
            required
          />
        </div>

        <button type="submit" className="auth-button" style={{ maxWidth: '240px', alignSelf: 'flex-start', marginTop: '1rem' }}>
          Create Ayuda
        </button>

      </form>
    </div>
  );
}

export default AdminCreateAyuda;
