import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, } from "firebase/firestore";
import { db } from "../firebase";

function AdminCurrentAyuda() {
  const [ayudas, setAyudas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalList, setModalList] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  const [updateModal, setUpdateModal] = useState(false);
  const [selectedAyuda, setSelectedAyuda] = useState(null);

  const [formData, setFormData] = useState({});

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
  const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

  await updateDoc(ayudaRef, {
    applicants: arrayRemove(applicant),
    beneficiaries: arrayUnion(applicant)
  });

  setModalList(prev => prev.filter(a => a !== applicant));
};

  const rejectApplicant = async (applicant) => {
  const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

  await updateDoc(ayudaRef, {
    applicants: arrayRemove(applicant)
  });

  setModalList(prev => prev.filter(a => a !== applicant));
};
  const openListModal = (title, list) => {
    setModalTitle(title);
    setModalList(list || []);
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
    <div style={styles.container}>
      {ayudas.map((ayuda) => (
        <div key={ayuda.id} style={styles.card}>
          <div style={styles.title}>{ayuda.title}</div>

          <div style={styles.text}><b>Description:</b> {ayuda.description}</div>
          <div style={styles.text}><b>Amount:</b> {ayuda.amount}</div>
          <div style={styles.text}><b>Location:</b> {ayuda.barangay}, {ayuda.city}</div>
          <div style={styles.text}><b>Address:</b> {ayuda.address || "N/A"}</div>
          <div style={styles.text}><b>Requirements:</b> {ayuda.requirements || "None"}</div>
          <div style={styles.text}><b>Schedule:</b> {ayuda.schedule || "Not specified"}</div>

          <div style={styles.buttonContainer}>
            <button
              style={styles.button}
              onClick={() => openListModal("Applicants", ayuda.applicants)}
            >
              Applicants
            </button>

            <button
              style={styles.button}
              onClick={() => openListModal("Beneficiaries", ayuda.beneficiaries)}
            >
              Beneficiaries
            </button>

            <button
              style={styles.updateButton}
              onClick={() => openUpdateModal(ayuda)}
            >
              Update
            </button>
          </div>
        </div>
      ))}

      {/* LIST MODAL */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>{modalTitle}</h2>

            {modalList.length === 0 ? (
  <p>No data found</p>
) : (
  modalList.map((item, index) => (
    <div key={index} style={styles.listRow}>
      <span>{item}</span>

      {modalTitle === "Applicants" && (
        <div style={styles.rowButtons}>
          <button
            style={styles.approveBtn}
            onClick={() => approveApplicant(item)}
          >
            Approve
          </button>

          <button
            style={styles.rejectBtn}
            onClick={() => rejectApplicant(item)}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  ))
)}

            <button onClick={() => setModalOpen(false)} style={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {updateModal && (
        <div style={styles.modalOverlay}>
    <div style={styles.modal}>
      <h2>Update Ayuda</h2>

      <div style={styles.inputGroup}>
        <label>Title</label>
        <input name="title" value={formData.title || ""} onChange={handleChange}/>
      </div>

      <div style={styles.inputGroup}>
        <label>Description</label>
        <input name="description" value={formData.description || ""} onChange={handleChange}/>
      </div>

      <div style={styles.inputGroup}>
        <label>Amount</label>
        <input name="amount" value={formData.amount || ""} onChange={handleChange}/>
      </div>

      <div style={styles.inputGroup}>
        <label>Address</label>
        <input name="address" value={formData.address || ""} onChange={handleChange}/>
      </div>

      <div style={styles.inputGroup}>
        <label>Barangay</label>
        <input name="barangay" value={formData.barangay || ""} onChange={handleChange}/>
      </div>

      <div style={styles.inputGroup}>
        <label>City</label>
        <input name="city" value={formData.city || ""} onChange={handleChange}/>
      </div>

      <div style={styles.inputGroup}>
        <label>Requirements</label>
        <input name="requirements" value={formData.requirements || ""} onChange={handleChange}/>
      </div>

      <div style={styles.inputGroup}>
        <label>Schedule</label>
        <input name="schedule" value={formData.schedule || ""} onChange={handleChange}/>
      </div>

      <div style={{marginTop:"10px"}}>
        <button onClick={saveUpdate} style={styles.button}>Save</button>
        <button onClick={() => setUpdateModal(false)} style={styles.closeBtn}>Cancel</button>
      </div>
    </div>
  </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "25px",
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    width: "200px",
    position: "center",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  title: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },

  text: {
    fontSize: "14px",
    marginBottom: "6px",
  },

  buttonContainer: {
    marginTop: "15px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  button: {
    padding: "8px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#2b7cff",
    color: "white",
    cursor: "pointer",
  },

  updateButton: {
    padding: "8px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#f59e0b",
    color: "white",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    top:0,
    left:0,
    width:"100%",
    height:"100%",
    background:"rgba(0,0,0,0.5)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
  },

  modal: {
    background:"white",
    padding:"25px",
    borderRadius:"10px",
    width:"350px",
    display:"flex",
    flexDirection:"column",
    gap:"8px"
  },

  listItem:{
    padding:"5px",
    borderBottom:"1px solid #ddd"
  },

  closeBtn:{
    marginTop:"10px",
    padding:"8px",
    border:"none",
    background:"#888",
    color:"white",
    borderRadius:"6px",
    cursor:"pointer"
  },

  inputGroup:{
  display:"flex",
  flexDirection:"column",
  marginBottom:"8px"
},

listRow:{
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  padding:"6px",
  borderBottom:"1px solid #ddd"
},

rowButtons:{
  display:"flex",
  gap:"5px"
},

approveBtn:{
  background:"#16a34a",
  color:"white",
  border:"none",
  padding:"4px 6px",
  borderRadius:"4px",
  cursor:"pointer"
},

rejectBtn:{
  background:"#dc2626",
  color:"white",
  border:"none",
  padding:"4px 6px",
  borderRadius:"4px",
  cursor:"pointer"
}
};

export default AdminCurrentAyuda;