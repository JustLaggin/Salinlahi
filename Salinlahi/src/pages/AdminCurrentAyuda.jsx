import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Users2, UserCheck2 } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useActiveAyuda } from "../context/ActiveAyudaContext";
import AyudaDetailContent from "../components/AyudaDetailContent";

const formatTime = (time24) => {
  if (!time24) return "";
  const [hour, min] = time24.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedH = h % 12 || 12;
  return `${formattedH}:${min} ${ampm}`;
};

function useWideLayout() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.innerWidth > 1024
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1025px)");
    const fn = () => setWide(mq.matches);
    mq.addEventListener("change", fn);
    fn();
    return () => mq.removeEventListener("change", fn);
  }, []);
  return wide;
}

function AdminCurrentAyuda() {
  const navigate = useNavigate();
  const { isAdmin, isStaff, isStaffOrAdmin } = useAuth();
  const { setActiveAyuda } = useActiveAyuda();
  const wide = useWideLayout();

  const [ayudas, setAyudas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalList, setModalList] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  const [updateModal, setUpdateModal] = useState(false);
  const [selectedAyuda, setSelectedAyuda] = useState(null);

  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [panelAyudaId, setPanelAyudaId] = useState(null);

  const fetchAyudas = useCallback(async () => {
    const querySnapshot = await getDocs(collection(db, "ayudas"));
    const data = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setAyudas(data);
  }, []);

  useEffect(() => {
    void fetchAyudas();
  }, [fetchAyudas]);

  useEffect(() => {
    if (!wide) setPanelAyudaId(null);
  }, [wide]);

  const approveApplicant = async (applicantObj) => {
    if (!selectedAyuda || !applicantObj.uuid) return;
    const applicantId = applicantObj.uuid;
    const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

    try {
      await updateDoc(ayudaRef, {
        applicants: arrayRemove(applicantId),
        beneficiaries: arrayUnion(applicantId),
      });
    } catch (err) {
      console.error(err);
      alert(
        "Could not approve this applicant. Check your connection and Firestore permissions."
      );
      return;
    }

    try {
      const userRef = doc(db, "users", applicantId);
      await updateDoc(userRef, {
        ayudas_applied: arrayRemove(selectedAyuda.id),
        ayudas_beneficiary: arrayUnion(selectedAyuda.id),
      });
    } catch (err) {
      console.error(err);
    }

    setModalList((prev) => prev.filter((a) => a.uuid !== applicantId));
    await fetchAyudas();
  };

  const rejectApplicant = async (applicantObj) => {
    if (!selectedAyuda || !applicantObj.uuid) return;
    const applicantId = applicantObj.uuid;
    const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

    try {
      await updateDoc(ayudaRef, {
        applicants: arrayRemove(applicantId),
      });
    } catch (err) {
      console.error(err);
      alert(
        "Could not reject this applicant. Check your connection and Firestore permissions."
      );
      return;
    }

    try {
      const userRef = doc(db, "users", applicantId);
      await updateDoc(userRef, {
        ayudas_applied: arrayRemove(selectedAyuda.id),
      });
    } catch (err) {
      console.error(err);
    }

    setModalList((prev) => prev.filter((a) => a.uuid !== applicantId));
    await fetchAyudas();
  };

  const openListModal = async (title, list, ayuda) => {
    setModalTitle(title);
    setSelectedAyuda(ayuda);
    setModalOpen(true);

    const applicantObjects = [];
    for (const applicantId of list || []) {
      try {
        const userDoc = await getDoc(doc(db, "users", applicantId));
        let displayName = applicantId;
        if (userDoc.exists()) {
          const userData = userDoc.data();
          displayName =
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
            applicantId;
        }
        applicantObjects.push({ uuid: applicantId, displayName });
      } catch {
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
      [e.target.name]: e.target.value,
    });
  };

  const saveUpdate = async () => {
    const ayudaRef = doc(db, "ayudas", selectedAyuda.id);

    await updateDoc(ayudaRef, {
      title: formData.title,
      description: formData.description,
      amount: Number(formData.amount),
      programType: formData.programType || "ONE_TIME",
      aidKind:
        (formData.programType || "ONE_TIME") === "ONE_TIME"
          ? formData.aidKind || "RELIEF_GOODS"
          : null,
      requiredDays:
        (formData.programType || "ONE_TIME") === "SERVICE"
          ? Math.max(1, Number(formData.requiredDays || 1))
          : null,
      address: formData.address,
      barangay: formData.barangay,
      city: formData.city,
      requirements: formData.requirements,
      schedule: formData.schedule,
      timeStart: formData.timeStart || "",
      timeEnd: formData.timeEnd || "",
    });

    setUpdateModal(false);
    await fetchAyudas();
  };

  const deleteAyuda = async (ayudaId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this Ayuda? This action cannot be undone."
      )
    ) {
      try {
        await deleteDoc(doc(db, "ayudas", ayudaId));
        setAyudas((prev) => prev.filter((a) => a.id !== ayudaId));
        if (panelAyudaId === ayudaId) setPanelAyudaId(null);
      } catch (err) {
        console.error("Error deleting Ayuda:", err);
        alert("Failed to delete Ayuda.");
      }
    }
  };

  const goClaiming = (ayuda) => {
    setActiveAyuda(ayuda.id, ayuda.title || "");
    navigate(isAdmin ? "/admin/scan" : "/staff/scan");
  };

  const filtered = ayudas.filter((ayuda) =>
    String(ayuda.title || "")
      .toLowerCase()
      .includes(searchTerm)
  );

  return (
    <div
      className={`admin-current-ayuda-root ${
        wide && panelAyudaId ? "admin-current-ayuda-root--split" : ""
      }`}
      style={{ paddingBottom: "2rem" }}
    >
      <div className="admin-current-ayuda-main">
        <div style={{ marginBottom: "2.5rem" }}>
          <h1
            className="auth-title"
            style={{ textAlign: "left", marginBottom: "0.5rem" }}
          >
            Active Ayuda
          </h1>
          <p className="settings-text" style={{ textAlign: "left" }}>
            {isAdmin
              ? "Manage distributions, update details, or accept and reject applicants."
              : isStaff
                ? "View ongoing events, accept or reject applicants, and set the active event for scanning."
                : "View ongoing events, open details, and set the active event for scanning."}
          </p>
        </div>

        <div
          className="search-container ayuda-search-bar"
          style={{ maxWidth: "640px", margin: "0 0 2rem 0" }}
        >
          <input
            className="input-field"
            type="text"
            placeholder="Search by title…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>

        <div className="data-table-container data-table-container--ayuda">
          <table className="data-table data-table--ayuda">
            <thead>
              <tr>
                <th>Event</th>
                <th>Location</th>
                <th>People</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && ayudas.length > 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                    No ayudas match your search.
                  </td>
                </tr>
              )}
              {filtered.map((ayuda) => (
                <tr
                  key={ayuda.id}
                  className={
                    panelAyudaId === ayuda.id ? "data-table__row--active" : ""
                  }
                >
                  <td>
                    {wide ? (
                      <button
                        type="button"
                        className="data-table__title-hit"
                        onClick={() => setPanelAyudaId(ayuda.id)}
                        title="Show in side panel"
                      >
                        <div className="data-table__title">{ayuda.title}</div>
                        <div className="data-table__sub">
                          {ayuda.schedule || "TBA"}
                          {ayuda.timeStart && ayuda.timeEnd
                            ? ` · ${formatTime(ayuda.timeStart)} → ${formatTime(
                                ayuda.timeEnd
                              )}`
                            : ""}
                          {" · ₱"}
                          {ayuda.amount?.toLocaleString?.() ?? ayuda.amount}
                        </div>
                      </button>
                    ) : (
                      <div className="data-table__title-block">
                        <div className="data-table__title">{ayuda.title}</div>
                        <div className="data-table__sub">
                          {ayuda.schedule || "TBA"}
                          {ayuda.timeStart && ayuda.timeEnd
                            ? ` · ${formatTime(ayuda.timeStart)} → ${formatTime(
                                ayuda.timeEnd
                              )}`
                            : ""}
                          {" · ₱"}
                          {ayuda.amount?.toLocaleString?.() ?? ayuda.amount}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="data-table__loc-main">
                      {ayuda.barangay}, {ayuda.city}
                    </div>
                    <div className="data-table__loc-sub">
                      {ayuda.address || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div className="ayuda-people-actions">
                      <button
                        type="button"
                        className="ayuda-people-btn"
                        onClick={() =>
                          openListModal("Applicants", ayuda.applicants, ayuda)
                        }
                        aria-label="View applicants list"
                      >
                        <span className="ayuda-people-btn__title">
                          <Users2 size={15} />
                          Applicants
                        </span>
                        <span className="ayuda-people-btn__meta">
                          {ayuda.applicants?.length || 0} records
                        </span>
                      </button>
                      <button
                        type="button"
                        className="ayuda-people-btn ayuda-people-btn--green"
                        onClick={() =>
                          openListModal("Beneficiaries", ayuda.beneficiaries, ayuda)
                        }
                        aria-label="View beneficiaries list"
                      >
                        <span className="ayuda-people-btn__title">
                          <UserCheck2 size={15} />
                          Beneficiaries
                        </span>
                        <span className="ayuda-people-btn__meta">
                          {ayuda.beneficiaries?.length || 0} records
                        </span>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions table-actions--stack">
                      <Link
                        className="action-btn"
                        to={isAdmin ? `/admin/ayuda/${ayuda.id}` : `/staff/ayuda/${ayuda.id}`}
                      >
                        Details
                      </Link>
                      {isAdmin && (
                        <button
                          type="button"
                          className="action-btn btn-update"
                          onClick={() => openUpdateModal(ayuda)}
                        >
                          Update
                        </button>
                      )}
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => goClaiming(ayuda)}
                      >
                        Scan / claim
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className="action-btn action-btn--danger"
                          onClick={() => deleteAyuda(ayuda.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {ayudas.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                    No ayudas found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {wide && panelAyudaId && (
        <aside className="admin-current-ayuda-panel">
          <div className="admin-current-ayuda-panel__head">
            <h2 className="auth-title" style={{ fontSize: "1rem", margin: 0 }}>
              Ayuda details
            </h2>
            <button
              type="button"
              className="action-btn"
              onClick={() => setPanelAyudaId(null)}
            >
              Close
            </button>
          </div>
          <AyudaDetailContent
            ayudaId={panelAyudaId}
            readOnly={!isStaffOrAdmin}
            embedded
            onDataChange={fetchAyudas}
          />
        </aside>
      )}

      {modalOpen &&
        createPortal(
          <div className="modal-overlay">
            <div className="base-card modal-panel">
              <h2 className="auth-title">{modalTitle}</h2>

              {modalList.length === 0 ? (
                <p className="settings-text">No data found</p>
              ) : (
                modalList.map((item, index) => {
                  const showApplicantActions =
                    modalTitle === "Applicants" && isStaffOrAdmin;
                  return (
                  <div
                    key={index}
                    className={`modal-list-row${
                      !showApplicantActions ? " modal-list-row--interactive" : ""
                    }`}
                  >
                    <span>{item.displayName}</span>

                    {showApplicantActions && (
                      <div className="row-buttons">
                        <button
                          type="button"
                          className="approve-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            void approveApplicant(item);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="reject-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Reject ${item.displayName}? They will be removed from applicants for this Ayuda.`
                              )
                            ) {
                              void rejectApplicant(item);
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })
              )}

              <button
                type="button"
                className="auth-button close-btn"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}

      {updateModal &&
        isAdmin &&
        createPortal(
          <div className="modal-overlay">
            <div className="base-card modal-panel">
              <h2 className="auth-title">Update Ayuda</h2>

              <div className="input-group">
                <label>Title</label>
                <input
                  className="input-field"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Description</label>
                <input
                  className="input-field"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Amount (₱)</label>
                <input
                  className="input-field"
                  type="number"
                  name="amount"
                  value={formData.amount || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Program Type</label>
                <select
                  className="input-field"
                  name="programType"
                  value={formData.programType || "ONE_TIME"}
                  onChange={handleChange}
                >
                  <option value="ONE_TIME">ONE_TIME</option>
                  <option value="SERVICE">SERVICE</option>
                </select>
              </div>

              {(formData.programType || "ONE_TIME") === "ONE_TIME" ? (
                <div className="input-group">
                  <label>Aid Selection</label>
                  <select
                    className="input-field"
                    name="aidKind"
                    value={formData.aidKind || "RELIEF_GOODS"}
                    onChange={handleChange}
                  >
                    <option value="RELIEF_GOODS">Relief Goods</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              ) : (
                <div className="input-group">
                  <label>Required Days (Attendance)</label>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    name="requiredDays"
                    value={formData.requiredDays || ""}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="input-row">
                <div className="input-group">
                  <label>Barangay</label>
                  <input
                    className="input-field"
                    name="barangay"
                    value={formData.barangay || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>City</label>
                  <input
                    className="input-field"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Designation Point (Location)</label>
                <input
                  className="input-field"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Requirements</label>
                <input
                  className="input-field"
                  name="requirements"
                  value={formData.requirements || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Schedule (Date)</label>
                  <input
                    className="input-field"
                    type="date"
                    name="schedule"
                    value={formData.schedule || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>Time Start</label>
                  <input
                    className="input-field"
                    type="time"
                    name="timeStart"
                    value={formData.timeStart || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>Time End</label>
                  <input
                    className="input-field"
                    type="time"
                    name="timeEnd"
                    value={formData.timeEnd || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="button-group">
                <button type="button" className="auth-button" onClick={saveUpdate}>
                  Save
                </button>
                <button
                  type="button"
                  className="auth-button close-btn"
                  onClick={() => setUpdateModal(false)}
                >
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
