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

    const { userId, reason } = await request.json();

    if (!userId || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[warn-user] Admin:", admin.email, "warning user:", userId);

    // Call the admin RPC
    const { data, error } = await supabaseAdmin.rpc("admin_warn_user", {
      target_user_id: userId,
      warning_reason: reason,
    });

    if (error) {
      console.error("[warn-user] RPC error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction({
      adminId: admin.id,
      action: "warn_user",
      targetType: "user",
      targetId: userId,
      payload: { reason },
    });

    console.log("[warn-user] Success:", data);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[warn-user] Exception:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

