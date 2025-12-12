import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId, action, resolution } = body;

    console.log('[update-report] Admin:', user.email, 'action:', action, 'reportId:', reportId);

    if (!reportId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine the new status and update data
    let updateData: any = {
      closed_at: new Date().toISOString(),
    };

    if (action === 'resolve') {
      updateData.status = 'resolved';
      updateData.resolution = resolution || 'Report reviewed and action taken by admin.';
    } else if (action === 'close') {
      updateData.status = 'closed';
      updateData.resolution = resolution || 'Report reviewed - no action needed.';
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Update the report
    const { data: report, error: updateError } = await supabaseAdmin
      .from("user_reports")
      .update(updateData)
      .eq("id", reportId)
      .select()
      .single();

    if (updateError) {
      console.error('[update-report] Error:', updateError);
      return NextResponse.json(
        { error: "Failed to update report" },
        { status: 500 }
      );
    }

    console.log('[update-report] Success:', {
      reportId: report.id,
      status: report.status,
      action,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("[update-report] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

