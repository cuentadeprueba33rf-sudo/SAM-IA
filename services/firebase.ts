import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";

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
export const db = getFirestore(app);
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

// --- Broadcast System ---

export interface GlobalMessage {
    id?: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent' | 'success';
    timestamp: any;
    authorEmail?: string;
}

export const sendGlobalAnnouncement = async (title: string, message: string, type: GlobalMessage['type'], authorEmail: string) => {
    try {
        await addDoc(collection(db, "announcements"), {
            title,
            message,
            type,
            timestamp: serverTimestamp(),
            authorEmail
        });
        return true;
    } catch (e) {
        console.error("Error sending announcement:", e);
        throw e;
    }
};

export const subscribeToAnnouncements = (callback: (message: GlobalMessage) => void) => {
    const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"), limit(1));
    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                // Only trigger if the message is recent (e.g., within last 5 minutes) to avoid showing old alerts on refresh
                // However, for simplicity in this demo, we show the latest.
                // In prod, compare serverTimestamp with local time.
                callback({ id: change.doc.id, ...data } as GlobalMessage);
            }
        });
    });
};