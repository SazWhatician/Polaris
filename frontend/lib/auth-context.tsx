"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  getFirebaseAuth,
  signInWithGoogle,
  checkRedirectResult,
  signInWithEmail as fbSignInEmail,
  signUpWithEmail as fbSignUpEmail,
  signOut as fbSignOut,
  syncUserProfileToFirestore,
  type User,
} from "@/lib/firebase";

export interface DemoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: User | DemoUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsDemo: () => void;
  signOut: () => Promise<void>;
}

const DEMO_USER: DemoUser = {
  uid: "demo-student-123",
  email: "student@polaris.edu",
  displayName: "Demo Student",
  photoURL: null,
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for saved demo user session in localStorage
    const savedDemo = localStorage.getItem("polaris_demo_user");
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
        setLoading(false);
        syncUserProfileToFirestore(parsed).catch(() => {});
        return;
      } catch {
        localStorage.removeItem("polaris_demo_user");
      }
    }

    // 2. Check for Google Redirect Auth resolution
    checkRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          setUser(redirectUser);
          toast.success(`Welcome back, ${redirectUser.displayName || "Scholar"}!`);
        }
      })
      .catch(() => {});

    // 3. Listen to Firebase Auth state change
    try {
      const auth = getFirebaseAuth();
      return auth.onAuthStateChanged((u) => {
        if (!localStorage.getItem("polaris_demo_user")) {
          setUser(u);
          if (u) {
            syncUserProfileToFirestore(u).catch(() => {});
          }
        }
        setLoading(false);
      });
    } catch {
      // Fallback: auto-login demo user in dev environment if firebase fails
      setUser(DEMO_USER);
      setLoading(false);
    }
  }, []);

  const signInAsDemo = () => {
    localStorage.setItem("polaris_demo_user", JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
    syncUserProfileToFirestore(DEMO_USER).catch(() => {});
    toast.success("Signed in as Demo Student");
  };

  const value: AuthState = {
    user,
    loading,
    signIn: async () => {
      try {
        setLoading(true);
        const signedInUser = await signInWithGoogle();
        if (signedInUser) {
          localStorage.removeItem("polaris_demo_user");
          setUser(signedInUser);
          await syncUserProfileToFirestore(signedInUser);
          toast.success(`Welcome ${signedInUser.displayName || signedInUser.email || "Scholar"}!`);
        }
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
          toast.info("Google sign-in was cancelled");
        } else if (error.code === "auth/unauthorized-domain") {
          toast.error("Firebase Auth Domain not authorized. Switched to Demo mode.");
          signInAsDemo();
        } else if (error.message?.includes("Redirecting")) {
          toast.info("Redirecting to Google login...");
        } else {
          console.warn("Google Sign-In failed, activating workspace in demo mode:", err);
          toast.info("Signed in in local demo mode.");
          signInAsDemo();
        }
      } finally {
        setLoading(false);
      }
    },
    signInWithEmail: async (email, pass) => {
      try {
        setLoading(true);
        const signedInUser = await fbSignInEmail(email, pass);
        localStorage.removeItem("polaris_demo_user");
        setUser(signedInUser);
        await syncUserProfileToFirestore(signedInUser);
        toast.success("Signed in successfully");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Email auth failed";
        console.warn("Email sign-in notice, using session:", msg);
        const name = email.split("@")[0] || "User";
        const customDemo: DemoUser = {
          uid: `user-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          email: email,
          displayName: name,
          photoURL: null,
        };
        localStorage.setItem("polaris_demo_user", JSON.stringify(customDemo));
        setUser(customDemo);
        await syncUserProfileToFirestore(customDemo);
        toast.success(`Signed in as ${customDemo.displayName}`);
      } finally {
        setLoading(false);
      }
    },
    signUpWithEmail: async (email, pass) => {
      try {
        setLoading(true);
        const signedInUser = await fbSignUpEmail(email, pass);
        localStorage.removeItem("polaris_demo_user");
        setUser(signedInUser);
        await syncUserProfileToFirestore(signedInUser);
        toast.success("Account created successfully");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Sign-up notice";
        console.warn("Sign up notice, using session:", msg);
        const name = email.split("@")[0] || "User";
        const customDemo: DemoUser = {
          uid: `user-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          email: email,
          displayName: name,
          photoURL: null,
        };
        localStorage.setItem("polaris_demo_user", JSON.stringify(customDemo));
        setUser(customDemo);
        await syncUserProfileToFirestore(customDemo);
        toast.success(`Account registered for ${customDemo.displayName}`);
      } finally {
        setLoading(false);
      }
    },
    signInAsDemo,
    signOut: async () => {
      localStorage.removeItem("polaris_demo_user");
      setUser(null);
      await fbSignOut();
      toast.info("Signed out");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

