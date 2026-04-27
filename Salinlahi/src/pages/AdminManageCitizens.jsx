import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { BadgeCheck, UserPlus } from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { generateUniqueCitizenCode } from "../utils/citizenCode";
import Papa from "papaparse";

const initialForm = {
  first_name: "",
  last_name: "",
  middle_name: "",
  birth_date: "",
  contact_number: "",
  address_line: "",
  barangay: "",
  city: "",
  province: "",
};

function formatBirthdateMMDDYYYY(value) {
  if (!value) return "-";
  // Common formats in this app: "YYYY-MM-DD" or a Date-like string.
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [y, m, d] = String(value).split("-");
    return `${m}/${d}/${y}`;
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = String(dt.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

function normalizePhone11(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits;
}

function AdminManageCitizens() {
  const { firebaseUser, role } = useAuth();
  const isAdmin = role === "admin";
  const csvInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [editingCitizen, setEditingCitizen] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [citizenToDelete, setCitizenToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCitizens = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => (u.role || "citizen") === "citizen");
      data.sort((a, b) => {
        const at = a.created_at?.seconds || 0;
        const bt = b.created_at?.seconds || 0;
        return bt - at;
      });
      setCitizens(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load verified citizens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCitizens();
  }, [fetchCitizens]);

  const filteredCitizens = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return citizens;
    return citizens.filter((c) => {
      const name =
        `${c.first_name || ""} ${c.middle_name || ""} ${c.last_name || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        String(c.address_line || "").toLowerCase().includes(q) ||
        String(c.barangay || "").toLowerCase().includes(q) ||
        String(c.city || "").toLowerCase().includes(q) ||
        String(c.province || "").toLowerCase().includes(q) ||
        String(c.contact_number || "").toLowerCase().includes(q)
      );
    });
  }, [citizens, searchTerm]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "contact_number") {
      setForm((prev) => ({ ...prev, [name]: normalizePhone11(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const normalizeRow = (row) => ({
    first_name: String(row.first_name || row.FirstName || row["First Name"] || "").trim(),
    last_name: String(row.last_name || row.LastName || row["Last Name"] || "").trim(),
    middle_name: String(row.middle_name || row.MiddleName || row["Middle Name"] || "").trim(),
    birth_date: String(row.birth_date || row.BirthDate || row["Birth Date"] || "").trim(),
    contact_number: normalizePhone11(
      row.contact_number || row.ContactNumber || row["Contact Number"] || ""
    ).trim(),
    address_line: String(
      row.address_line || row.AddressLine || row["Address Line"] || row.Address || ""
    ).trim(),
    barangay: String(row.barangay || row.Barangay || "").trim(),
    city: String(row.city || row.City || "").trim(),
    province: String(row.province || row.Province || "").trim(),
  });

  const isValidCitizenRow = (row) =>
    row.first_name &&
    row.last_name &&
    row.birth_date &&
    row.contact_number &&
    /^\d{11}$/.test(String(row.contact_number || "")) &&
    row.address_line &&
    row.barangay &&
    row.city &&
    row.province;

  const submitCitizen = async (e) => {
    e.preventDefault();
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.birth_date ||
      !form.contact_number.trim() ||
      !form.address_line.trim() ||
      !form.barangay.trim() ||
      !form.city.trim() ||
      !form.province.trim()
    ) {
      setError("Please complete all fields.");
      return;
    }
    
    const normContact = normalizePhone11(form.contact_number);
    if (!/^\d{11}$/.test(normContact)) {
      setError("Contact number must be exactly 11 digits (numbers only).");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const citizenCode = await generateUniqueCitizenCode(db);
      await addDoc(collection(db, "users"), {
        uuid: uuidv4(),
        citizenCode,
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        last_name: form.last_name.trim(),
        birth_date: form.birth_date,
        contact_number: normContact,
        address_line: form.address_line.trim(),
        barangay: form.barangay.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        role: "citizen",
        ayudas_applied: [],
        ayudas_beneficiary: [],
        ayudas_received: [],
        claim_history: [],
        created_by: firebaseUser?.uid || null,
        created_at: serverTimestamp(),
      });
      setForm(initialForm);
      setNotice("Citizen added to users successfully.");
      await fetchCitizens();
    } catch (e2) {
      console.error(e2);
      setError("Could not save citizen to users.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditChange = (e) => {
    setEditingCitizen((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitEditCitizen = async (e) => {
    e.preventDefault();
    if (!editingCitizen) return;

    setIsUpdating(true);
    setError("");
    setNotice("");
    try {
      const updateData = {
        first_name: editingCitizen.first_name.trim(),
        middle_name: editingCitizen.middle_name.trim(),
        last_name: editingCitizen.last_name.trim(),
        birth_date: editingCitizen.birth_date,
        contact_number: editingCitizen.contact_number.trim(),
        address_line: editingCitizen.address_line.trim(),
        barangay: editingCitizen.barangay.trim(),
        city: editingCitizen.city.trim(),
        province: editingCitizen.province.trim(),
      };
      
      await updateDoc(doc(db, "users", editingCitizen.id), updateData);
      setNotice("Citizen updated successfully.");
      setEditingCitizen(null);
      await fetchCitizens();
    } catch (err) {
      console.error(err);
      setError("Failed to update citizen.");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCitizenAccount = async () => {
    if (!citizenToDelete) return;
    setIsDeleting(true);
    setError("");
    setNotice("");
    try {
      await deleteDoc(doc(db, "users", citizenToDelete.id));
      setNotice(`Citizen ${citizenToDelete.first_name} deleted successfully.`);
      setCitizenToDelete(null);
      await fetchCitizens();
    } catch (err) {
      console.error(err);
      setError("Failed to delete citizen.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openCsvPicker = () => {
    csvInputRef.current?.click();
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUploading(true);
    setError("");
    setNotice("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedRows = Array.isArray(results.data) ? results.data : [];
          const normalized = parsedRows.map(normalizeRow).filter(isValidCitizenRow);

          if (normalized.length === 0) {
            setError(
              "No valid rows found. Check CSV headers and required fields."
            );
            return;
          }

          for (const row of normalized) {
            const citizenCode = await generateUniqueCitizenCode(db);
            await addDoc(collection(db, "users"), {
              uuid: uuidv4(),
              citizenCode,
              first_name: row.first_name,
              middle_name: row.middle_name,
              last_name: row.last_name,
              birth_date: row.birth_date,
              contact_number: row.contact_number,
              address_line: row.address_line,
              barangay: row.barangay,
              city: row.city,
              province: row.province,
              role: "citizen",
              ayudas_applied: [],
              ayudas_beneficiary: [],
              ayudas_received: [],
              claim_history: [],
              created_by: firebaseUser?.uid || null,
              created_at: serverTimestamp(),
            });
          }

          setNotice(
            `CSV upload complete: ${normalized.length} citizen records added.`
          );
          await fetchCitizens();
        } catch (err) {
          console.error(err);
          setError("CSV upload failed while saving records.");
        } finally {
          setBulkUploading(false);
          e.target.value = "";
        }
      },
      error: (err) => {
        console.error(err);
        setError("Could not parse CSV file.");
        setBulkUploading(false);
        e.target.value = "";
      },
    });
  };

  return (
    <div className="admin-citizens-page">
      <div className="base-card">
        <h1 className="auth-title" style={{ textAlign: "left", marginBottom: "0.5rem" }}>
          Manage Citizens
        </h1>
        <p className="settings-text">
          Kapitan can manually add citizen records directly to the users database.
        </p>

        <div className="admin-citizens-upload-row">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="action-btn"
            onClick={openCsvPicker}
            disabled={bulkUploading}
          >
            {bulkUploading ? "Uploading CSV..." : "CSV Bulk Upload"}
          </button>
          <p className="settings-text">
            Upload CSV exported from Excel with the app-required columns.
          </p>
        </div>

        <form onSubmit={submitCitizen} className="admin-citizens-form">
          <div className="input-row">
            <div className="input-group">
              <label>First Name</label>
              <input
                className="input-field"
                name="first_name"
                value={form.first_name}
                onChange={onChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input
                className="input-field"
                name="last_name"
                value={form.last_name}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Middle Name (Optional)</label>
              <input
                className="input-field"
                name="middle_name"
                value={form.middle_name}
                onChange={onChange}
              />
            </div>
            <div className="input-group">
              <label>Birth Date</label>
              <input
                className="input-field"
                name="birth_date"
                type="date"
                value={form.birth_date}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Contact Number</label>
              <input
                className="input-field"
                name="contact_number"
                value={form.contact_number}
                onChange={onChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Street Address</label>
              <input
                className="input-field"
                name="address_line"
                value={form.address_line}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Barangay</label>
              <input
                className="input-field"
                name="barangay"
                value={form.barangay}
                onChange={onChange}
                required
              />
            </div>
            <div className="input-group">
              <label>City</label>
              <input
                className="input-field"
                name="city"
                value={form.city}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Province</label>
              <input
                className="input-field"
                name="province"
                value={form.province}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="admin-citizens-actions">
            <button type="submit" className="auth-button" disabled={submitting}>
              <UserPlus size={18} />
              {submitting ? "Saving..." : "Add Citizen"}
            </button>
          </div>
        </form>

        {error && <p className="admin-staff-feedback admin-staff-feedback--error">{error}</p>}
        {notice && (
          <p className="admin-staff-feedback admin-staff-feedback--success">{notice}</p>
        )}
      </div>

      <div className="base-card">
        <div className="admin-citizens-list-head">
          <h2 className="admin-citizens-list-title">
            <BadgeCheck size={18} />
            Citizens in Users DB
          </h2>
          <input
            className="input-field admin-citizens-search"
            type="text"
            placeholder="Search name, contact, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="data-table-container" style={{ marginBottom: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Citizen Code</th>
                <th>Name</th>
                <th>Birth Date</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                    Loading records...
                  </td>
                </tr>
              )}
              {!loading && filteredCitizens.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                    No citizen records found.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredCitizens.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: "bold", background: "var(--input-bg)", padding: "0.25rem 0.5rem", borderRadius: "6px", letterSpacing: "1px" }}>
                        {c.citizenCode || "-"}
                      </span>
                    </td>
                    <td>
                      <div className="data-table__title">
                        {`${c.first_name || ""} ${c.middle_name || ""} ${c.last_name || ""}`
                          .replace(/\s+/g, " ")
                          .trim() || "Unnamed"}
                      </div>
                    </td>
                    <td>{formatBirthdateMMDDYYYY(c.birth_date)}</td>
                    <td>{c.contact_number || "-"}</td>
                    <td>
                      <div className="data-table__loc-main">{c.address_line || "-"}</div>
                      <div className="data-table__loc-sub">
                        {[c.barangay, c.city, c.province].filter(Boolean).join(", ") || "-"}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-btn"
                          style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                          onClick={() => { setEditingCitizen(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            onClick={() => setCitizenToDelete(c)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingCitizen && createPortal(
        <div className="modal-overlay modal-overlay--padded modal-overlay--scroll-follow">
          <div className="base-card modal-panel" style={{ padding: "2.5rem" }}>
            <h2 className="auth-title" style={{ textAlign: "left", marginBottom: "1rem" }}>
              Edit Citizen
            </h2>
            <form onSubmit={submitEditCitizen} className="admin-citizens-form">
              <div className="input-row">
                <div className="input-group">
                  <label>First Name</label>
                  <input
                    className="input-field"
                    name="first_name"
                    value={editingCitizen.first_name || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input
                    className="input-field"
                    name="last_name"
                    value={editingCitizen.last_name || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Middle Name</label>
                  <input
                    className="input-field"
                    name="middle_name"
                    value={editingCitizen.middle_name || ""}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="input-group">
                  <label>Birth Date</label>
                  <input
                    className="input-field"
                    name="birth_date"
                    type="date"
                    value={editingCitizen.birth_date || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Contact Number</label>
                  <input
                    className="input-field"
                    name="contact_number"
                    value={editingCitizen.contact_number || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Street Address</label>
                  <input
                    className="input-field"
                    name="address_line"
                    value={editingCitizen.address_line || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Barangay</label>
                  <input
                    className="input-field"
                    name="barangay"
                    value={editingCitizen.barangay || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>City</label>
                  <input
                    className="input-field"
                    name="city"
                    value={editingCitizen.city || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Province</label>
                  <input
                    className="input-field"
                    name="province"
                    value={editingCitizen.province || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                <button 
                  type="button"
                  className="auth-button" 
                  style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                  onClick={() => setEditingCitizen(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="auth-button" 
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {citizenToDelete && createPortal(
        <div className="modal-overlay modal-overlay--padded modal-overlay--scroll-follow">
          <div className="base-card modal-panel" style={{ textAlign: "center", padding: "2.5rem" }}>
            <h2 className="auth-title" style={{ color: "#ef4444", marginBottom: "1rem" }}>
              Delete Citizen Record
            </h2>
            <p className="settings-text" style={{ marginBottom: "1.5rem", fontSize: "1.1rem" }}>
              Are you sure you want to permanently delete the citizen record for <strong>{citizenToDelete.first_name} {citizenToDelete.last_name}</strong>?<br/>
              This will also remove their Ayuda history. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button 
                className="auth-button" 
                style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                onClick={() => setCitizenToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="auth-button" 
                style={{ background: "#ef4444" }}
                onClick={deleteCitizenAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminManageCitizens;
