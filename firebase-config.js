// Firebase SDK initialization and Authentication Helper Services
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGfVvKAmWfbk5sukGlVvt-91xkCf-aj2o",
  authDomain: "ai-health-checker-6fd5f.firebaseapp.com",
  projectId: "ai-health-checker-6fd5f",
  storageBucket: "ai-health-checker-6fd5f.firebasestorage.app",
  messagingSenderId: "718169879624",
  appId: "1:718169879624:web:f886b95731960a6527547d",
  measurementId: "G-J7RPQ31RZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Custom Auth Helper Service exposed globally for app.js integration
window.FirebaseAuthService = {
  // Login with Google Popup
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && !result.user.photoURL && result.user.email) {
        const photoURL = `https://unavatar.io/${encodeURIComponent(result.user.email)}`;
        try { await updateProfile(result.user, { photoURL }); } catch (e) {}
      }
      return { success: true, user: result.user };
    } catch (error) {
      console.error("Google Auth Error:", error);
      return { success: false, error: error.message };
    }
  },

  // Register with Email and Password
  async registerWithEmail(name, email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        const photoURL = `https://unavatar.io/${encodeURIComponent(email)}`;
        await updateProfile(userCredential.user, { displayName: name || email.split('@')[0], photoURL: photoURL });
      }
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Email Register Error:", error);
      return { success: false, error: error.message };
    }
  },

  // Login with Email and Password
  async loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user && !userCredential.user.photoURL && email) {
        const photoURL = `https://unavatar.io/${encodeURIComponent(email)}`;
        try { await updateProfile(userCredential.user, { photoURL }); } catch (e) {}
      }
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Email Login Error:", error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Logout Error:", error);
      return { success: false, error: error.message };
    }
  },

  // Get Current User
  getCurrentUser() {
    return auth.currentUser;
  },

  // Subscribe to Auth State Changes
  onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  }
};

// Dispatch custom event to notify app.js that FirebaseAuthService is ready
window.dispatchEvent(new CustomEvent('firebaseAuthReady'));
if (typeof window.initFirebaseAuth === 'function') {
  window.initFirebaseAuth();
}

console.log("🔥 Firebase Auth Initialized for MediPulse AI");

