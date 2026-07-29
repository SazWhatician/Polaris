import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
  connectAuthEmulator,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:123456",
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let cachedAuth: ReturnType<typeof getAuth> | null = null;
let emulatorAttempted = false;

export function getFirebaseAuth() {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  cachedAuth = getAuth(app);

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development" && !emulatorAttempted) {
    emulatorAttempted = true;
    try {
      if (process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
        connectAuthEmulator(cachedAuth, "http://127.0.0.1:9099", { disableWarnings: true });
      }
    } catch {
      // Ignore emulator connection errors in dev
    }
  }
  return cachedAuth;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("polaris_demo_user");
  }
  try {
    await fbSignOut(getFirebaseAuth());
  } catch {
    // Ignore sign out errors for mock users
  }
}

export async function getIdToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const demoUser = localStorage.getItem("polaris_demo_user");
    if (demoUser) {
      return "demo-token-polaris-123";
    }
  }
  try {
    const user = getFirebaseAuth().currentUser;
    return user ? await user.getIdToken() : "demo-token-polaris-123";
  } catch {
    return "demo-token-polaris-123";
  }
}

export type { User };
