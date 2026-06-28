// firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { showToast } from './components/Toast';

export let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;

export async function initFirebase() {
  try {
    let config = null;
    let firestoreDatabaseId: string | undefined;

    // Fallback to Vite environment variables
    if (import.meta.env.VITE_FIREBASE_API_KEY) {
      config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
      firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined;
    }

    if (!config) {
      throw new Error('No Firebase configuration found');
    }

    // 🔥 Inisialisasi
    app = initializeApp(config);
    auth = getAuth(app);
    
    if (firestoreDatabaseId) {
      db = getFirestore(app, firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    
    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    showToast('Failed to initialize Firebase. Please check your configuration.', 'error');
    return false;
  }
}