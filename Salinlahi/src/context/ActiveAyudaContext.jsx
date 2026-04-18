import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const STORAGE_ID = "salinlahi_activeAyudaId";
const STORAGE_TITLE = "salinlahi_activeAyudaTitle";

const ActiveAyudaContext = createContext(null);

export function ActiveAyudaProvider({ children }) {
  const [activeAyudaId, setActiveAyudaIdState] = useState(() =>
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(STORAGE_ID) || ""
      : ""
  );
  const [activeAyudaTitle, setActiveAyudaTitleState] = useState(() =>
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(STORAGE_TITLE) || ""
      : ""
  );

  const setActiveAyuda = useCallback((id, title = "") => {
    const sid = id || "";
    const st = title || "";
    setActiveAyudaIdState(sid);
    setActiveAyudaTitleState(st);
    if (typeof sessionStorage !== "undefined") {
      if (sid) {
        sessionStorage.setItem(STORAGE_ID, sid);
        sessionStorage.setItem(STORAGE_TITLE, st);
      } else {
        sessionStorage.removeItem(STORAGE_ID);
        sessionStorage.removeItem(STORAGE_TITLE);
      }
    }
  }, []);

  const clearActiveAyuda = useCallback(() => setActiveAyuda("", ""), [setActiveAyuda]);

  const value = useMemo(
    () => ({
      activeAyudaId: activeAyudaId || null,
      activeAyudaTitle: activeAyudaTitle || "",
      setActiveAyuda,
      clearActiveAyuda,
    }),
    [activeAyudaId, activeAyudaTitle, setActiveAyuda, clearActiveAyuda]
  );

  return (
    <ActiveAyudaContext.Provider value={value}>
      {children}
    </ActiveAyudaContext.Provider>
  );
}

export function useActiveAyuda() {
  const ctx = useContext(ActiveAyudaContext);
  if (!ctx) throw new Error("useActiveAyuda must be used within ActiveAyudaProvider");
  return ctx;
}
