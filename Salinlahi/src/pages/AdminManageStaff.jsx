import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc, setDoc } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ShieldCheck, UserPlus, UserMinus, Search } from "lucide-react";
import { auth as defaultAuth, db } from "../firebase";
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

function generateRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
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
  const [newStaffFirstName, setNewStaffFirstName] = useState("");
  const [newStaffLastName, setNewStaffLastName] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [generatedStaffPassword, setGeneratedStaffPassword] = useState(null);

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

  const handleCreateStaff = async () => {
    const fName = newStaffFirstName.trim();
    const lName = newStaffLastName.trim();
    const email = staffEmail.trim().toLowerCase();

    if (!fName || !lName || !email) {
      setError("Please fill in all fields to create a staff member.");
      return;
    }

    setCreatingStaff(true);
    setError("");
    setNotice("");

    try {
      const apps = getApps();
      const secAppName = "SecondaryAuthApp";
      let secApp;
      if (apps.find((a) => a.name === secAppName)) {
        secApp = getApp(secAppName);
      } else {
        secApp = initializeApp(defaultAuth.app.options, secAppName);
      }
      const secondaryAuth = getAuth(secApp);

      const generatedPwd = generateRandomPassword();
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, generatedPwd);
      const newUserId = userCredential.user.uid;

      const newUserDoc = {
        first_name: fName,
        last_name: lName,
        email: email,
        role: "staff",
        requiresPasswordChange: true,
      };
      
      await setDoc(doc(db, "users", newUserId), newUserDoc);
      await signOut(secondaryAuth);

      setUsers((prev) => [...prev, { id: newUserId, ...newUserDoc }]);
      setGeneratedStaffPassword(generatedPwd);
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        setError("This email is already in use.");
      } else if (e.code === 'auth/invalid-email') {
        setError("Invalid email format.");
      } else {
        setError("Failed to create staff account. Please try again.");
      }
    } finally {
      setCreatingStaff(false);
    }
  };

  const closePasswordModal = () => {
    setGeneratedStaffPassword(null);
    setStaffEmail("");
    setNewStaffFirstName("");
    setNewStaffLastName("");
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

        <h3 className="settings-text" style={{ fontWeight: 600, marginTop: "1.5rem", color: "var(--text-primary)" }}>
          Create New Staff Account
        </h3>
        <div className="input-row" style={{ marginTop: "0.75rem" }}>
          <div className="input-group">
            <label>First Name</label>
            <input
              type="text"
              className="input-field"
              value={newStaffFirstName}
              onChange={(e) => setNewStaffFirstName(e.target.value)}
              placeholder="e.g. Juan"
            />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input
              type="text"
              className="input-field"
              value={newStaffLastName}
              onChange={(e) => setNewStaffLastName(e.target.value)}
              placeholder="e.g. Dela Cruz"
            />
          </div>
        </div>
        <div className="input-row">
          <div className="input-group">
            <label>Email Address</label>
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
            <button type="button" className="auth-button" onClick={handleCreateStaff} disabled={creatingStaff}>
              {creatingStaff ? "Creating..." : "Create Staff Account"}
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
      {generatedStaffPassword && (
        <div className="modal-overlay modal-overlay--padded">
          <div className="base-card modal-panel" style={{ textAlign: "center", padding: "2.5rem" }}>
            <h2 className="auth-title" style={{ color: "var(--color-primary-green)", marginBottom: "1rem" }}>
              ✅ Staff Account Created Successfully
            </h2>
            <p className="settings-text" style={{ marginBottom: "1.5rem", fontSize: "1.1rem" }}>
              Temporary Password:<br />
              <strong style={{ 
                display: "inline-block", 
                fontSize: "1.75rem", 
                color: "var(--text-primary)", 
                letterSpacing: "3px", 
                background: "var(--input-bg)", 
                padding: "0.75rem 1.5rem", 
                borderRadius: "12px",
                marginTop: "0.75rem",
                border: "1px solid var(--border-color)"
              }}>
                {generatedStaffPassword}
              </strong>
            </p>
            <p className="settings-text" style={{ color: "#ef4444", marginBottom: "2rem", fontWeight: "500", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "8px" }}>
              Please copy this password and give it to the staff member immediately. For security reasons, this password will not be shown again.
            </p>
            <button className="auth-button" onClick={closePasswordModal} style={{ width: "100%", maxWidth: "300px", margin: "0 auto" }}>
              Close & Clear Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManageStaff;
