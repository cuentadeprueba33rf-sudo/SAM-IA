import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDeHUgCl3Iw7EKXz3miAKaBRcF_dQNoLPw",
  authDomain: "samia-76f47.firebaseapp.com",
  databaseURL: "https://samia-76f47-default-rtdb.firebaseio.com",
  projectId: "samia-76f47",
  storageBucket: "samia-76f47.firebasestorage.app",
  messagingSenderId: "861876890112",
  appId: "1:861876890112:web:229d18c32920adb36a46e5",
  measurementId: "G-78D8V2WHE1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

export { onAuthStateChanged };

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};