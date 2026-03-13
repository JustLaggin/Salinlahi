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
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {ayudas.map((ayuda) => (
          <div key={ayuda.id} className="base-card" style={styles.card}>
            <div className="soft-white-glow" style={styles.title}>{ayuda.title}</div>

            <div style={styles.text}><span style={styles.label}>Description:</span> {ayuda.description}</div>
            <div style={styles.text}><span style={styles.label}>Amount:</span> ₱{ayuda.amount}</div>
            <div style={styles.text}><span style={styles.label}>Location:</span> {ayuda.barangay}, {ayuda.city}</div>
            <div style={styles.text}><span style={styles.label}>Address:</span> {ayuda.address || "N/A"}</div>
            <div style={styles.text}><span style={styles.label}>Requirements:</span> {ayuda.requirements || "None"}</div>
            <div style={styles.text}><span style={styles.label}>Schedule:</span> {ayuda.schedule || "Not specified"}</div>

            <div style={styles.buttonContainer}>
              <button
                style={styles.buttonBlue}
                onClick={() => openListModal("Applicants", ayuda.applicants)}
              >
                Applicants
              </button>

              <button
                style={styles.buttonGreen}
                onClick={() => openListModal("Beneficiaries", ayuda.beneficiaries)}
              >
                Beneficiaries
              </button>

              <button
                style={styles.buttonOrange}
                onClick={() => openUpdateModal(ayuda)}
              >
                Update
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* LIST MODAL */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div className="base-card" style={styles.modal}>
            <h2 className="soft-white-glow" style={{margin: "0 0 15px 0"}}>{modalTitle}</h2>

            {modalList.length === 0 ? (
              <p style={{color: "var(--color-text-muted)"}}>No data found</p>
            ) : (
              <div style={styles.modalScrollList}>
                {modalList.map((item, index) => (
                  <div key={index} style={styles.listRow}>
                    <span style={{wordBreak: "break-all", fontSize: "0.9rem"}}>{item}</span>

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
                ))}
              </div>
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
          <div className="base-card" style={styles.modal}>
            <h2 className="soft-white-glow" style={{margin: "0 0 15px 0"}}>Update Ayuda</h2>

            <div style={styles.modalScrollList}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Title</label>
                <input style={styles.input} name="title" value={formData.title || ""} onChange={handleChange}/>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Description</label>
                <textarea style={{...styles.input, resize: "vertical"}} name="description" value={formData.description || ""} onChange={handleChange}/>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Amount</label>
                <input style={styles.input} type="number" name="amount" value={formData.amount || ""} onChange={handleChange}/>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Address</label>
                <input style={styles.input} name="address" value={formData.address || ""} onChange={handleChange}/>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Barangay</label>
                <input style={styles.input} name="barangay" value={formData.barangay || ""} onChange={handleChange}/>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>City</label>
                <input style={styles.input} name="city" value={formData.city || ""} onChange={handleChange}/>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Requirements</label>
                <input style={styles.input} name="requirements" value={formData.requirements || ""} onChange={handleChange}/>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Schedule</label>
                <input style={styles.input} type="date" name="schedule" value={formData.schedule || ""} onChange={handleChange}/>
              </div>
            </div>

            <div style={{marginTop:"15px", display: "flex", gap: "10px", flexDirection: "column"}}>
              <button onClick={saveUpdate} style={styles.gradientButton}>Save Changes</button>
              <button onClick={() => setUpdateModal(false)} style={styles.closeBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  pageWrapper: {
    padding: "40px 20px",
    display: "flex",
    justifyContent: "center",
    minHeight: "80vh"
  },

  container: {
    width: "100%",
    maxWidth: "1200px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "25px",
    alignItems: "start"
  },

  card: {
    padding: "25px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    margin: "0" // Override base-card mb
  },

  title: {
    fontSize: "1.4rem",
    marginBottom: "5px",
  },

  label: {
    color: "var(--color-text-muted)",
    fontWeight: "normal"
  },

  text: {
    fontSize: "0.95rem",
    color: "var(--color-text-main)",
    lineHeight: "1.4"
  },

  buttonContainer: {
    marginTop: "auto",
    paddingTop: "15px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  buttonBlue: {
    flex: "1 1 auto",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    background: "var(--color-primary-blue)",
    color: "#0B1121",
    fontWeight: "bold",
    cursor: "pointer",
  },

  buttonGreen: {
    flex: "1 1 auto",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    background: "var(--color-primary-green)",
    color: "#0B1121",
    fontWeight: "bold",
    cursor: "pointer",
  },

  buttonOrange: {
    flex: "1 1 auto",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    background: "#f59e0b", // Amber/Orange
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },

  modal: {
    width: "90%",
    maxWidth: "450px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    padding: "30px",
    margin: 0
  },
  
  modalScrollList: {
    overflowY: "auto",
    maxHeight: "60vh",
    paddingRight: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    gap: "10px"
  },

  rowButtons: {
    display: "flex",
    gap: "6px"
  },

  approveBtn: {
    background: "var(--color-primary-green)",
    color: "#0B1121",
    fontWeight: "bold",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem"
  },

  rejectBtn: {
    background: "#dc2626",
    color: "white",
    fontWeight: "bold",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem"
  },

  closeBtn: {
    width: "100%",
    padding: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "var(--color-text-main)",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
    fontWeight: "500"
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },

  inputLabel: {
    fontSize: "0.85rem",
    color: "var(--color-text-muted)"
  },
  
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "var(--color-text-main)",
    fontSize: "0.95rem",
    outline: "none",
  },
  
  gradientButton: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(to right, var(--color-primary-blue), var(--color-primary-green))",
    color: "#0B1121",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "10px",
  }
};

export default AdminCurrentAyuda;