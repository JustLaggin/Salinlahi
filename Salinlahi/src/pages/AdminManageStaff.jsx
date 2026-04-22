import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { ShieldCheck, UserPlus, UserMinus, Search } from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function normalizeRole(raw) {
  if (raw === "admin" || raw === "staff" || raw === "citizen") return raw;
  if (raw === "user") return "citizen";
  return "citizen";
}

function prettyRole(role) {
  if (role === "admin") return "Admin";
  if (role === "staff") return "Staff";
  return "Citizen";
}

function AdminManageStaff() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((d) => {
        const u = d.data();
        return {
          id: d.id,
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          role: normalizeRole(u.role),
          city: u.city || "",
          barangay: u.barangay || "",
        };
      });

      data.sort((a, b) => {
        const roleOrder = { admin: 0, staff: 1, citizen: 2 };
        const rDiff = roleOrder[a.role] - roleOrder[b.role];
        if (rDiff !== 0) return rDiff;
        return `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`
        );
      });

      setUsers(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const staffCount = useMemo(
    () => users.filter((u) => u.role === "staff").length,
    [users]
  );
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      return (
        fullName.includes(q) ||
        String(u.email).toLowerCase().includes(q) ||
        String(u.role).toLowerCase().includes(q) ||
        String(u.city).toLowerCase().includes(q) ||
        String(u.barangay).toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm]);

  const updateUserRole = async (userId, nextRole) => {
    if (!userId || !nextRole) return;
    if (userId === firebaseUser?.uid && nextRole !== "admin") {
      setError("You cannot remove your own admin role.");
      return;
    }

    setSavingUserId(userId);
    setError("");
    setNotice("");

    try {
      await updateDoc(doc(db, "users", userId), { role: nextRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
      );
      setNotice(`Role updated to ${prettyRole(nextRole)}.`);
    } catch (e) {
      console.error(e);
      setError("Unable to update role. Check your permissions and try again.");
    } finally {
      setSavingUserId(null);
    }
  };

  const addStaffByEmail = async () => {
    const normalized = staffEmail.trim().toLowerCase();
    if (!normalized) {
      setError("Enter an email address.");
      return;
    }

    const user = users.find((u) => String(u.email).toLowerCase() === normalized);
    if (!user) {
      setError("No user account found with that email.");
      return;
    }
    if (user.role === "staff") {
      setNotice("This user is already staff.");
      setError("");
      return;
    }

    await updateUserRole(user.id, "staff");
    setStaffEmail("");
  };

  return (
    <div className="admin-staff-page">
      <div className="base-card">
        <h1 className="auth-title" style={{ textAlign: "left", marginBottom: "0.5rem" }}>
          Staff Management
        </h1>
        <p className="settings-text">
          Assign roles, promote users to staff, and remove staff access.
        </p>

        <div className="admin-staff-stats">
          <div className="admin-staff-stat-card">
            <ShieldCheck size={18} />
            <div>
              <p className="admin-staff-stat-card__label">Admins</p>
              <p className="admin-staff-stat-card__value">{adminCount}</p>
            </div>
          </div>
          <div className="admin-staff-stat-card">
            <UserPlus size={18} />
            <div>
              <p className="admin-staff-stat-card__label">Staff</p>
              <p className="admin-staff-stat-card__value">{staffCount}</p>
            </div>
          </div>
          <div className="admin-staff-stat-card">
            <UserMinus size={18} />
            <div>
              <p className="admin-staff-stat-card__label">Citizens</p>
              <p className="admin-staff-stat-card__value">
                {users.length - adminCount - staffCount}
              </p>
            </div>
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Promote user to staff by email</label>
            <input
              type="email"
              className="input-field"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="name@email.com"
            />
          </div>
          <div className="input-group admin-staff-add-btn-wrap">
            <label>&nbsp;</label>
            <button type="button" className="auth-button" onClick={addStaffByEmail}>
              Add Staff
            </button>
          </div>
        </div>

        {error && <p className="admin-staff-feedback admin-staff-feedback--error">{error}</p>}
        {notice && (
          <p className="admin-staff-feedback admin-staff-feedback--success">{notice}</p>
        )}
      </div>

      <div className="search-container ayuda-search-bar" style={{ maxWidth: "640px" }}>
        <div className="admin-staff-search">
          <Search size={16} />
          <input
            className="input-field"
            type="text"
            placeholder="Search by name, email, role, city, barangay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container">
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
              filteredUsers.map((user) => {
                const isMe = user.id === firebaseUser?.uid;
                const disabled = savingUserId === user.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="data-table__title">
                        {`${user.first_name} ${user.last_name}`.trim() || "Unnamed User"}
                      </div>
                    </td>
                    <td>{user.email || "No email"}</td>
                    <td>
                      <div className="data-table__loc-main">
                        {user.barangay || "Barangay N/A"}
                      </div>
                      <div className="data-table__loc-sub">{user.city || "City N/A"}</div>
                    </td>
                    <td>
                      <span
                        className={`pill-badge ${
                          user.role === "staff" || user.role === "admin" ? "green" : ""
                        }`}
                      >
                        {prettyRole(user.role)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <select
                          className="input-field admin-staff-role-select"
                          value={user.role}
                          disabled={disabled || isMe}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                        >
                          <option value="citizen">Citizen</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                        {user.role === "staff" && (
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            disabled={disabled}
                            onClick={() => updateUserRole(user.id, "citizen")}
                          >
                            Remove staff
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
    </div>
  );
}

export default AdminManageStaff;
