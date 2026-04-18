import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Package, MapPin, Calendar, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, query, where } from "firebase/firestore";
import { db } from "../firebase";

const formatTime = (time24) => {
  if (!time24) return "";
  const [hour, min] = time24.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${formattedH}:${min} ${ampm}`;
};

function AdminCurrentAyuda() {
  const navigate = useNavigate();
  const [ayudas, setAyudas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
const [modalList, setModalList] = useState([]); // Will store [{displayName, uuid}]
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

  const approveApplicant = async (applicantObj) => {
  if (!selectedAyuda || !applicantObj.uuid) return;
  const applicantId = applicantObj.uuid;
  const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

  await updateDoc(ayudaRef, {
    applicants: arrayRemove(applicantId),
    beneficiaries: arrayUnion(applicantId)
  });

// Update user document - direct getDoc using uuid as doc ID (matching applicants array storage)
  try {
    const userRef = doc(db, "users", applicantId);
    await updateDoc(userRef, {
      ayudas_applied: arrayRemove(selectedAyuda.id),
      ayudas_beneficiary: arrayUnion(selectedAyuda.id)
    });
    console.log(`Direct updated user doc ${applicantId} for ayuda ${selectedAyuda.id}`);
  } catch (err) {
    console.error(`Direct update failed for user ${applicantId}:`, err);
  }

  setModalList(prev => prev.filter(a => a.uuid !== applicantId));
  
  // Refresh main list
  const querySnapshot = await getDocs(collection(db, "ayudas"));
  const data = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setAyudas(data);
};

  const rejectApplicant = async (applicantObj) => {
  if (!selectedAyuda || !applicantObj.uuid) return;
  const applicantId = applicantObj.uuid;
  const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

  await updateDoc(ayudaRef, {
    applicants: arrayRemove(applicantId)
  });

  setModalList(prev => prev.filter(a => a.uuid !== applicantId));
  
  // Refresh main list
  const querySnapshot = await getDocs(collection(db, "ayudas"));
  const data = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setAyudas(data);
};
  const openListModal = async (title, list, ayuda) => {
    setModalTitle(title);
    setSelectedAyuda(ayuda);
    setModalOpen(true);
    
    // Load user names + UUIDs for applicant list
    const applicantObjects = [];
    for (const applicantId of list || []) {
      try {
        const userDoc = await getDoc(doc(db, 'users', applicantId));
        let displayName = applicantId;
        if (userDoc.exists()) {
          const userData = userDoc.data();
          displayName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || applicantId;
        }
        applicantObjects.push({ uuid: applicantId, displayName });
      } catch (err) {
        applicantObjects.push({ uuid: applicantId, displayName: applicantId });
      }
    }
    setModalList(applicantObjects);
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
      schedule: formData.schedule,
      timeStart: formData.timeStart || "",
      timeEnd: formData.timeEnd || ""
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

  const deleteAyuda = async (ayudaId) => {
    if (window.confirm("Are you sure you want to delete this Ayuda? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "ayudas", ayudaId));
        setAyudas(prev => prev.filter(a => a.id !== ayudaId));
      } catch (err) {
        console.error("Error deleting Ayuda:", err);
        alert("Failed to delete Ayuda.");
      }
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 className="auth-title" style={{ textAlign: "left", marginBottom: "0.5rem" }}>Current Ayudas</h1>
        <p className="settings-text" style={{ textAlign: "left" }}>Manage existing distributions, update details, or approve applicants.</p>
      </div>

      <div className="search-container" style={{ maxWidth: '600px', margin: '0 0 2rem 0' }}>
        <input 
          className="input-field" 
          type="text" 
          placeholder="🔍 Search Ayudas by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title & Schedule</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ayudas.filter(ayuda => 
              ayuda.title.toLowerCase().includes(searchTerm)
            ).map((ayuda) => (
              <tr key={ayuda.id}>
                <td>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{ayuda.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    📅 {ayuda.schedule || "TBA"} 
                    {ayuda.timeStart && ayuda.timeEnd ? ` • ⏰ ${formatTime(ayuda.timeStart)} → ${formatTime(ayuda.timeEnd)}` : ""}
                    {' • ₱'}{ayuda.amount?.toLocaleString()}
                  </div>
                </td>
                <td>
                  <div>{ayuda.barangay}, {ayuda.city}</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    📍 {ayuda.address || "N/A"}
                  </div>
                </td>
                <td>
                  <span className="pill-badge" style={{ cursor: 'pointer' }} onClick={() => openListModal("Applicants", ayuda.applicants, ayuda)}>
                    App: {ayuda.applicants?.length || 0}
                  </span>
                  <span className="pill-badge green" style={{ cursor: 'pointer' }} onClick={() => openListModal("Beneficiaries", ayuda.beneficiaries, ayuda)}>
                    Ben: {ayuda.beneficiaries?.length || 0}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn btn-update" onClick={() => openUpdateModal(ayuda)}>
                      Update
                    </button>
                    <button className="action-btn" onClick={() => openListModal("Applicants", ayuda.applicants, ayuda)}>
                      👥 View Applicants
                    </button>
                    <button className="action-btn" onClick={() => navigate(`/admin/scan?mode=claiming&ayudaId=${ayuda.id}`)}>
                      🏷️ Claiming
                    </button>
                    <button className="action-btn" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => deleteAyuda(ayuda.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ayudas.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No ayudas found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LIST MODAL */}
      {modalOpen && createPortal(
        <div className="modal-overlay">
          <div className="base-card modal-panel">
            <h2 className="auth-title">{modalTitle}</h2>

            {modalList.length === 0 ? (
              <p className="settings-text">No data found</p>
            ) : (
              modalList.map((item, index) => (
                <div key={index} className="modal-list-row">
                  <span>{item.displayName}</span>

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
        </div>,
        document.body
      )}

      {/* UPDATE MODAL */}
      {updateModal && createPortal(
        <div className="modal-overlay">
          <div className="base-card modal-panel">
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
              <label>Designation Point (Location)</label>
              <input className="input-field" name="address" value={formData.address || ""} onChange={handleChange}/>
            </div>

            <div className="input-group">
              <label>Requirements</label>
              <input className="input-field" name="requirements" value={formData.requirements || ""} onChange={handleChange}/>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Schedule (Date)</label>
                <input className="input-field" type="date" name="schedule" value={formData.schedule || ""} onChange={handleChange}/>
              </div>

              <div className="input-group">
                <label>Time Start</label>
                <input className="input-field" type="time" name="timeStart" value={formData.timeStart || ""} onChange={handleChange}/>
              </div>

              <div className="input-group">
                <label>Time End</label>
                <input className="input-field" type="time" name="timeEnd" value={formData.timeEnd || ""} onChange={handleChange}/>
              </div>
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
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminCurrentAyuda;
