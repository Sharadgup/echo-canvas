
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  Timestamp, 
  type Firestore, 
  doc,  // Ensured doc is imported
  deleteDoc // Ensured deleteDoc is imported
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let googleProvider: GoogleAuthProvider | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;

console.log("Attempting to initialize Firebase...");
console.log(`NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '****** (set)' : 'MISSING!'}`);
console.log(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING!'}`);
console.log(`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING!'}`);
console.log(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '(optional, not checked for critical path)'}`);
console.log(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '(optional, not checked for critical path)'}`);
console.log(`NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '(optional, not checked for critical path)'}`);


const essentialConfigValuesPresent =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

if (essentialConfigValuesPresent) {
  if (!getApps().length) {
    try {
      console.log("No Firebase apps initialized yet. Initializing new app...");
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } catch (error: any) {
      console.error("Firebase SDK initializeApp() FAILED:", error);
      console.warn(
        `CRITICAL: Firebase app object could not be created. ` +
        `This is often due to an invalid API key or misconfigured project ID. ` +
        `Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are correct and the key has permissions for this project/domain in Google Cloud Console.`
      );
      app = undefined; // Ensure app is undefined if init fails
    }
  } else {
    console.log("Firebase app already initialized. Getting existing app.");
    app = getApp();
  }

  if (app) {
    console.log("Firebase app object is available. Attempting to get services...");
    try {
      auth = getAuth(app);
      console.log("Auth service obtained.");
      googleProvider = new GoogleAuthProvider();
      console.log("GoogleAuthProvider created.");
      db = getFirestore(app);
      console.log("Firestore service obtained.");
      storage = getStorage(app);
      console.log("Storage service obtained.");
      console.log("All Firebase services initialized successfully.");
    } catch (error: any) {
        console.error("Firebase service initialization FAILED (getAuth, getFirestore, etc.):", error);
        console.warn(
            `This might be due to an invalid or missing API key, incorrect project ID, or other Firebase config issues. ` +
            `Firebase services (Auth, Firestore, Storage) will be unavailable. ` +
            `Error code: ${error.code}, Message: ${error.message}`
        );
        auth = undefined;
        googleProvider = undefined;
        db = undefined;
        storage = undefined;
    }
  } else {
     console.warn("Firebase app object was not successfully initialized or retrieved. Firebase services will be unavailable.");
  }
} else {
  console.warn(
    "Essential Firebase configuration (API Key, Auth Domain, Project ID) is MISSING from environment variables. " +
    "Firebase services will NOT be initialized. Please set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID in your Vercel project environment settings."
  );
}

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
  doc, // Ensured doc is exported
  deleteDoc, // Ensured deleteDoc is exported
  serverTimestamp,
  Timestamp
};
