import { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import logo from '../assets/Logo_Black.png';
import '../css/auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus('success');
      setMessage('Password reset email sent! Check your inbox for further instructions.');
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="sb-login-page">
      {/* Left Panel - Form */}
      <div className="sb-login-left">
        <div className="sb-login-logo">
          <img src={logo} alt="Salinlahi" />
        </div>

        <div className="sb-login-form-area">
          <div className="sb-login-heading">
            <h1>Reset password</h1>
            <p>Enter your email to receive a password reset link</p>
          </div>

          <div className="sb-login-divider">
            <span className="sb-login-divider-line"></span>
            <span className="sb-login-divider-line"></span>
          </div>

          {status === 'success' ? (
            <div>
              <div className="sb-alert sb-alert-success">
                <CheckCircle size={16} />
                <span>{message}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', textAlign: 'center', marginTop: '20px' }}>
                Redirecting to login in a few seconds...
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="sb-login-form">
              {status === 'error' && (
                <div className="sb-alert sb-alert-error">
                  <AlertCircle size={16} />
                  <span>{message}</span>
                </div>
              )}

              <div className="sb-form-group">
                <label className="sb-form-label">Email</label>
                <input
                  type="email"
                  className="sb-form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'loading'}
                  id="forgot-email"
                />
                <div className="sb-form-hint">
                  We'll send you an email with instructions to reset your password
                </div>
              </div>

              <button
                type="submit"
                className="sb-sign-in-btn"
                disabled={status === 'loading'}
                id="forgot-submit"
              >
                {status === 'loading' ? (
                  <>
                    <span className="sb-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <div className="sb-signup-link">
            <p>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </p>
          </div>
        </div>

        <div className="sb-login-footer">
          <p>
            Check your email (including spam folder) for the reset link. The link expires in 24 hours.
          </p>
        </div>
      </div>

      {/* Right Panel - Testimonial */}
      <div className="sb-login-right">
        <div className="sb-testimonial">
          <div className="sb-quote-mark">"</div>
          <blockquote className="sb-quote-text">
            The support team helped me recover my account within minutes. The process was simple and secure.
          </blockquote>
          <div className="sb-quote-author">
            <div className="sb-author-avatar">
              <span>AL</span>
            </div>
            <span className="sb-author-name">@verified_user</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
