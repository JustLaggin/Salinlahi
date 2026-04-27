import { useEffect, useState } from "react";
import { Package, MapPin, CalendarDays, Info, UserPlus, ScanLine, ClipboardList, Users, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where } from "firebase/firestore";
import { db } from "../firebase";

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
  const [focusedCardId, setFocusedCardId] = useState(null);

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

  const filteredAyudas = ayudas.filter((ayuda) =>
    ayuda.title.toLowerCase().includes(searchTerm)
  );
  const layoutMode =
    filteredAyudas.length <= 1 ? "hero" : filteredAyudas.length === 2 ? "duo" : "stack";

  return (
    <div className="app-container">
      <div className="search-command-wrap">
        <div className="search-command-shell">
          <Search size={18} />
          <input
            className="input-field search-command-input"
            type="text"
            placeholder="Search ayudas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>
      </div>
      <div className={`admin-ayuda-stack admin-ayuda-stack-${layoutMode}`}>
        {filteredAyudas.map((ayuda, index) => (
        <div
          key={ayuda.id}
          className={`base-card admin-ayuda-item ${focusedCardId === ayuda.id ? "is-focused" : ""}`}
          data-focused={focusedCardId && focusedCardId !== ayuda.id ? "dim" : "normal"}
          style={{ "--card-index": index }}
          onMouseEnter={() => setFocusedCardId(ayuda.id)}
          onMouseLeave={() => setFocusedCardId(null)}
          onTouchStart={() => setFocusedCardId(ayuda.id)}
          onTouchEnd={() => setFocusedCardId(null)}
        >
          {/* Primary row: title + status for consistent scan pattern */}
          <div className="admin-ayuda-primary-row">
            <div className="admin-ayuda-title-wrap">
              <h3 className="admin-ayuda-title">{ayuda.title || "Untitled Program"}</h3>
              <p className="admin-ayuda-subtext">{ayuda.description || "No description provided"}</p>
            </div>
            <span className="badge badge-info admin-ayuda-badge">Program</span>
          </div>

          {/* Secondary row: structured chips for core fields */}
          <div className="admin-ayuda-secondary-row">
            <div className="admin-ayuda-meta-chip">
              <ClipboardList size={14} />
              <span className="admin-ayuda-meta-label">Program ID</span>
              <span className="admin-ayuda-meta-value admin-ayuda-meta-mono">{ayuda.id}</span>
            </div>
            <div className="admin-ayuda-meta-chip">
              <Package size={14} />
              <span className="admin-ayuda-meta-label">Amount</span>
              <span className="admin-ayuda-meta-value admin-ayuda-meta-mono">₱{ayuda.amount?.toLocaleString() || "0"}</span>
            </div>
            <div className="admin-ayuda-meta-chip">
              <MapPin size={14} />
              <span className="admin-ayuda-meta-label">Location</span>
              <span className="admin-ayuda-meta-value">{ayuda.barangay}, {ayuda.city}</span>
            </div>
          </div>

          {/* Metadata row: low-emphasis operational attributes */}
          <div className="admin-ayuda-meta-row">
            <div className="admin-ayuda-meta-inline">
              <CalendarDays size={14} />
              <span className="admin-ayuda-meta-inline-label">Schedule</span>
              <span className="admin-ayuda-meta-inline-value">{ayuda.schedule || "Not specified"}</span>
            </div>
            <div className="admin-ayuda-meta-inline">
              <Users size={14} />
              <span className="admin-ayuda-meta-inline-label">Applicants</span>
              <span className="admin-ayuda-meta-inline-value admin-ayuda-meta-mono">{ayuda.applicants?.length || 0}</span>
            </div>
            <div className="admin-ayuda-meta-inline">
              <Users size={14} />
              <span className="admin-ayuda-meta-inline-label">Beneficiaries</span>
              <span className="admin-ayuda-meta-inline-value admin-ayuda-meta-mono">{ayuda.beneficiaries?.length || 0}</span>
            </div>
          </div>

          <div className="admin-ayuda-requirements">
            <p className="admin-ayuda-requirements-label">
              <Info size={14} />
              Requirements
            </p>
            <p className="admin-ayuda-requirements-text">{ayuda.requirements || "None"}</p>
            <p className="admin-ayuda-requirements-text admin-ayuda-address">{ayuda.address || "No address specified"}</p>
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
            <button className="admin-btn" onClick={() => navigate(`/admin/scan?mode=add-applicant&ayudaId=${ayuda.id}`)}>
              <UserPlus size={16} />
              Add via QR
            </button>
            <button className="admin-btn" onClick={() => navigate(`/admin/scan?mode=claiming&ayudaId=${ayuda.id}`)}>
              <ScanLine size={16} />
              Claiming Scanner
            </button>
          </div>
        </div>
      ))}
      {filteredAyudas.length === 0 && (
        <div className="admin-empty-state">
          <Package size={44} />
          <h3>No ayudas found</h3>
          <p>Try a different search term or create a new ayuda program.</p>
        </div>
      )}

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
