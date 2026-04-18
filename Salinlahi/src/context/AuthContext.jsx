import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { generateUniqueCitizenCode } from "../utils/citizenCode";

const AuthContext = createContext(null);

function normalizeRole(raw) {
  if (raw === "admin" || raw === "staff" || raw === "citizen") return raw;
  if (raw === "user") return "citizen";
  return "citizen";
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureCitizenCode = useCallback(async (uid, data) => {
    if (normalizeRole(data.role) !== "citizen") return;
    if (data.citizenCode) return;
    try {
      const code = await generateUniqueCitizenCode(db);
      await updateDoc(doc(db, "users", uid), { citizenCode: code });
      setProfile((p) => (p ? { ...p, citizenCode: code } : p));
    } catch (e) {
      console.error("ensureCitizenCode:", e);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }
      setFirebaseUser(user);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const r = normalizeRole(data.role);
          setProfile(data);
          setRole(r);
          await ensureCitizenCode(user.uid, { ...data, role: r });
        } else {
          setProfile(null);
          setRole(null);
        }
      } catch (e) {
        console.error(e);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [ensureCitizenCode]);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      role,
      loading,
      isCitizen: role === "citizen",
      isStaff: role === "staff",
      isAdmin: role === "admin",
      isStaffOrAdmin: role === "staff" || role === "admin",
    }),
    [firebaseUser, profile, role, loading]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
