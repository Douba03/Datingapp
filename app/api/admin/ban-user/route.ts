import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, logAdminAction } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await getCurrentUser();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, reason, isHardBan } = await request.json();

    if (!userId || !reason || isHardBan === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[ban-user] Admin:", admin.email, "banning user:", userId, "hard:", isHardBan);

    // Call the admin RPC
    const { data, error } = await supabaseAdmin.rpc("admin_ban_user", {
      target_user_id: userId,
      ban_reason: reason,
      is_hard_ban: isHardBan,
    });

    if (error) {
      console.error("[ban-user] RPC error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction({
      adminId: admin.id,
      action: isHardBan ? "ban_user" : "shadow_ban_user",
      targetType: "user",
      targetId: userId,
      payload: { reason, isHardBan },
    });

    console.log("[ban-user] Success:", data);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[ban-user] Exception:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

