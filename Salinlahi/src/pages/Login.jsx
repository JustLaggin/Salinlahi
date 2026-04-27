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
    <div className="auth-container login-shell">
      <div className="auth-wrapper login-shell-wrapper">
        <section className="login-form-column">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <img src={logo} alt="Salinlahi" />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <div className="auth-card">
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <div>
                  <div className="alert-title">Login Error</div>
                  <div className="alert-message">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              {/* Email Field */}
              <div className="form-group">
                <label className="form-label required">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label required">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="auth-forgot-wrapper">
                <Link to="/forgot-password" className="auth-link">
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Register Link */}
              <div className="auth-footer">
                <p>Don't have an account? <Link to="/register" className="auth-link auth-link-bold">Create one</Link></p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="auth-card-footer">
            <p className="text-tertiary" style={{ fontSize: '0.875rem', textAlign: 'center' }}>
              This is a secure government assistance distribution system.
            </p>
          </div>
        </section>

        <aside className="login-showcase" aria-hidden="true">
          <div className="login-showcase-badge">Salinlahi Secure Portal</div>
          <blockquote className="login-showcase-quote">
            Fast, transparent, and accountable aid operations.
          </blockquote>
          <p className="login-showcase-meta">
            Built for residents, administrators, and future government scale.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default Login;
