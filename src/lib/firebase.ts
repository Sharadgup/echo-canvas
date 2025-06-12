
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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

const essentialConfigValuesPresent =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

if (essentialConfigValuesPresent) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error: any) {
      console.error("Firebase SDK initialization itself failed during app initialization:", error);
      console.warn(
        `This is a critical error. Firebase will not be available. ` +
        `Review your Firebase config values (API Key, Auth Domain, Project ID etc.) and check API key restrictions in Google Cloud Console.`
      );
      // If initializeApp itself fails, 'app' remains undefined.
    }
  } else {
    app = getApp();
  }

  if (app) {
    try {
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      db = getFirestore(app);
      storage = getStorage(app);
    } catch (error: any) {
        console.error("Firebase service initialization failed (getAuth, getFirestore, etc.):", error);
        console.warn(
            `This might be due to an invalid or missing API key (NEXT_PUBLIC_FIREBASE_API_KEY: '${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}'), ` +
            `incorrect project ID, or other Firebase config issues. ` +
            `Firebase services (Auth, Firestore, Storage) will be unavailable.`
        );
        // Reset services to undefined if they fail to initialize after app init
        auth = undefined;
        googleProvider = undefined;
        db = undefined;
        storage = undefined;
        // Optionally, reset 'app' itself if critical services can't be obtained
        // app = undefined; 
    }
  } else {
     console.warn("Firebase app object was not successfully initialized. Firebase services will be unavailable.");
  }
} else {
  console.warn(
    "Essential Firebase configuration (API Key, Auth Domain, Project ID) is missing from environment variables. " +
    "Firebase services will not be initialized. Please set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID."
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
  serverTimestamp,
  Timestamp
};
