// Import the functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword }from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// ===================================================================
// Your Firebase configuration
// ===================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDRJfTsMnF7gaPxSafDJTteyCv6OpfJPDQ",
  authDomain: "rey-user.firebaseapp.com",
  projectId: "rey-user",
  storageBucket: "rey-user.firebasestorage.app",
  messagingSenderId: "533121443541",
  appId: "1:533121443541:web:29b493b6d953f2ee66e45c"
};
// ===================================================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Login ---
const btnLogin = document.getElementById("btn-login");
btnLogin.addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    console.log("Login button clicked. Attempting to sign in..."); // <-- ADD THIS

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login SUCCESSFUL. Redirecting to profile.html..."); // <-- ADD 
            
            window.location.href = "home.html"; 
            
        })
        .catch((error) => {
            console.error("Login FAILED:", error.message); // <-- ADD THIS
            alert("Login failed: " + error.message);
        });
});