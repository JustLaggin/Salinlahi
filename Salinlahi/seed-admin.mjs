import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVovfvqIEKxdRtKbIvHBsZcca90N7qPFY",
  authDomain: "salinlahi-f291b.firebaseapp.com",
  projectId: "salinlahi-f291b",
  storageBucket: "salinlahi-f291b.firebasestorage.app",
  messagingSenderId: "1015743670459",
  appId: "1:1015743670459:web:1901640d2129fdd242619e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  const email = "admin@salinlahi.gov.ph";
  const password = "AdminPassword123!";

  try {
    console.log(`Attempting to create admin account: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    await setDoc(doc(db, "users", userId), {
      first_name: "System",
      last_name: "Administrator",
      email: email,
      role: "admin",
      createdAt: new Date().toISOString()
    });

    console.log("✅ Admin account successfully created!");
    console.log("Email: " + email);
    console.log("Password: " + password);
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("✅ Admin account already exists!");
      console.log("Email: " + email);
      console.log("Password: " + password);
      process.exit(0);
    } else {
      console.error("Error creating admin account:", error);
      process.exit(1);
    }
  }
}

createAdmin();
