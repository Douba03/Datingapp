import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin, isAdmin } from "./supabase/server";

export async function getSession() {
  try {
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("[getSession] Error:", error);
      return null;
    }
    
    if (!session) {
      console.log("[getSession] No session found");
      return null;
    }
    
    console.log("[getSession] Session found for user:", session.user.email);
    return session;
  } catch (error) {
    console.error("[getSession] Exception:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    console.log("[getCurrentUser] Getting session...");
    const session = await getSession();
    
    if (!session) {
      console.log("[getCurrentUser] No session");
      return null;
    }
    
    console.log("[getCurrentUser] Session found, checking admin status...");
    // Check if user is admin
    const adminStatus = await isAdmin(session.user.id);
    
    if (!adminStatus) {
      console.log("[getCurrentUser] User is not admin");
      return null;
    }
    
    console.log("[getCurrentUser] ✅ User is admin");
    return {
      id: session.user.id,
      email: session.user.email,
      isAdmin: true,
    };
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

