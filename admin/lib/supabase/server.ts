import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

/**
 * Supabase client with SERVICE ROLE key for server-side admin operations.
 * ⚠️ NEVER expose this to the client. Only use in server components, API routes, and server actions.
 * This client bypasses RLS and has full database access.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Helper to check if a user is an admin based on email or app_metadata.roles
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    console.log("[isAdmin] Checking admin status for user:", userId);
    
    // Get user from auth
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (error) {
      console.error("[isAdmin] ❌ Error fetching user:", error);
      return false;
    }

    if (!user) {
      console.log("[isAdmin] ❌ User not found");
      return false;
    }

    console.log("[isAdmin] User email:", user.user.email);
    console.log("[isAdmin] User app_metadata:", JSON.stringify(user.user.app_metadata));
    console.log("[isAdmin] User raw_app_meta_data:", JSON.stringify(user.user.raw_app_meta_data));

    // Check if email is in ADMIN_EMAILS env var
    const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
    console.log("[isAdmin] ADMIN_EMAILS env var:", adminEmailsEnv);
    
    const adminEmails = adminEmailsEnv.split(",").map((e) =>
      e.trim().toLowerCase()
    );
    console.log("[isAdmin] Parsed admin emails:", adminEmails);
    
    if (user.user.email && adminEmails.includes(user.user.email.toLowerCase())) {
      console.log("[isAdmin] ✅ User email matches ADMIN_EMAILS");
      return true;
    }

    // Check if user has 'admin' role in app_metadata
    const roles = (user.user.app_metadata?.roles as string[]) || [];
    console.log("[isAdmin] User roles from app_metadata:", roles);
    
    const isAdminRole = roles.includes("admin") || roles.includes("super_admin");
    console.log("[isAdmin] Has admin role:", isAdminRole);
    
    if (isAdminRole) {
      console.log("[isAdmin] ✅ User has admin role");
      return true;
    }

    console.log("[isAdmin] ❌ User is not admin");
    return false;
  } catch (error) {
    console.error("[isAdmin] ❌ Exception:", error);
    return false;
  }
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  payload,
}: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, any>;
}) {
  try {
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      payload: payload || {},
    });
  } catch (error) {
    console.error("[logAdminAction] Failed to log action:", error);
  }
}

