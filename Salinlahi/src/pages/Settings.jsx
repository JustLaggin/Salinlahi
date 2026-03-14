import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="app-container">
      <div className="base-card settings-card">
        
        <button className="auth-button logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;
