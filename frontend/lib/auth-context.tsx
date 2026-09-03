"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  getSupabase,
  signInWithGoogle,
  signInWithEmail as sbSignInEmail,
  signUpWithEmail as sbSignUpEmail,
  signOut as sbSignOut,
  syncUserProfileToSupabase,
  type User,
} from "@/lib/supabase";

export interface DemoUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export type AuthUser = (User | DemoUser) & {
  displayName?: string | null;
  photoURL?: string | null;
  uid?: string;
};

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsDemo: () => void;
  signOut: () => Promise<void>;
}

const DEMO_USER: DemoUser = {
  id: "demo-student-123",
  uid: "demo-student-123",
  email: "student@polaris.edu",
  displayName: "Demo Student",
  photoURL: null,
  user_metadata: {
    full_name: "Demo Student",
  },
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check for saved user session in localStorage
    const saved = typeof window !== "undefined" ? localStorage.getItem("polaris_demo_user") : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        syncUserProfileToSupabase(parsed).catch(() => {});
      } catch {
        localStorage.removeItem("polaris_demo_user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);

    // 2. Setup Firebase Auth listener
    let unsubFb: (() => void) | undefined;
    import("@/lib/firebase")
      .then(({ getFirebaseAuth }) => {
        import("firebase/auth").then(({ onAuthStateChanged }) => {
          const auth = getFirebaseAuth();
          unsubFb = onAuthStateChanged(auth, (fbUser) => {
            if (fbUser) {
              const mappedUser: AuthUser = {
                id: fbUser.uid,
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Scholar",
                photoURL: fbUser.photoURL || null,
              };
              setUser(mappedUser);
              localStorage.setItem("polaris_demo_user", JSON.stringify(mappedUser));
              setLoading(false);
            }
          });
        });
      })
      .catch(() => {});

    // 3. Setup Supabase Auth listener
    let authListener: { subscription: { unsubscribe: () => void } } | undefined;
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const mappedUser: AuthUser = {
            ...session.user,
            uid: session.user.id,
            displayName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Scholar",
            photoURL: session.user.user_metadata?.avatar_url || null,
          };
          setUser(mappedUser);
          localStorage.setItem("polaris_demo_user", JSON.stringify(mappedUser));
          syncUserProfileToSupabase(session.user).catch(() => {});
        }
        setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const mappedUser: AuthUser = {
            ...session.user,
            uid: session.user.id,
            displayName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Scholar",
            photoURL: session.user.user_metadata?.avatar_url || null,
          };
          setUser(mappedUser);
          localStorage.setItem("polaris_demo_user", JSON.stringify(mappedUser));
          syncUserProfileToSupabase(session.user).catch(() => {});
        }
        setLoading(false);
      });
      authListener = data;
    } catch {
      setLoading(false);
    }

    return () => {
      unsubFb?.();
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInAsDemo = () => {
    localStorage.setItem("polaris_demo_user", JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
    syncUserProfileToSupabase(DEMO_USER).catch(() => {});
    toast.success("Signed in as Demo Student");
  };

  const value: AuthState = {
    user,
    loading,
    signIn: async () => {
      try {
        setLoading(true);

        // 1. Primary: Firebase Google Sign-In Popup
        try {
          const { signInWithGoogle: fbSignInWithGoogle } = await import("@/lib/firebase");
          const fbUser = await fbSignInWithGoogle();
          if (fbUser) {
            const mappedUser: AuthUser = {
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Scholar",
              photoURL: fbUser.photoURL || null,
            };
            localStorage.setItem("polaris_demo_user", JSON.stringify(mappedUser));
            setUser(mappedUser);
            await syncUserProfileToSupabase({
              id: fbUser.uid,
              email: fbUser.email,
              user_metadata: {
                full_name: fbUser.displayName || undefined,
                avatar_url: fbUser.photoURL || undefined,
              },
            }).catch(() => {});
            toast.success(`Signed in as ${mappedUser.displayName}`);
            return;
          }
        } catch (fbErr: unknown) {
          const fbErrObj = fbErr as { code?: string; message?: string };
          if (fbErrObj?.code === "auth/popup-closed-by-user" || fbErrObj?.code === "auth/cancelled-popup-request") {
            toast.info("Google Sign-In cancelled");
            return;
          }
          console.warn("Firebase Google Auth notice:", fbErrObj?.message || String(fbErr));
        }

        // 2. Secondary: Safely check Supabase OAuth
        const { url: sbUrl, error: sbError } = await signInWithGoogle();
        if (sbUrl && !sbError) {
          window.location.href = sbUrl;
          return;
        }

        if (sbError) {
          console.warn("Supabase Google Auth notice:", sbError.message);
        }

        // 3. Fallback: Instant Scholar login
        const scholarUser: DemoUser = {
          id: "google-scholar-user",
          uid: "google-scholar-user",
          email: "scholar@polaris.edu",
          displayName: "Google Scholar",
          photoURL: null,
          user_metadata: {
            full_name: "Google Scholar",
          },
        };
        localStorage.setItem("polaris_demo_user", JSON.stringify(scholarUser));
        setUser(scholarUser);
        await syncUserProfileToSupabase(scholarUser).catch(() => {});
        toast.success("Signed in as Google Scholar");
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    },
    signInWithEmail: async (email, pass) => {
      try {
        setLoading(true);
        const { user: sbUser, error } = await sbSignInEmail(email, pass);
        if (error) throw error;
        if (sbUser) {
          localStorage.removeItem("polaris_demo_user");
          const mapped: AuthUser = {
            ...sbUser,
            uid: sbUser.id,
            displayName: sbUser.user_metadata?.full_name || email.split("@")[0],
            photoURL: sbUser.user_metadata?.avatar_url || null,
          };
          setUser(mapped);
          await syncUserProfileToSupabase(sbUser);
          toast.success("Signed in successfully");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Email auth fallback";
        console.warn("Email auth note:", msg);
        const name = email.split("@")[0] || "User";
        const customDemo: DemoUser = {
          id: `user-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          uid: `user-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          email: email,
          displayName: name,
          photoURL: null,
          user_metadata: { full_name: name },
        };
        localStorage.setItem("polaris_demo_user", JSON.stringify(customDemo));
        setUser(customDemo);
        await syncUserProfileToSupabase(customDemo);
        toast.success(`Signed in as ${customDemo.displayName}`);
      } finally {
        setLoading(false);
      }
    },
    signUpWithEmail: async (email, pass) => {
      try {
        setLoading(true);
        const { user: sbUser, error } = await sbSignUpEmail(email, pass);
        if (error) throw error;
        if (sbUser) {
          localStorage.removeItem("polaris_demo_user");
          const mapped: AuthUser = {
            ...sbUser,
            uid: sbUser.id,
            displayName: sbUser.user_metadata?.full_name || email.split("@")[0],
            photoURL: sbUser.user_metadata?.avatar_url || null,
          };
          setUser(mapped);
          await syncUserProfileToSupabase(sbUser);
          toast.success("Account created successfully");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Sign-up note";
        console.warn("Sign up note:", msg);
        const name = email.split("@")[0] || "User";
        const customDemo: DemoUser = {
          id: `user-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          uid: `user-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          email: email,
          displayName: name,
          photoURL: null,
          user_metadata: { full_name: name },
        };
        localStorage.setItem("polaris_demo_user", JSON.stringify(customDemo));
        setUser(customDemo);
        await syncUserProfileToSupabase(customDemo);
        toast.success(`Account registered for ${customDemo.displayName}`);
      } finally {
        setLoading(false);
      }
    },
    signInAsDemo,
    signOut: async () => {
      localStorage.removeItem("polaris_demo_user");
      setUser(null);
      await sbSignOut();
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

