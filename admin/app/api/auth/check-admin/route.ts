import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log("[check-admin] Request received");
    const { userId } = await request.json();
    console.log("[check-admin] User ID:", userId);

    if (!userId) {
      console.log("[check-admin] ❌ No user ID provided");
      return NextResponse.json({ 
        isAdmin: false, 
        error: "No user ID provided",
        debug: { userId: null }
      }, { status: 400 });
    }

    console.log("[check-admin] Checking admin status...");
    const adminStatus = await isAdmin(userId);
    console.log("[check-admin] Admin status result:", adminStatus);

    return NextResponse.json({ 
      isAdmin: adminStatus,
      debug: { 
        userId,
        checkedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("[check-admin] ❌ Error:", error);
    console.error("[check-admin] Error stack:", error.stack);
    return NextResponse.json({ 
      isAdmin: false, 
      error: error.message,
      debug: { errorType: error.constructor.name }
    }, { status: 500 });
  }
}

