import { collection, getDocs, query, where } from "firebase/firestore";

/** Uppercase alphanumerics without 0, O, 1, I, L for readability */
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function randomCitizenCode(length = 6) {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return s;
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {number} [length]
 * @returns {Promise<string>}
 */
export async function generateUniqueCitizenCode(db, length = 6) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const code = randomCitizenCode(length);
    const snap = await getDocs(
      query(collection(db, "users"), where("citizenCode", "==", code))
    );
    if (snap.empty) return code;
  }
  throw new Error("Could not generate a unique citizen code");
}

export function normalizeCitizenCodeInput(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
}
