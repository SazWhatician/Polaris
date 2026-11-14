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
  browserPopupRedirectResolver,
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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDQAIDkUq-690VPvk9Uk_98I9NKcOG8CCo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "polaris-27fd9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "polaris-27fd9",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "polaris-27fd9.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "529264698180",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:529264698180:web:0aa88300272f5c2a752d11",
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

  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    !emulatorAttempted
  ) {
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
      { merge: true },
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

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    if (result.user) {
      syncUserProfileToFirestore(result.user).catch(() => {});
      return result.user;
    }
    return null;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    // If user cancelled or closed popup, rethrow so UI can notify and stay on login
    if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      throw error;
    }

    // If popup was blocked or failed due to browser popup restrictions, fall back to redirect
    if (
      err.code === "auth/popup-blocked" ||
      err.code === "auth/operation-not-supported-in-this-environment" ||
      err.code === "auth/internal-error"
    ) {
      console.warn(
        "Firebase popup blocked or unsupported, falling back to signInWithRedirect:",
        err.code,
      );
      await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
      return null;
    }

    throw error;
  }
}

export async function checkRedirectResult(): Promise<User | null> {
  try {
    const auth = getFirebaseAuth();
    const result = await getRedirectResult(auth, browserPopupRedirectResolver);
    if (result?.user) {
      syncUserProfileToFirestore(result.user).catch(() => {});
      return result.user;
    }
  } catch (err) {
    console.warn("Redirect result check notice:", err);
  }
  return null;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const auth = getFirebaseAuth();
  const res = await signInWithEmailAndPassword(auth, email, pass);
  if (res.user) {
    syncUserProfileToFirestore(res.user).catch(() => {});
  }
  return res.user;
}

export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  const auth = getFirebaseAuth();
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  if (res.user) {
    syncUserProfileToFirestore(res.user).catch(() => {});
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
  try {
    const auth = getFirebaseAuth();
    if (typeof auth.authStateReady === "function") {
      await auth.authStateReady();
    }
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) return token;
    }
  } catch {}

  if (typeof window !== "undefined") {
    const demoUser = localStorage.getItem("polaris_demo_user");
    if (demoUser) {
      try {
        const parsed = JSON.parse(demoUser);
        if (parsed?.uid === "demo-student-123" || parsed?.isDemo) {
          return "demo-token-polaris-123";
        }
      } catch {
        // fallback below
      }
    }
  }
  return null;
}

export type { User };
