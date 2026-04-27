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
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <img src={logo} alt="Salinlahi" />
          </div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your email to receive a password reset link</p>
        </div>

        {/* Reset Form */}
        <div className="auth-card">
          {status === 'success' ? (
            <div className="forgot-password-section">
              <div className="alert alert-success">
                <CheckCircle size={24} />
                <div>
                  <div className="alert-title">Email Sent Successfully</div>
                  <div className="alert-message">{message}</div>
                </div>
              </div>
              <p className="text-secondary" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
                You will be redirected to login in a few seconds...
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="auth-form">
              {status === 'error' && (
                <div className="alert alert-error">
                  <AlertCircle size={20} />
                  <div>
                    <div className="alert-title">Error</div>
                    <div className="alert-message">{message}</div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label required">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === 'loading'}
                  />
                  <Mail size={20} style={{
                    position: 'absolute',
                    right: 'var(--space-4)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)',
                    pointerEvents: 'none'
                  }} />
                </div>
                <div className="form-label-hint">
                  We'll send you an email with instructions to reset your password
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="auth-footer">
                <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <ArrowLeft size={18} />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Help Text */}
        <div className="auth-card-footer">
          <p className="text-tertiary" style={{ fontSize: '0.875rem', textAlign: 'center' }}>
            Check your email (including spam folder) for the reset link. The link expires in 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

