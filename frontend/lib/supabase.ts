import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-polaris.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

let cachedSupabase: SupabaseClient | null = null;

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginAt?: string;
  createdAt?: string;
  role?: string;
}

export function getSupabase(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;
  cachedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cachedSupabase;
}

export async function syncUserProfileToSupabase(user: {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}): Promise<void> {
  if (!user || !user.id) return;
  try {
    const supabase = getSupabase();
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "Student");
    const photoURL = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    const nowIso = new Date().toISOString();

    await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        email: user.email || null,
        display_name: displayName,
        photo_url: photoURL,
        last_login_at: nowIso,
        role: "student",
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("Supabase user profile sync non-fatal warning:", err);
  }
}

export async function getUserProfileFromSupabase(uid: string): Promise<UserProfileData | null> {
  if (!uid) return null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (!error && data) {
      return {
        uid: data.id,
        email: data.email,
        displayName: data.display_name,
        photoURL: data.photo_url,
        lastLoginAt: data.last_login_at,
        createdAt: data.created_at,
        role: data.role,
      };
    }
  } catch (err) {
    console.warn("Failed to fetch user profile from Supabase:", err);
  }
  return null;
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  try {
    const supabase = getSupabase();
    const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<{ user: User | null; error: Error | null }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (data.user) {
      await syncUserProfileToSupabase(data.user);
    }
    return { user: data.user, error };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

export async function signUpWithEmail(email: string, pass: string): Promise<{ user: User | null; error: Error | null }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: email.split("@")[0],
        },
      },
    });
    if (data.user) {
      await syncUserProfileToSupabase(data.user);
    }
    return { user: data.user, error };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("polaris_demo_user");
  }
  try {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors in demo mode
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
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    // Fall back to demo token
  }
  return "demo-token-polaris-123";
}

export type { User };
