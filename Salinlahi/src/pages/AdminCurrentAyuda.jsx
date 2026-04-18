import { useEffect, useState } from "react";
import { Package, MapPin, Calendar, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where } from "firebase/firestore";
import { db } from "../firebase";
import ConfirmDialog from "../components/ConfirmDialog";

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
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "warning"
  });

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
    setConfirmDialog({
      isOpen: true,
      title: "Approve Applicant",
      message: `Are you sure you want to approve ${applicantObj.displayName} for ${selectedAyuda.title}? This will move them to beneficiaries.`,
      onConfirm: () => performApprove(applicantObj),
      type: "warning"
    });
  };

  const performApprove = async (applicantObj) => {
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
    setConfirmDialog({ isOpen: false });
  };

  const rejectApplicant = async (applicantObj) => {
    setConfirmDialog({
      isOpen: true,
      title: "Reject Applicant",
      message: `Are you sure you want to reject ${applicantObj.displayName} from ${selectedAyuda.title}? This action cannot be undone.`,
      onConfirm: () => performReject(applicantObj),
      type: "danger"
    });
  };

  const performReject = async (applicantObj) => {
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
    setConfirmDialog({ isOpen: false });
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
      status: formData.status
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
        <select 
          className="input-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{marginTop: '1rem'}}
        >
          <option value="ALL">All Status</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="admin-grid">
        {ayudas.filter(ayuda => 
          ayuda.title.toLowerCase().includes(searchTerm) &&
          (statusFilter === "ALL" || ayuda.status === statusFilter)
        ).map((ayuda) => (
        <div key={ayuda.id} className="base-card">
          <div className="ayuda-header">
            <h3 className="auth-title">{ayuda.title}</h3>
            <span className={`status-badge status-${ayuda.status?.toLowerCase() || 'ongoing'}`}>
              {ayuda.status || 'ONGOING'}
            </span>
          </div>

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
            <button className="admin-btn" onClick={() => navigate(`/admin/scan?mode=add-applicant&ayudaId=${ayuda.id}`)}>
              ➕ Add via QR
            </button>
            <button className="admin-btn" onClick={() => navigate(`/admin/scan?mode=claiming&ayudaId=${ayuda.id}`)}>
              🏷️ Claiming Scanner
            </button>
          </div>
        </div>
      ))}      </div>
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

            <div className="input-group">
              <label>Status</label>
              <select className="input-field" name="status" value={formData.status || "ONGOING"} onChange={handleChange}>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false })}
        type={confirmDialog.type}
      />
    </div>
  );
}

export default AdminCurrentAyuda;
