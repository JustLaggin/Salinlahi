import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

function EditProfile() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    birth_date: "",
    contact_number: "",
    email: "",
    address_line: "",
    barangay: "",
    city: "",
    province: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            middle_name: data.middle_name || "",
            birth_date: data.birth_date || "",
            contact_number: data.contact_number || "",
            email: data.email || "",
            address_line: data.address_line || "",
            barangay: data.barangay || "",
            city: data.city || "",
            province: data.province || ""
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        birth_date: form.birth_date,
        contact_number: form.contact_number,
        address_line: form.address_line,
        barangay: form.barangay,
        city: form.city,
        province: form.province
      });

      alert("Profile updated successfully!");
      navigate("/user/settings");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  return (
    <div className="app-container">
      <form onSubmit={handleSubmit} className="base-card auth-form">
        <h2 className="auth-title">Edit Profile</h2>

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
            disabled
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

        <div className="button-group">
          <button type="submit" className="auth-button" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" className="auth-button stop-btn" onClick={() => navigate("/user/settings")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;