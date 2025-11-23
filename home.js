// Import the functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
    // ...etc
};
// ===================================================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Page Protection and Role Check ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in, get their role from Firestore
        getUserRole(user.uid);
    } else {
        // User is not logged in, send them back to the login page
        window.location.href = "index.html";
    }
});

async function getUserRole(uid) {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;
        const name = userData.name;
        
        // Update the UI with user info
        document.getElementById("user-email").textContent = userData.email;
        document.getElementById("user-role").textContent = role;
        document.getElementById("user-name").textContent = name;
        
        // Show content based on role
        showContentBasedOnRole(role);

    } else {
        alert("Could not find user data. Logging out.");
        logout();
    }
}

function showContentBasedOnRole(role) {
    // Show basic user content
    document.querySelectorAll('.user-only').forEach(el => el.style.display = 'block');

    // Show Admin2 content
    if (role === 'admin2' || role === 'admin1') {
        document.querySelectorAll('.admin2-only').forEach(el => el.style.display = 'block');
    }
    
    // Show Admin1 content
    if (role === 'admin1') {
        document.querySelectorAll('.admin1-only').forEach(el => el.style.display = 'block');
    }
}

// --- Logout ---
const btnLogout = document.getElementById("btn-logout");
btnLogout.addEventListener("click", logout);

function logout() {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Logout error:", error);
    });
}

const button_lets = document.querySelector('.cta');
if (button_lets){
    button_lets.addEventListener('click', () => {
        window.location.href = "profile.html";
    })
}
else {
    console.log("No button found with class 'btn-lets'");
}