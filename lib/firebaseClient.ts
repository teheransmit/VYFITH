import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCBY4W1zPd4G5MLMz8Yf6EOf1xF5uui1cg',
  authDomain: 'gen-lang-client-0463513688.firebaseapp.com',
  projectId: 'gen-lang-client-0463513688',
  storageBucket: 'gen-lang-client-0463513688.firebasestorage.app',
  appId: '1:956922204718:web:77a010d9772c6df33f45bf',
};

export const FIRESTORE_DATABASE_ID = 'ai-studio-android-vyfithap-2321ae21-ba56-4210-a764-79319278e807';

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

export function getFirebaseApp() {
  if (!isFirebaseConfigured) return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  return app ? getFirestore(app, FIRESTORE_DATABASE_ID) : null;
}
