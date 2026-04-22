import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getDocs, query, updateDoc, where, collection } from "firebase/firestore";
import { auth, db } from "../firebase";
import { normalizeCitizenCodeInput } from "../utils/citizenCode";
import { generateUniqueCitizenCode } from "../utils/citizenCode";

const AuthContext = createContext(null);
const CITIZEN_SESSION_KEY = "citizen_session_uid";

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

  const applyCitizenSession = useCallback(async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) throw new Error("Citizen account not found.");
    const data = snap.data();
    const r = normalizeRole(data.role);
    if (r !== "citizen") throw new Error("Only citizen accounts can use citizen login.");
    setFirebaseUser({ uid, isCitizenSession: true });
    setProfile(data);
    setRole("citizen");
  }, []);

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
        const citizenUid = localStorage.getItem(CITIZEN_SESSION_KEY);
        if (citizenUid) {
          try {
            await applyCitizenSession(citizenUid);
            setLoading(false);
            return;
          } catch (err) {
            console.error(err);
            localStorage.removeItem(CITIZEN_SESSION_KEY);
          }
        }
        setFirebaseUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }
      localStorage.removeItem(CITIZEN_SESSION_KEY);
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

  const loginCitizenByCode = useCallback(
    async (rawCode) => {
      const code = normalizeCitizenCodeInput(rawCode);
      if (!code) throw new Error("Citizen code is required.");
      const snap = await getDocs(
        query(collection(db, "users"), where("citizenCode", "==", code))
      );
      if (snap.empty) throw new Error("Citizen code not found.");
      const citizenDoc = snap.docs[0];
      const citizenData = citizenDoc.data();
      if (normalizeRole(citizenData.role) !== "citizen") {
        throw new Error("Citizen login is only for citizen accounts.");
      }
      localStorage.setItem(CITIZEN_SESSION_KEY, citizenDoc.id);
      await applyCitizenSession(citizenDoc.id);
    },
    [applyCitizenSession]
  );

  const logout = useCallback(async () => {
    localStorage.removeItem(CITIZEN_SESSION_KEY);
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    } finally {
      setFirebaseUser(null);
      setProfile(null);
      setRole(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      role,
      loading,
      loginCitizenByCode,
      logout,
      isCitizen: role === "citizen",
      isStaff: role === "staff",
      isAdmin: role === "admin",
      isStaffOrAdmin: role === "staff" || role === "admin",
    }),
    [firebaseUser, profile, role, loading, loginCitizenByCode, logout]
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
