import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import defaultConfig from '../../firebase-applet-config.json';

// Helper to resolve environment variables in Vite (import.meta.env) or Node.js (process.env)
const resolveEnv = (key: string, viteKey: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key] as string;
    if (process.env[viteKey]) return process.env[viteKey] as string;
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      if (metaEnv[viteKey]) return metaEnv[viteKey];
      if (metaEnv[key]) return metaEnv[key];
    }
  } catch {
    // ignore
  }
  return fallback;
};

export const firebaseConfig = {
  apiKey: resolveEnv('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY', defaultConfig.apiKey),
  authDomain: resolveEnv('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN', defaultConfig.authDomain),
  projectId: resolveEnv('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID', defaultConfig.projectId),
  storageBucket: resolveEnv('FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET', defaultConfig.storageBucket),
  messagingSenderId: resolveEnv('FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID', defaultConfig.messagingSenderId),
  appId: resolveEnv('FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID', defaultConfig.appId),
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase is used exclusively for Authentication
export const auth = getAuth(app);
