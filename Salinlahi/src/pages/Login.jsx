import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import logo from '../assets/Logo_Black.png';
import '../css/auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user document from Firestore
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role;
        
        // Store user info in localStorage
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userName', userData.name || 'User');
        localStorage.setItem('userRole', role);

        if (role === 'admin') {
          navigate('/admin/AdminHome');
        } else {
          navigate('/user');
        }
      } else {
        setError('User profile not found. Please contact support.');
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sb-login-page">
      {/* Left Panel - Form */}
      <div className="sb-login-left">
        {/* Logo */}
        <div className="sb-login-logo">
          <img src={logo} alt="Salinlahi" />
        </div>

        {/* Form Area */}
        <div className="sb-login-form-area">
          {/* Heading */}
          <div className="sb-login-heading">
            <h1>Welcome back</h1>
            <p>Sign in to your account</p>
          </div>

          {/* Divider */}
          <div className="sb-login-divider">
            <span className="sb-login-divider-line"></span>
            <span className="sb-login-divider-line"></span>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="sb-login-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="sb-login-form">
            {/* Email */}
            <div className="sb-form-group">
              <label className="sb-form-label">Email</label>
              <input
                type="email"
                className="sb-form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                id="login-email"
              />
            </div>

            {/* Password */}
            <div className="sb-form-group">
              <div className="sb-form-label-row">
                <label className="sb-form-label">Password</label>
                <Link to="/forgot-password" className="sb-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="sb-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="sb-form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  id="login-password"
                />
                <button
                  type="button"
                  className="sb-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="sb-sign-in-btn"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <>
                  <span className="sb-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="sb-signup-link">
            <p>
              Don't have an account?{' '}
              <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sb-login-footer">
          <p>
            By continuing, you agree to Salinlahi's{' '}
            <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>, and to receive periodic emails with updates.
          </p>
        </div>
      </div>

      {/* Right Panel - Testimonial */}
      <div className="sb-login-right">
        <div className="sb-testimonial">
          <div className="sb-quote-mark">"</div>
          <blockquote className="sb-quote-text">
            Salinlahi made distributing government aid seamless. Fast, transparent, and accountable — exactly what our barangay needed.
          </blockquote>
          <div className="sb-quote-author">
            <div className="sb-author-avatar">
              <span>JR</span>
            </div>
            <span className="sb-author-name">@barangay_admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
