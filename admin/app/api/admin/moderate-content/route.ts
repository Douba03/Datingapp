import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

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
    const { assetId, action, reason, reviewNote } = body;

    console.log('[moderate-content] Admin:', user.email, 'action:', action, 'assetId:', assetId);

    if (!assetId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the content asset
    const { data: asset, error: fetchError } = await supabaseAdmin
      .from('content_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (fetchError || !asset) {
      console.error('[moderate-content] Asset not found:', fetchError);
      return NextResponse.json(
        { error: "Content asset not found" },
        { status: 404 }
      );
    }

    // Determine the new status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update the content asset
    const updateData: any = {
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    if (reviewNote) {
      updateData.review_note = reviewNote;
    }

    if (action === 'reject' && reason) {
      updateData.reason = reason;
    }

    const { error: updateError } = await supabaseAdmin
      .from('content_assets')
      .update(updateData)
      .eq('id', assetId);

    if (updateError) {
      console.error('[moderate-content] Update error:', updateError);
      return NextResponse.json(
        { error: "Failed to update content status" },
        { status: 500 }
      );
    }

    // If rejected, remove the photo from the user's profile
    if (action === 'reject' && asset.type === 'photo') {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('photos, primary_photo_idx')
        .eq('user_id', asset.user_id)
        .single();

      if (!profileError && profile) {
        // Remove the rejected photo URL from the photos array
        const updatedPhotos = profile.photos.filter((url: string) => url !== asset.url);
        
        // Adjust primary_photo_idx if needed
        let newPrimaryIdx = profile.primary_photo_idx;
        const removedIndex = profile.photos.indexOf(asset.url);
        
        if (removedIndex !== -1 && removedIndex <= profile.primary_photo_idx) {
          newPrimaryIdx = Math.max(0, profile.primary_photo_idx - 1);
        }

        // Update the profile
        await supabaseAdmin
          .from('profiles')
          .update({
            photos: updatedPhotos,
            primary_photo_idx: Math.min(newPrimaryIdx, updatedPhotos.length - 1)
          })
          .eq('user_id', asset.user_id);

        console.log('[moderate-content] Removed rejected photo from profile:', asset.url);
      }
    }

    console.log('[moderate-content] Success:', {
      assetId,
      action,
      newStatus,
      userId: asset.user_id
    });

    return NextResponse.json({
      success: true,
      assetId,
      status: newStatus,
      message: `Content ${newStatus} successfully`
    });

  } catch (error) {
    console.error("[moderate-content] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


