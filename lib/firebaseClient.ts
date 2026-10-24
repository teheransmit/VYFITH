import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'gen-lang-client-0463513688.firebaseapp.com',
  projectId: 'gen-lang-client-0463513688',
  appId: '1:956922204718:web:77a010d9772c6df33f45bf',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;
  const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(firebaseApp);
}
