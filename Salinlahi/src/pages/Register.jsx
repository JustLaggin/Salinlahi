import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
import Alert from "../components/Alert";
import "../css/login.css";

function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [alert, setAlert] = useState({ type: "error", message: "", visible: false });
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    birth_date: "",
    contact_number: "",
    email: "",
    password: "",
    confirm_password: "",
    address_line: "",
    barangay: "",
    city: "",
    province: ""
  });

  const TOTAL_STEPS = 3;

  const showAlert = (message, type = "error") => {
    setAlert({ type, message, visible: true });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        // Account step validation
        if (!form.email.trim()) {
          showAlert("Email is required", "error");
          return false;
        }
        if (!form.password.trim()) {
          showAlert("Password is required", "error");
          return false;
        }
        if (form.password !== form.confirm_password) {
          showAlert("Passwords do not match", "error");
          return false;
        }
        return true;
      case 2:
        // Personal info validation
        if (!form.first_name.trim()) {
          showAlert("First name is required", "error");
          return false;
        }
        if (!form.last_name.trim()) {
          showAlert("Last name is required", "error");
          return false;
        }
        if (!form.birth_date) {
          showAlert("Birth date is required", "error");
          return false;
        }
        return true;
      case 3:
        // Contact & address validation
        if (!form.contact_number.trim()) {
          showAlert("Contact number is required", "error");
          return false;
        }
        if (!form.address_line.trim()) {
          showAlert("Street address is required", "error");
          return false;
        }
        if (!form.barangay.trim()) {
          showAlert("Barangay is required", "error");
          return false;
        }
        if (!form.city.trim()) {
          showAlert("City is required", "error");
          return false;
        }
        if (!form.province.trim()) {
          showAlert("Province is required", "error");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      showAlert("Passwords do not match", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;
      const generatedUUID = uuidv4();

      await setDoc(doc(db, "users", user.uid), {
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
        role: "user",
        ayudas_applied: [],
        ayudas_beneficiary: [],
        ayudas_received: []
        
      });

      showAlert("Registration successful! Redirecting to login...", "success");

      // Reset form
      setTimeout(() => {
        setForm({
          first_name: "",
          last_name: "",
          middle_name: "",
          birth_date: "",
          contact_number: "",
          email: "",
          password: "",
          confirm_password: "",
          address_line: "",
          barangay: "",
          city: "",
          province: ""
        });
        setCurrentStep(1);
      }, 1500);

    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <>
      <Alert
        type={alert.type}
        message={alert.message}
        isVisible={alert.visible}
        onClose={hideAlert}
        autoClose={5000}
      />
      <div className="auth-form-wrapper">
        <form onSubmit={handleRegister} className="base-card auth-form">
          <h2 className="auth-title">Registration</h2>
          <p className="form-subtitle">Create your account in just a few steps</p>

          {/* ========== STEP INDICATOR ========== */}
          <div className="step-indicator">
            <div className="step-progress-bar">
              <div 
                className="step-progress-fill" 
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              ></div>
            </div>
            <div className="step-counter">
              Step {currentStep} of {TOTAL_STEPS}
            </div>
          </div>

          {/* ========== STEP 1: ACCOUNT INFORMATION ========== */}
          {currentStep === 1 && (
            <div className="form-step active-step">
              <h3 className="form-step-title">Account Information</h3>
              <p className="form-step-description">Set up your email and password</p>
              
              <div className="form-field-group">
                <label className="form-field-label">Email Address</label>
                <input
                  className="input-field"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Password</label>
                <input
                  className="input-field"
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Confirm Password</label>
                <input
                  className="input-field"
                  type="password"
                  name="confirm_password"
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* ========== STEP 2: PERSONAL INFORMATION ========== */}
          {currentStep === 2 && (
            <div className="form-step active-step">
              <h3 className="form-step-title">Personal Information</h3>
              <p className="form-step-description">Tell us about yourself</p>
              
              <div className="form-field-group">
                <label className="form-field-label">First Name</label>
                <input
                  className="input-field"
                  name="first_name"
                  placeholder="Enter your first name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Middle Name <span className="optional-text">(Optional)</span></label>
                <input
                  className="input-field"
                  name="middle_name"
                  placeholder="Enter your middle name"
                  value={form.middle_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Last Name</label>
                <input
                  className="input-field"
                  name="last_name"
                  placeholder="Enter your last name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Birth Date</label>
                <input
                  className="input-field"
                  type="date"
                  name="birth_date"
                  value={form.birth_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* ========== STEP 3: CONTACT & ADDRESS ========== */}
          {currentStep === 3 && (
            <div className="form-step active-step">
              <h3 className="form-step-title">Contact & Address</h3>
              <p className="form-step-description">Where can we reach you?</p>
              
              <div className="form-field-group">
                <label className="form-field-label">Contact Number</label>
                <input
                  className="input-field"
                  name="contact_number"
                  placeholder="Enter your contact number"
                  value={form.contact_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Street Address</label>
                <input
                  className="input-field"
                  name="address_line"
                  placeholder="Enter your street address"
                  value={form.address_line}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Barangay</label>
                <input
                  className="input-field"
                  name="barangay"
                  placeholder="Enter your barangay"
                  value={form.barangay}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">City</label>
                <input
                  className="input-field"
                  name="city"
                  placeholder="Enter your city"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Province</label>
                <input
                  className="input-field"
                  name="province"
                  placeholder="Enter your province"
                  value={form.province}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* ========== STEP NAVIGATION ========== */}
          <div className="step-navigation">
            {currentStep > 1 && (
              <button 
                type="button" 
                className="nav-button nav-button-back"
                onClick={handlePreviousStep}
              >
                ← Back
              </button>
            )}
            
            {currentStep < TOTAL_STEPS ? (
              <button 
                type="button" 
                className="nav-button nav-button-next"
                onClick={handleNextStep}
              >
                Next →
              </button>
            ) : (
              <button 
                type="submit" 
                className="auth-button register-button"
              >
                Create Account
              </button>
            )}
          </div>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}



export default Register;