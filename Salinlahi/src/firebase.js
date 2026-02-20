import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVovfvqIEKxdRtKbIvHBsZcca90N7qPFY",
  authDomain: "salinlahi-f291b.firebaseapp.com",
  projectId: "salinlahi-f291b",
  storageBucket: "salinlahi-f291b.firebasestorage.app",
  messagingSenderId: "1015743670459",
  appId: "1:1015743670459:web:1901640d2129fdd242619e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);