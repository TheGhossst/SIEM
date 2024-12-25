import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

// Helper function to get a reference to a log document
export function getLogDocRef(year: number, month: number, logId: string) {
  return doc(db, 'logs', year.toString(), month.toString(), logId);
}

// Helper function to get a reference to a log collection for a specific year and month
export function getLogCollectionRef(year: number, month: number) {
  return collection(db, 'logs', year.toString(), month.toString());
}

// Helper function to get a reference to the summary collection
export function getSummaryCollectionRef() {
  return collection(db, 'summaries');
}