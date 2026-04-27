import { useState } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AlertCircle, CheckCircle, Plus } from 'lucide-react';
import '../css/forms.css';

function AdminCreateAyuda() {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    city: '',
    barangay: '',
    schedule: '',
    requirements: '',
    address: '',
    description: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const barangays = {
    'Batangas City': [
      'Alangilan', 'Pallocan', 'Sta. Rita', 'San Isidro',
      'Kumintang Ibaba', 'Bolbok', 'Calicanto',
      'Libjo', 'Tingga Itaas', 'Santo Niño'
    ],
    'Lipa City': [
      'Balintawak', 'Sabang', 'Anilao', 'Marawoy',
      'Banaybanay', 'Bolbok', 'Sico',
      'Tambo', 'Plaridel', 'San Carlos'
    ],
    'Tanauan City': [
      'Altura Bata', 'Altura Matanda', 'Darasa',
      'Janopol', 'Mabini', 'Sambat',
      'Santol', 'Ulango', 'Wawa'
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setFormData({
      ...formData,
      city: city,
      barangay: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        setError('Administrator not logged in. Please sign in again.');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'ayudas'), {
        title: formData.title,
        amount: Number(formData.amount),
        city: formData.city,
        barangay: formData.barangay,
        schedule: formData.schedule,
        requirements: formData.requirements,
        address: formData.address,
        description: formData.description,
        available: true,
        beneficiaries: [],
        applicants: [],
        created_by: user.uid,
        created_at: new Date()
      });

      setSuccess('Ayuda program created successfully!');

      // Reset form
      setFormData({
        title: '',
        amount: '',
        city: '',
        barangay: '',
        schedule: '',
        requirements: '',
        address: '',
        description: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error creating Ayuda:', error);
      setError(error.message || 'Failed to create Ayuda program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Create New Ayuda Program</h1>
          <p className="text-secondary">Set up a new aid distribution program for beneficiaries</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="form-card">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <div>
              <div className="alert-title">Error</div>
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

        <form onSubmit={handleSubmit} className="form-content">
          {/* Basic Information Section */}
          <div className="form-section">
            <h2 className="form-section-heading">Basic Information</h2>

            <div className="form-group form-row-full">
              <label className="form-label required">Program Title</label>
              <input
                type="text"
                name="title"
                className="input-field"
                placeholder="e.g., Emergency Relief Fund 2024"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <div className="form-label-hint">Give your program a clear, descriptive title</div>
            </div>

            <div className="form-group form-row-full">
              <label className="form-label required">Assistance Amount (₱)</label>
              <input
                type="number"
                name="amount"
                className="input-field"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="100"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group form-row-full">
              <label className="form-label required">Program Description</label>
              <textarea
                name="description"
                className="input-field textarea-field"
                placeholder="Provide a detailed description of the program, its objectives, and who it aims to help"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Location Information Section */}
          <div className="form-section">
            <h2 className="form-section-heading">Location</h2>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">City / Municipality</label>
                <select
                  name="city"
                  className="input-field"
                  value={formData.city}
                  onChange={handleCityChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select a city</option>
                  <option value="Batangas City">Batangas City</option>
                  <option value="Lipa City">Lipa City</option>
                  <option value="Tanauan City">Tanauan City</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Barangay</label>
                <select
                  name="barangay"
                  className="input-field"
                  value={formData.barangay}
                  onChange={handleChange}
                  disabled={!formData.city || loading}
                  required
                >
                  <option value="">Select a barangay</option>
                  {formData.city && barangays[formData.city]?.map((brgy) => (
                    <option key={brgy} value={brgy}>
                      {brgy}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group form-row-full">
              <label className="form-label">Specific Address</label>
              <input
                type="text"
                name="address"
                className="input-field"
                placeholder="e.g., Barangay Hall, Mabini Street"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Schedule & Requirements Section */}
          <div className="form-section">
            <h2 className="form-section-heading">Schedule & Requirements</h2>

            <div className="form-group form-row-full">
              <label className="form-label">Distribution Date</label>
              <input
                type="date"
                name="schedule"
                className="input-field"
                value={formData.schedule}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group form-row-full">
              <label className="form-label">Requirements</label>
              <textarea
                name="requirements"
                className="input-field textarea-field"
                placeholder="List required documents (e.g., Valid ID, Proof of Residency, Birth Certificate)"
                value={formData.requirements}
                onChange={handleChange}
                disabled={loading}
              />
              <div className="form-label-hint">Separate each requirement on a new line</div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              <Plus size={20} />
              {loading ? 'Creating Program...' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminCreateAyuda;
