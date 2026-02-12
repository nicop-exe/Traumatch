import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// You can find this in your Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "traumatch-project.firebaseapp.com",
    projectId: "traumatch-project",
    storageBucket: "traumatch-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
