import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import logo from '../assets/Logo_Black.png';
import '../css/auth.css';

function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    birth_date: '',
    contact_number: '',
    email: '',
    password: '',
    confirm_password: '',
    address_line: '',
    barangay: '',
    city: '',
    province: '',
    agree_terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!form.agree_terms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;
      const generatedUUID = uuidv4();

      await setDoc(doc(db, 'users', user.uid), {
        uuid: generatedUUID,
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        birth_date: form.birth_date,
        contact_number: form.contact_number,
        email: form.email,
        address_line: form.address_line,
        barangay: form.barangay,
        city: form.city,
        province: form.province,
        created_at: new Date(),
        role: 'user',
        verified: false,
        ayudas_applied: [],
        ayudas_beneficiary: [],
        ayudas_received: []
      });

      setSuccess('Registration successful! Redirecting to login...');

      // Store user info and redirect
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userName', `${form.first_name} ${form.last_name}`);

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sb-login-page sb-register-variant">
      {/* Left Panel - Form */}
      <div className="sb-login-left">
        <div className="sb-login-logo">
          <img src={logo} alt="Salinlahi" />
        </div>

        <div className="sb-login-form-area">
          <div className="sb-login-heading">
            <h1>Create an account</h1>
            <p>Join our assistance distribution program</p>
          </div>

          <div className="sb-login-divider">
            <span className="sb-login-divider-line"></span>
            <span className="sb-login-divider-line"></span>
          </div>

          {error && (
            <div className="sb-alert sb-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="sb-alert sb-alert-success">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="sb-login-form">
            {/* Section 1: Personal Details */}
            <div className="sb-form-section">
              <div className="sb-form-section-title">Personal Details</div>

              <div className="sb-form-row">
                <div className="sb-form-group">
                  <label className="sb-form-label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className="sb-form-input"
                    placeholder="Juan"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="sb-form-group">
                  <label className="sb-form-label">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="sb-form-input"
                    placeholder="Dela Cruz"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="sb-form-row">
                <div className="sb-form-group">
                  <label className="sb-form-label">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    className="sb-form-input"
                    placeholder="Optional"
                    value={form.middle_name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div className="sb-form-group">
                  <label className="sb-form-label">Birth Date *</label>
                  <input
                    type="date"
                    name="birth_date"
                    className="sb-form-input"
                    value={form.birth_date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="sb-form-group">
                <label className="sb-form-label">Contact Number *</label>
                <input
                  type="tel"
                  name="contact_number"
                  className="sb-form-input"
                  placeholder="09XX XXX XXXX"
                  value={form.contact_number}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Section 2: Contact & Address */}
            <div className="sb-form-section">
              <div className="sb-form-section-title">Contact & Address</div>

              <div className="sb-form-group">
                <label className="sb-form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="sb-form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="sb-form-group">
                <label className="sb-form-label">Street Address *</label>
                <input
                  type="text"
                  name="address_line"
                  className="sb-form-input"
                  placeholder="123 Rizal Street"
                  value={form.address_line}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="sb-form-row-3">
                <div className="sb-form-group">
                  <label className="sb-form-label">Barangay *</label>
                  <input
                    type="text"
                    name="barangay"
                    className="sb-form-input"
                    placeholder="Barangay"
                    value={form.barangay}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="sb-form-group">
                  <label className="sb-form-label">City *</label>
                  <input
                    type="text"
                    name="city"
                    className="sb-form-input"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="sb-form-group">
                  <label className="sb-form-label">Province *</label>
                  <input
                    type="text"
                    name="province"
                    className="sb-form-input"
                    placeholder="Province"
                    value={form.province}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Security */}
            <div className="sb-form-section">
              <div className="sb-form-section-title">Security</div>

              <div className="sb-form-row">
                <div className="sb-form-group">
                  <label className="sb-form-label">Password *</label>
                  <div className="sb-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="sb-form-input"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
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
                  <div className="sb-form-hint">Minimum 8 characters</div>
                </div>
                <div className="sb-form-group">
                  <label className="sb-form-label">Confirm Password *</label>
                  <div className="sb-password-wrapper">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirm_password"
                      className="sb-form-input"
                      placeholder="••••••••"
                      value={form.confirm_password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="sb-password-toggle"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex="-1"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="sb-form-check">
                <input
                  type="checkbox"
                  name="agree_terms"
                  id="agree_terms"
                  className="sb-form-check-input"
                  checked={form.agree_terms}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <label htmlFor="agree_terms" className="sb-form-check-label">
                  I agree to the Terms and Conditions and Privacy Policy
                  <span className="sb-check-hint">You must accept these to create an account</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="sb-sign-in-btn"
              disabled={loading}
              id="register-submit"
            >
              {loading ? (
                <>
                  <span className="sb-spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="sb-signup-link">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="sb-login-footer">
          <p>
            By continuing, you agree to Salinlahi's{' '}
            <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* Right Panel - Testimonial */}
      <div className="sb-login-right">
        <div className="sb-testimonial">
          <div className="sb-quote-mark">"</div>
          <blockquote className="sb-quote-text">
            Registration was quick and straightforward. Within minutes, I was part of the aid distribution system in our barangay.
          </blockquote>
          <div className="sb-quote-author">
            <div className="sb-author-avatar">
              <span>MR</span>
            </div>
            <span className="sb-author-name">@new_resident</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
