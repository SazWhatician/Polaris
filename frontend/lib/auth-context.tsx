"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  signInWithGoogle as fbSignInWithGoogle,
  checkRedirectResult as fbCheckRedirectResult,
  getFirebaseAuth,
  signOut as fbSignOut,
} from "@/lib/firebase";
import {
  getSupabase,
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
  signIn: () => Promise<boolean>;
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
    // 1. Check for saved user session in localStorage for instant render
    const saved = typeof window !== "undefined" ? localStorage.getItem("polaris_demo_user") : null;
    let hasSavedUser = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.uid || parsed?.id) {
          setUser(parsed);
          hasSavedUser = true;
          setLoading(false);
          syncUserProfileToSupabase(parsed).catch(() => {});
        }
      } catch {
        localStorage.removeItem("polaris_demo_user");
        setUser(null);
      }
    }

    // 2. Check redirect result from Google OAuth redirect
    fbCheckRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          const mappedUser: AuthUser = {
            id: redirectUser.uid,
            uid: redirectUser.uid,
            email: redirectUser.email,
            displayName: redirectUser.displayName || redirectUser.email?.split("@")[0] || "Scholar",
            photoURL: redirectUser.photoURL || null,
          };
          setUser(mappedUser);
          localStorage.setItem("polaris_demo_user", JSON.stringify(mappedUser));

          const cleanHandle =
            redirectUser.email
              ?.split("@")[0]
              ?.toLowerCase()
              .replace(/[^a-z0-9_]/g, "_") || "scholar";
          const communityProfile = {
            alias: mappedUser.displayName || "Scholar",
            username: `@${cleanHandle}`,
            college: "Global Academy",
            course: "Computer Science & AI",
            year: "3rd Year (Junior)",
            bio: "Scholar specializing in Computer Science & AI.",
            avatarUrl: redirectUser.photoURL || undefined,
            isSetupComplete: true,
          };
          localStorage.setItem("polaris_comm_profile_v2", JSON.stringify(communityProfile));
          window.dispatchEvent(new Event("polaris:community-updated"));

          setLoading(false);
          toast.success(`Welcome, ${mappedUser.displayName}!`);

          if (typeof window !== "undefined") {
            const p = window.location.pathname;
            if (p === "/" || p === "/login") {
              window.location.replace("/dashboard");
            }
          }
        }
      })
      .catch((err: unknown) => {
        const errorObj = err as { code?: string; message?: string };
        console.warn("Redirect result check error:", err);
        if (
          errorObj?.code &&
          errorObj.code !== "auth/null-user" &&
          errorObj.code !== "auth/no-current-user"
        ) {
          toast.error(errorObj.message || "Google authentication failed");
        }
      });

    // 3. Setup Firebase Auth listener for real-time auth state
    let unsubFb: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      import("firebase/auth").then(({ onAuthStateChanged }) => {
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
          }
          setLoading(false);
        });
      });
    } catch {
      if (!hasSavedUser) setLoading(false);
    }

    // 4. Setup Supabase Auth listener
    let authListener: { subscription: { unsubscribe: () => void } } | undefined;
    try {
      const supabase = getSupabase();
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) {
            const mappedUser: AuthUser = {
              ...session.user,
              uid: session.user.id,
              displayName:
                session.user.user_metadata?.full_name ||
                session.user.email?.split("@")[0] ||
                "Scholar",
              photoURL: session.user.user_metadata?.avatar_url || null,
            };
            setUser(mappedUser);
            localStorage.setItem("polaris_demo_user", JSON.stringify(mappedUser));
            syncUserProfileToSupabase(session.user).catch(() => {});
          }
          setLoading(false);
        })
        .catch(() => {
          if (!hasSavedUser) setLoading(false);
        });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const mappedUser: AuthUser = {
            ...session.user,
            uid: session.user.id,
            displayName:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "Scholar",
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
      if (!hasSavedUser) setLoading(false);
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => {
      clearTimeout(timer);
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
    signIn: async (): Promise<boolean> => {
      try {
        setLoading(true);

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

          const cleanHandle =
            fbUser.email
              ?.split("@")[0]
              ?.toLowerCase()
              .replace(/[^a-z0-9_]/g, "_") || "scholar";
          const communityProfile = {
            alias: mappedUser.displayName || "Scholar",
            username: `@${cleanHandle}`,
            college: "Global Academy",
            course: "Computer Science & AI",
            year: "3rd Year (Junior)",
            bio: "Scholar specializing in Computer Science & AI.",
            avatarUrl: fbUser.photoURL || undefined,
            isSetupComplete: true,
          };
          localStorage.setItem("polaris_comm_profile_v2", JSON.stringify(communityProfile));
          window.dispatchEvent(new Event("polaris:community-updated"));

          syncUserProfileToSupabase({
            id: fbUser.uid,
            email: fbUser.email,
            user_metadata: {
              full_name: fbUser.displayName || undefined,
              avatar_url: fbUser.photoURL || undefined,
            },
          }).catch(() => {});
          toast.success(`Signed in as ${mappedUser.displayName}`);
          return true;
        }

        // If fbUser is null, redirect flow was initiated via signInWithRedirect
        return false;
      } catch (fbErr: unknown) {
        const fbErrObj = fbErr as { code?: string; message?: string };
        if (
          fbErrObj?.code === "auth/popup-closed-by-user" ||
          fbErrObj?.code === "auth/cancelled-popup-request"
        ) {
          toast.info("Google Sign-In cancelled");
          return false;
        }
        console.error("Firebase Google Auth error:", fbErr);
        toast.error(fbErrObj?.message || "Google Sign-In failed. Please try again.");
        return false;
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
        const msg = err instanceof Error ? err.message : "Sign-in failed";
        console.warn("Sign-in error:", msg);
        toast.error(msg);
        throw err;
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
        const msg = err instanceof Error ? err.message : "Sign-up failed";
        console.warn("Sign-up error:", msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    signInAsDemo,
    signOut: async () => {
      localStorage.removeItem("polaris_demo_user");
      setUser(null);
      await Promise.allSettled([sbSignOut(), fbSignOut()]);
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
