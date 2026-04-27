import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function AdminCreateAyuda() {

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    programType: "ONE_TIME",
    ayudaType: "STANDARD",
    aidKind: "RELIEF_GOODS",
    requiredDays: "",
    city: "",
    barangay: "",
    schedule: "",
    timeStart: "",
    timeEnd: "",
    requirements: "",
    address: "",
    description: ""
  });

  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

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
    ],

    "Santo Tomas City": [
      "San Miguel", "San Bartolome", "San Pablo",
      "San Jose", "San Roque", "San Vicente", "Barangay I",
      "Barangay II", "Barangay III", "Barangay IV"
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

  const createAyuda = async () => {
    if (submitting) return;
    setSubmitting(true);
    setConfirmOpen(false);

    try {

      const user = auth.currentUser;

      if (!user) {
        setErrorModalMessage("Admin not logged in.");
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, "ayudas"), {
        title: formData.title,
        amount: Number(formData.amount),
        programType: formData.programType,
        ayudaType: formData.ayudaType || "STANDARD",
        aidKind: formData.programType === "ONE_TIME" ? formData.aidKind : null,
        requiredDays:
          formData.programType === "SERVICE"
            ? Math.max(1, Number(formData.requiredDays || 1))
            : null,
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

      setToast("Ayuda Created Successfully!");

      // Reset form
      setFormData({
        title: "",
        amount: "",
        programType: "ONE_TIME",
        ayudaType: "STANDARD",
        aidKind: "RELIEF_GOODS",
        requiredDays: "",
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
      setErrorModalMessage("Failed to create Ayuda. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmOpen(true);
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
            <label>Program Type</label>
            <select
              className="input-field"
              name="programType"
              value={formData.programType}
              onChange={handleChange}
              required
            >
              <option value="ONE_TIME">ONE_TIME</option>
              <option value="SERVICE">SERVICE</option>
            </select>
          </div>

          <div className="input-group">
            <label>Ayuda Type</label>
            <select
              className="input-field"
              name="ayudaType"
              value={formData.ayudaType}
              onChange={handleChange}
              required
            >
              <option value="STANDARD">Standard Ayuda</option>
              <option value="RAPID">Rapid Ayuda</option>
            </select>
          </div>

          {formData.programType === "ONE_TIME" ? (
            <div className="input-group">
              <label>Aid Selection</label>
              <select
                className="input-field"
                name="aidKind"
                value={formData.aidKind}
                onChange={handleChange}
                required
              >
                <option value="RELIEF_GOODS">Relief Goods</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          ) : (
            <div className="input-group">
              <label>Required Days (Attendance)</label>
              <input
                className="input-field"
                type="number"
                min="1"
                name="requiredDays"
                value={formData.requiredDays}
                onChange={handleChange}
                placeholder="e.g. 10"
                required
              />
            </div>
          )}

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
              {Object.keys(barangays).map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
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


        </div>

        <div className="input-group">
          <label>List of Requirements</label>
          <textarea
            className="input-field"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="e.g.&#10;- Valid ID&#10;- Barangay Certificate&#10;- Proof of Residence"
            rows="4"
            style={{ resize: "vertical" }}
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

        <button
          type="submit"
          className="auth-button"
          style={{ maxWidth: '240px', alignSelf: 'flex-start', marginTop: '1rem' }}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Ayuda"}
        </button>

      </form>

      {toast && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff",
          padding: "1rem 1.75rem",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontWeight: 600,
          fontSize: "1rem",
          animation: "slideInRight 0.3s ease-out"
        }}>
          <span style={{ fontSize: "1.25rem" }}>✅</span>
          {toast}
        </div>
      )}

      {confirmOpen && createPortal(
        <div className="modal-overlay modal-overlay--scroll-follow modal-overlay--padded">
          <div className="base-card modal-panel">
            <h2 className="auth-title" style={{ marginBottom: "1rem" }}>
              Confirm Ayuda Creation
            </h2>
            <p className="settings-text" style={{ marginBottom: "1rem" }}>
              Please confirm the details before creating this ayuda.
            </p>

            <div className="modal-inset-panel" style={{ textAlign: "left" }}>
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Type:</strong> {formData.programType}</p>
              <p><strong>Ayuda Mode:</strong> {(formData.ayudaType || "STANDARD").toUpperCase()}</p>
              <p><strong>Amount:</strong> ₱{Number(formData.amount || 0).toLocaleString()}</p>
              <p><strong>Location:</strong> {formData.address}, {formData.barangay}, {formData.city}</p>
              <p><strong>Schedule:</strong> {formData.schedule || "TBA"} {formData.timeStart && formData.timeEnd ? `(${formData.timeStart} - ${formData.timeEnd})` : ""}</p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="auth-button"
                onClick={() => void createAyuda()}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Confirm Create"}
              </button>
              <button
                type="button"
                className="auth-button btn-neutral-gradient"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {errorModalMessage && createPortal(
        <div className="modal-overlay modal-overlay--scroll-follow modal-overlay--padded">
          <div className="base-card modal-panel" style={{ textAlign: "center", maxWidth: "460px", padding: "2.25rem" }}>
            <h2 className="auth-title" style={{ marginBottom: "1rem" }}>
              Unable to Create Ayuda
            </h2>
            <p className="settings-text" style={{ marginBottom: "1.5rem" }}>
              {errorModalMessage}
            </p>
            <button
              type="button"
              className="auth-button"
              onClick={() => setErrorModalMessage("")}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminCreateAyuda;
