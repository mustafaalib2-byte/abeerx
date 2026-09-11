import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// Only initialize Firebase if we have a valid Project ID (prevents crash on empty config)
const isFirebaseConfigured = typeof window !== "undefined" 
  ? !!firebaseConfig.projectId 
  : !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const app = isFirebaseConfigured && !getApps().length 
  ? initializeApp(firebaseConfig) 
  : (isFirebaseConfigured ? getApp() : null);

// Safely export services. They will be null if Firebase isn't configured yet.
// Our ProductService already checks process.env before using these.
export const db = app ? getDatabase(app) : null as any;
export const storage = app ? getStorage(app) : null as any;

export default app;
