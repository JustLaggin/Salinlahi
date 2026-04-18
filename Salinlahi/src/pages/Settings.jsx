import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

function Settings() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="app-container">
      <div className="base-card settings-card">
        <h2 className="auth-title">Settings</h2>

        {userData && (
          <div className="profile-info">
            <h3>Profile Information</h3>
            <p><strong>Name:</strong> {userData.first_name} {userData.middle_name} {userData.last_name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Contact:</strong> {userData.contact_number}</p>
            <p><strong>Address:</strong> {userData.address_line}, {userData.barangay}, {userData.city}, {userData.province}</p>
            <p><strong>Birth Date:</strong> {userData.birth_date}</p>
            <p><strong>Member since:</strong> {new Date(userData.created_at?.toDate?.() || userData.created_at).toLocaleDateString()}</p>
          </div>
        )}

        <div className="settings-actions">
          <button className="auth-button" onClick={() => navigate("/user/edit-profile")}>
            ✏️ Edit Profile
          </button>
          <button className="auth-button logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
