
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Check for essential Firebase config variables
const requiredEnvVars: (keyof NodeJS.ProcessEnv)[] = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    // This error will be thrown during the build if a variable is missing or empty
    throw new Error(
      `Firebase config error: Environment variable ${varName} is not defined or is empty. ` +
      `Ensure it is correctly set in your .env.local file for local builds, or in your hosting provider's environment variables. ` +
      `Current value: '${process.env[varName]}'`
    );
  }
}

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Measurement ID is optional for basic Firebase
};

let app;
// Ensure Firebase is initialized only once
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error: any) {
    console.error("Firebase SDK initialization itself failed:", error);
    // Re-throw the error to make sure the build fails clearly
    throw new Error(`Firebase SDK initialization failed: ${error.message}. Review your Firebase config values (API Key, Auth Domain, Project ID etc.) and check API key restrictions in Google Cloud Console.`);
  }
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export {
  app,
  auth,
  googleProvider,
  db,
  storage,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp
};
