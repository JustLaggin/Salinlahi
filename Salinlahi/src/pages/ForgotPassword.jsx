import { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (error) {
      setMessage("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <form onSubmit={handleReset} className="base-card auth-form">
        <h2 className="auth-title">Reset Password</h2>
        <p className="settings-text">Enter your email and we'll send a reset link</p>
        
        <div className="input-row">
          <input 
            className="input-field" 
            type="email" 
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>

        {message && (
          <div className={`status-badge ${message.includes('Error') ? 'error-badge' : ''}`}>
            {message}
          </div>
        )}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="settings-text" style={{textAlign: 'center', marginTop: '1rem'}}>
          <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;

