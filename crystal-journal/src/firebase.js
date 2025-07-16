import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj7aO6OYaiud2mrCNxugHZLOG9Kl1zouk",
  authDomain: "crystal-website-8bc5a.firebaseapp.com",
  projectId: "crystal-website-8bc5a",
  storageBucket: "crystal-website-8bc5a.firebasestorage.app",
  messagingSenderId: "671739708349",
  appId: "1:671739708349:web:0de1e972cd1794ecc788d4",
  measurementId: "G-Q9XXW0S447"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const logout = () => {
  return signOut(auth);
};