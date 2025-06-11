
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Check for essential Firebase config variables
const requiredEnvVars: string[] = [ // Changed to string[] for process.env access
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

for (const varName of requiredEnvVars) {
  const envVarValue = process.env[varName];
  if (!envVarValue) {
    // This error will be thrown during build or runtime if a variable is missing or empty
    throw new Error(
      `Firebase config error: Environment variable ${varName} is not defined or is empty. ` +
      `1. Ensure it is correctly set in your '.env.local' file in the project ROOT directory. ` +
      `2. You MUST RESTART your Next.js development server after creating or modifying '.env.local'. ` +
      `3. For deployments, set this in your hosting provider's environment variables. ` +
      `Current value for ${varName}: '${envVarValue}' (This indicates it's missing or Next.js hasn't picked it up).`
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

