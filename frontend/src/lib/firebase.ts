import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Allow demo project for emulator mode
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
if (!useEmulator && (!firebaseConfig.projectId || !firebaseConfig.apiKey)) {
  throw new Error('Missing Firebase environment variables (VITE_FIREBASE_*)');
}

// Use demo project ID for emulators
if (useEmulator && !firebaseConfig.projectId) {
  firebaseConfig.projectId = 'demo-activity-app';
  firebaseConfig.apiKey = 'demo-key';
  firebaseConfig.authDomain = 'localhost';
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Analytics only in browser and if supported
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null)
  : null;

// Connect to emulators if enabled
if (useEmulator) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('🔧 Firebase emulators connected');
}

export default app;
