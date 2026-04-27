import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { collection, doc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { ShieldCheck, Shield, Trash2, Search } from "lucide-react";
import { db } from "../firebase";

function normalizeRole(raw) {
  if (raw === "super_admin" || raw === "admin" || raw === "staff" || raw === "citizen") return raw;
  if (raw === "user") return "citizen";
  return "citizen";
}

function prettyRole(role) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "staff") return "Staff";
  return "Citizen";
}

export default function SuperAdminStaffAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmPromote, setConfirmPromote] = useState(null);
  const [confirmDemote, setConfirmDemote] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs
        .map((d) => {
          const u = d.data();
          return {
            id: d.id,
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            email: u.email || "",
            role: normalizeRole(u.role),
            barangay: u.barangay || "",
            city: u.city || "",
            province: u.province || "",
          };
        })
        .filter((u) => u.role === "staff" || u.role === "admin" || u.role === "super_admin");

      data.sort((a, b) => {
        const roleOrder = { super_admin: 0, admin: 1, staff: 2 };
        const rDiff = (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9);
        if (rDiff !== 0) return rDiff;
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
      });
      setUsers(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load staff/admin users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u.first_name} ${u.last_name}`.toLowerCase();
      const loc = `${u.barangay} ${u.city} ${u.province}`.toLowerCase();
      return (
        name.includes(q) ||
        String(u.email).toLowerCase().includes(q) ||
        String(u.role).toLowerCase().includes(q) ||
        loc.includes(q)
      );
    });
  }, [users, searchTerm]);

  const promoteToAdmin = async (user) => {
    if (!user || user.role !== "staff") return;
    setConfirmPromote(null);
    setBusyId(user.id);
    setError("");
    setNotice("");
    try {
      await updateDoc(doc(db, "users", user.id), { role: "admin" });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: "admin" } : u)));
      setNotice(`${user.first_name} promoted to Admin.`);
    } catch (e) {
      console.error(e);
      setError("Failed to promote user.");
    } finally {
      setBusyId(null);
    }
  };

  const demoteToStaff = async (user) => {
    if (!user || user.role !== "admin") return;
    setConfirmDemote(null);
    setBusyId(user.id);
    setError("");
    setNotice("");
    try {
      await updateDoc(doc(db, "users", user.id), { role: "staff" });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: "staff" } : u)));
      setNotice(`${user.first_name} demoted to Staff.`);
    } catch (e) {
      console.error(e);
      setError("Failed to demote user.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteUserDoc = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setBusyId(target.id);
    setError("");
    setNotice("");
    try {
      await deleteDoc(doc(db, "users", target.id));
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setNotice(`Deleted ${target.first_name} ${target.last_name}.`);
      setConfirmDelete(null);
    } catch (e) {
      console.error(e);
      setError("Failed to delete user record.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-staff-page">
      <div className="base-card">
        <h1 className="auth-title" style={{ textAlign: "left", marginBottom: "0.5rem" }}>
          Super Admin
        </h1>
        <p className="settings-text">
          Promote/demote staff accounts and delete staff/admin records.
        </p>

        <div className="search-container ayuda-search-bar" style={{ maxWidth: "640px", marginTop: "1rem" }}>
          <div className="admin-staff-search">
            <Search size={16} />
            <input
              className="input-field"
              type="text"
              placeholder="Search name, email, role, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="admin-staff-feedback admin-staff-feedback--error">{error}</p>}
        {notice && <p className="admin-staff-feedback admin-staff-feedback--success">{notice}</p>}
      </div>

      <div className="data-table-container" style={{ marginTop: "1.5rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                  Loading users...
                </td>
              </tr>
            )}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                  No users found.
                </td>
              </tr>
            )}
            {!loading &&
              filteredUsers.map((u) => {
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} style={u.role === "super_admin" ? { opacity: 0.7 } : undefined}>
                    <td>
                      <div className="data-table__title">
                        {`${u.first_name} ${u.last_name}`.trim() || "Unnamed"}
                      </div>
                    </td>
                    <td>{u.email || "No email"}</td>
                    <td>
                      <div className="data-table__loc-main">{u.barangay || "—"}</div>
                      <div className="data-table__loc-sub">
                        {[u.city, u.province].filter(Boolean).join(", ") || "—"}
                      </div>
                    </td>
                    <td>
                      <span className={`pill-badge ${u.role === "admin" || u.role === "super_admin" ? "green" : "blue"}`}>
                        {prettyRole(u.role)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ flexWrap: "wrap" }}>
                        {u.role === "staff" && (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => setConfirmPromote(u)}
                            disabled={busy}
                            title="Promote to Admin"
                          >
                            <ShieldCheck size={14} /> Promote
                          </button>
                        )}
                        {u.role === "admin" && (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => setConfirmDemote(u)}
                            disabled={busy}
                            title="Demote to Staff"
                          >
                            <Shield size={14} /> Demote
                          </button>
                        )}
                        {u.role !== "super_admin" && (
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            onClick={() => setConfirmDelete(u)}
                            disabled={busy}
                            title="Delete user doc"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {confirmDelete && createPortal(
        <div className="modal-overlay modal-overlay--padded modal-overlay--scroll-follow">
          <div className="base-card modal-panel" style={{ textAlign: "center", padding: "2.5rem" }}>
            <h2 className="auth-title" style={{ color: "#ef4444", marginBottom: "1rem" }}>
              Delete Account Record
            </h2>
            <p className="settings-text" style={{ marginBottom: "1.5rem", fontSize: "1.05rem" }}>
              Delete user record for <strong>{confirmDelete.first_name} {confirmDelete.last_name}</strong>?
              This removes the Firestore user document (not the Firebase Auth account).
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="auth-button"
                style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                onClick={() => setConfirmDelete(null)}
                disabled={busyId === confirmDelete.id}
              >
                Cancel
              </button>
              <button
                className="auth-button"
                style={{ background: "#ef4444" }}
                onClick={() => void deleteUserDoc()}
                disabled={busyId === confirmDelete.id}
              >
                {busyId === confirmDelete.id ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmPromote && createPortal(
        <div className="modal-overlay modal-overlay--padded modal-overlay--scroll-follow">
          <div className="base-card modal-panel" style={{ textAlign: "center", padding: "2.5rem", maxWidth: "520px" }}>
            <h2 className="auth-title" style={{ marginBottom: "1rem" }}>
              Promote to Admin?
            </h2>
            <p className="settings-text" style={{ marginBottom: "1.5rem", fontSize: "1.05rem" }}>
              Promote <strong>{confirmPromote.first_name} {confirmPromote.last_name}</strong> from Staff to Admin?
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="auth-button"
                style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                onClick={() => setConfirmPromote(null)}
                disabled={busyId === confirmPromote.id}
              >
                Cancel
              </button>
              <button
                className="auth-button"
                onClick={() => void promoteToAdmin(confirmPromote)}
                disabled={busyId === confirmPromote.id}
              >
                {busyId === confirmPromote.id ? "Promoting..." : "Confirm Promote"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmDemote && createPortal(
        <div className="modal-overlay modal-overlay--padded modal-overlay--scroll-follow">
          <div className="base-card modal-panel" style={{ textAlign: "center", padding: "2.5rem", maxWidth: "520px" }}>
            <h2 className="auth-title" style={{ marginBottom: "1rem" }}>
              Demote to Staff?
            </h2>
            <p className="settings-text" style={{ marginBottom: "1.5rem", fontSize: "1.05rem" }}>
              Demote <strong>{confirmDemote.first_name} {confirmDemote.last_name}</strong> from Admin to Staff?
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="auth-button"
                style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                onClick={() => setConfirmDemote(null)}
                disabled={busyId === confirmDemote.id}
              >
                Cancel
              </button>
              <button
                className="auth-button"
                onClick={() => void demoteToStaff(confirmDemote)}
                disabled={busyId === confirmDemote.id}
              >
                {busyId === confirmDemote.id ? "Demoting..." : "Confirm Demote"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

