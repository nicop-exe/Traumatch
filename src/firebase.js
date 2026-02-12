import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDYGVS3agiO0z_2nyNGmgdzbNUP9fqt2wk",
    authDomain: "traumatch-f9171.firebaseapp.com",
    projectId: "traumatch-f9171",
    storageBucket: "traumatch-f9171.firebasestorage.app",
    messagingSenderId: "591979432657",
    appId: "1:591979432657:web:80693a12a52ee2408c0282",
    measurementId: "G-GMDD94XG97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
