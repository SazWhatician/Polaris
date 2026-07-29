"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getFirebaseAuth, signInWithGoogle, signOut as fbSignOut, type User } from "@/lib/firebase";

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
    // Check localStorage for saved demo user session
    const savedDemo = localStorage.getItem("polaris_demo_user");
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem("polaris_demo_user");
      }
    }

    try {
      const auth = getFirebaseAuth();
      return auth.onAuthStateChanged((u) => {
        if (!localStorage.getItem("polaris_demo_user")) {
          setUser(u);
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
    toast.success("Signed in as Demo Student");
  };

  const value: AuthState = {
    user,
    loading,
    signIn: async () => {
      try {
        setLoading(true);
        await signInWithGoogle();
      } catch (err: unknown) {
        console.warn("Google Sign-In failed or was cancelled, switching to Demo mode:", err);
        signInAsDemo();
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
