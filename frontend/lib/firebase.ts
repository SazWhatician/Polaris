import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:123456",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-G4G7G7NREL",
};

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginAt?: string;
  createdAt?: string;
  role?: string;
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let cachedAuth: ReturnType<typeof getAuth> | null = null;
let cachedFirestore: Firestore | null = null;
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

export function getFirebaseFirestore(): Firestore {
  if (cachedFirestore) return cachedFirestore;
  const app = getFirebaseApp();
  cachedFirestore = getFirestore(app);

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === "true") {
        connectFirestoreEmulator(cachedFirestore, "127.0.0.1", 8080);
      }
    } catch {
      // Ignore emulator connection errors in dev
    }
  }
  return cachedFirestore;
}

export async function syncUserProfileToFirestore(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  if (!user || !user.uid) return;
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, "users", user.uid);
    const nowIso = new Date().toISOString();
    
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.email ? user.email.split("@")[0] : "Student"),
        photoURL: user.photoURL || null,
        lastLoginAt: nowIso,
        role: "student",
      },
      { merge: true }
    );
  } catch (err) {
    // Non-blocking fallback for offline/demo/uninitialized firebase credentials
    console.warn("Firestore user sync non-fatal error:", err);
  }
}

export async function getUserProfileFromFirestore(uid: string): Promise<UserProfileData | null> {
  if (!uid) return null;
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
  } catch (err) {
    console.warn("Failed to fetch user document from Firestore:", err);
  }
  return null;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await syncUserProfileToFirestore(result.user);
    }
    return result.user;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    // If popup was blocked by browser or restricted, attempt redirect
    if (err.code === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
      throw new Error("Redirecting to Google Sign-In...");
    }
    throw error;
  }
}

export async function checkRedirectResult(): Promise<User | null> {
  try {
    const auth = getFirebaseAuth();
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await syncUserProfileToFirestore(result.user);
      return result.user;
    }
  } catch (err) {
    console.warn("Redirect result check error:", err);
  }
  return null;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const auth = getFirebaseAuth();
  const res = await signInWithEmailAndPassword(auth, email, pass);
  if (res.user) {
    await syncUserProfileToFirestore(res.user);
  }
  return res.user;
}

export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  const auth = getFirebaseAuth();
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  if (res.user) {
    await syncUserProfileToFirestore(res.user);
  }
  return res.user;
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
      try {
        const parsed = JSON.parse(demoUser);
        if (parsed?.uid) {
          return parsed.uid.startsWith("user-") || parsed.uid.startsWith("demo-")
            ? parsed.uid
            : `user-${parsed.uid}`;
        }
      } catch {
        return "demo-token-polaris-123";
      }
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

