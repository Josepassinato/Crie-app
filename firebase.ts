import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';

// Helper to check if a config object seems valid
const isConfigValid = (config: any): boolean => {
  return config && config.apiKey && config.apiKey !== "YOUR_API_KEY" && config.projectId;
};

// --- Main Service Initialization ---

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initializeFirebaseServices() {
  // If services are already initialized, return them to prevent re-initialization.
  if (app && auth && db) {
    return { app, auth, db };
  }
  
  if (!isConfigValid(firebaseConfig)) {
    throw new Error("FIREBASE_CONFIG_INVALID");
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    throw new Error("FIREBASE_INIT_FAILED");
  }
}
