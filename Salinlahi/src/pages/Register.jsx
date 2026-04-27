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
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <img src={logo} alt="Salinlahi" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join our assistance distribution program</p>
        </div>

        {/* Registration Form */}
        <div className="auth-card">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <div>
                <div className="alert-title">Registration Error</div>
                <div className="alert-message">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <div>
                <div className="alert-title">Success</div>
                <div className="alert-message">{success}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            {/* Personal Information Section */}
            <div className="form-section">
              <div className="form-section-title">Personal Information</div>

              <div className="form-row">
                <div className="form-group form-row-full">
                  <label className="form-label required">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className="input-field"
                    placeholder="Enter your first name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    className="input-field"
                    placeholder="Optional"
                    value={form.middle_name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className="input-field"
                    placeholder="Enter your last name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Birth Date</label>
                  <input
                    type="date"
                    name="birth_date"
                    className="input-field"
                    value={form.birth_date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Contact Number</label>
                  <input
                    type="tel"
                    name="contact_number"
                    className="input-field"
                    placeholder="09XX XXX XXXX"
                    value={form.contact_number}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Contact & Address Section */}
            <div className="form-section">
              <div className="form-section-title">Contact & Address</div>

              <div className="form-group form-row-full">
                <label className="form-label required">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group form-row-full">
                <label className="form-label required">Street Address</label>
                <input
                  type="text"
                  name="address_line"
                  className="input-field"
                  placeholder="Enter street address"
                  value={form.address_line}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Barangay</label>
                  <input
                    type="text"
                    name="barangay"
                    className="input-field"
                    placeholder="Enter barangay"
                    value={form.barangay}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">City</label>
                  <input
                    type="text"
                    name="city"
                    className="input-field"
                    placeholder="Enter city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Province</label>
                  <input
                    type="text"
                    name="province"
                    className="input-field"
                    placeholder="Enter province"
                    value={form.province}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="form-section">
              <div className="form-section-title">Security</div>

              <div className="form-group">
                <label className="form-label required">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="input-field"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={handleChange}
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
                <div className="form-label-hint">Use at least 8 characters, including letters, numbers, and symbols</div>
              </div>

              <div className="form-group">
                <label className="form-label required">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm_password"
                    className="input-field"
                    placeholder="Re-enter your password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex="-1"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="form-check">
              <input
                type="checkbox"
                name="agree_terms"
                id="agree_terms"
                className="form-check-input"
                checked={form.agree_terms}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <label htmlFor="agree_terms" className="form-check-label">
                I agree to the Terms and Conditions and Privacy Policy
                <span className="text-tertiary">
                  You must accept these to create an account
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-4)' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <div className="auth-footer">
              <p>Already have an account? <Link to="/login" className="auth-link auth-link-bold">Sign in</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
