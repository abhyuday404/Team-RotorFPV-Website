import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdOYIx-dW51-jEbtVZ48t42W12iBF5Ryc",
  authDomain: "teamrotor-fpv-website.firebaseapp.com",
  projectId: "teamrotor-fpv-website",
  storageBucket: "teamrotor-fpv-website.firebasestorage.app",
  messagingSenderId: "361893112217",
  appId: "1:361893112217:web:601660130f5f20c18a0b08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
