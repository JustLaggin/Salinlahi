import { useEffect, useState } from "react";
import { Package, MapPin, Calendar, Info } from "lucide-react";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, query, where } from "firebase/firestore";
import { db } from "../firebase";

function AdminCurrentAyuda() {
  const [ayudas, setAyudas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalList, setModalList] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  const [updateModal, setUpdateModal] = useState(false);
  const [selectedAyuda, setSelectedAyuda] = useState(null);

  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAyudas = async () => {
      const querySnapshot = await getDocs(collection(db, "ayudas"));

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAyudas(data);
    };

    fetchAyudas();
  }, []);

  const approveApplicant = async (applicant) => {
  if (!selectedAyuda) return;
  const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

  await updateDoc(ayudaRef, {
    applicants: arrayRemove(applicant),
    beneficiaries: arrayUnion(applicant)
  });

  // Update user document
  const userQuery = query(collection(db, "users"), where("uuid", "==", applicant));
  const userSnap = await getDocs(userQuery);
  if (userSnap.docs.length > 0) {
    const userDoc = userSnap.docs[0];
    const userRef = doc(db, "users", userDoc.id);
    await updateDoc(userRef, {
      "ayudas_applied": arrayRemove(selectedAyuda.id),
      "ayudas_beneficiary": arrayUnion(selectedAyuda.id)
    });
  }

  setModalList(prev => prev.filter(a => a !== applicant));
};

  const rejectApplicant = async (applicant) => {
  if (!selectedAyuda) return;
  const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

  await updateDoc(ayudaRef, {
    applicants: arrayRemove(applicant)
  });

  setModalList(prev => prev.filter(a => a !== applicant));
};
  const openListModal = (title, list, ayuda) => {
    setModalTitle(title);
    setModalList(list || []);
    setSelectedAyuda(ayuda);
    setModalOpen(true);
  };

  const openUpdateModal = (ayuda) => {
    setSelectedAyuda(ayuda);
    setFormData(ayuda);
    setUpdateModal(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const saveUpdate = async () => {
    const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

    await updateDoc(ayudaRef, {
      title: formData.title,
      description: formData.description,
      amount: Number(formData.amount),
      address: formData.address,
      barangay: formData.barangay,
      city: formData.city,
      requirements: formData.requirements,
      schedule: formData.schedule
    });

    setUpdateModal(false);

    // refresh data
    const querySnapshot = await getDocs(collection(db, "ayudas"));
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setAyudas(data);
  };

  return (
    <div className="app-container">
      <div className="search-container">
        <input 
          className="input-field" 
          type="text" 
          placeholder="🔍 Search Ayudas by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />
      </div>
      <div className="admin-grid">
        {ayudas.filter(ayuda => 
          ayuda.title.toLowerCase().includes(searchTerm)
        ).map((ayuda) => (
        <div key={ayuda.id} className="base-card">
          <h3 className="auth-title">{ayuda.title}</h3>

          <div className="detail-row">
            <div className="detail-icon"><Package size={24} /></div>
            <div className="detail-content">
              <h4>Amount</h4>
              <p>₱{ayuda.amount?.toLocaleString()}</p>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><MapPin size={24} /></div>
            <div className="detail-content">
              <h4>Location</h4>
              <p>{ayuda.barangay}, {ayuda.city}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{ayuda.address || "N/A"}</p>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><Calendar size={24} /></div>
            <div className="detail-content">
              <h4>Schedule</h4>
              <p>{ayuda.schedule || "Not specified"}</p>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><Info size={24} /></div>
            <div className="detail-content">
              <h4>Requirements</h4>
              <p>{ayuda.requirements || "None"}</p>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><Package size={24} /></div>
            <div className="detail-content">
              <h4>Description</h4>
              <p>{ayuda.description}</p>
            </div>
          </div>

          <div className="button-group">
            <button className="admin-btn" onClick={() => openListModal("Applicants", ayuda.applicants, ayuda)}>
              Applicants ({ayuda.applicants?.length || 0})
            </button>

            <button className="admin-btn" onClick={() => openListModal("Beneficiaries", ayuda.beneficiaries, ayuda)}>
              Beneficiaries ({ayuda.beneficiaries?.length || 0})
            </button>

            <button className="admin-btn update-btn" onClick={() => openUpdateModal(ayuda)}>
              Update
            </button>
          </div>
        </div>
      ))}

      {/* LIST MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="base-card modal-card">
            <h2 className="auth-title">{modalTitle}</h2>

            {modalList.length === 0 ? (
              <p className="settings-text">No data found</p>
            ) : (
              modalList.map((item, index) => (
                <div key={index} className="modal-list-row">
                  <span>{item}</span>

                  {modalTitle === "Applicants" && (
                    <div className="row-buttons">
                      <button className="approve-btn" onClick={() => approveApplicant(item)}>
                        Approve
                      </button>

                      <button className="reject-btn" onClick={() => rejectApplicant(item)}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            <button className="auth-button close-btn" onClick={() => setModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {updateModal && (
        <div className="modal-overlay">
          <div className="base-card modal-card">
            <h2 className="auth-title">Update Ayuda</h2>

            <div className="input-group">
              <label>Title</label>
              <input className="input-field" name="title" value={formData.title || ""} onChange={handleChange}/>
            </div>

            <div className="input-group">
              <label>Description</label>
              <input className="input-field" name="description" value={formData.description || ""} onChange={handleChange}/>
            </div>

            <div className="input-group">
              <label>Amount (₱)</label>
              <input className="input-field" type="number" name="amount" value={formData.amount || ""} onChange={handleChange}/>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Barangay</label>
                <input className="input-field" name="barangay" value={formData.barangay || ""} onChange={handleChange}/>
              </div>

              <div className="input-group">
                <label>City</label>
                <input className="input-field" name="city" value={formData.city || ""} onChange={handleChange}/>
              </div>
            </div>

            <div className="input-group">
              <label>Address</label>
              <input className="input-field" name="address" value={formData.address || ""} onChange={handleChange}/>
            </div>

            <div className="input-group">
              <label>Requirements</label>
              <input className="input-field" name="requirements" value={formData.requirements || ""} onChange={handleChange}/>
            </div>

            <div className="input-group">
              <label>Schedule</label>
              <input className="input-field" type="date" name="schedule" value={formData.schedule || ""} onChange={handleChange}/>
            </div>

            <div className="button-group">
              <button className="auth-button" onClick={saveUpdate}>
                Save
              </button>
              <button className="auth-button close-btn" onClick={() => setUpdateModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default AdminCurrentAyuda;
