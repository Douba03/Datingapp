"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ContentActionsProps {
  assetId: string;
  userName: string;
  contentType: string;
}

export function ContentActions({ assetId, userName, contentType }: ContentActionsProps) {
  const router = useRouter();
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/moderate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          action,
          reason: action === 'reject' ? reason : undefined,
          reviewNote: reviewNote || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to moderate content');
      }

      // Close dialogs
      setIsApproveOpen(false);
      setIsRejectOpen(false);
      setReason("");
      setReviewNote("");

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Moderation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to moderate content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="default" 
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => setIsApproveOpen(true)}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Approve
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          className="flex-1"
          onClick={() => setIsRejectOpen(true)}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Reject
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {/* Gradient Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-t-lg" />
          
          {/* Icon Badge */}
          <div className="flex justify-center -mt-2 mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-center">Approve Content</DialogTitle>
            <DialogDescription className="text-center">
              You are about to approve this {contentType} uploaded by <strong>{userName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-green-800">
                <p className="font-medium">This will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Mark the content as approved</li>
                  <li>Make it visible to other users</li>
                  <li>Record your approval in the system</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-note">Review Notes (Optional)</Label>
              <Textarea
                id="approve-note"
                placeholder="e.g., Content meets community guidelines..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleAction('approve')}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Approving...' : 'Approve Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {/* Gradient Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-red-600 rounded-t-lg" />
          
          {/* Icon Badge */}
          <div className="flex justify-center -mt-2 mb-4">
            <div className="w-20 h-20 rounded-full bg-red-100 border-4 border-red-500 flex items-center justify-center shadow-lg">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-center">Reject Content</DialogTitle>
            <DialogDescription className="text-center">
              You are about to reject this {contentType} uploaded by <strong>{userName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-red-800">
                <p className="font-medium">This will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Mark the content as rejected</li>
                  <li>Remove it from the user's profile</li>
                  <li>Record the rejection reason</li>
                  <li>User may need to upload new content</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for Rejection *</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g., Inappropriate content, violates community guidelines..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
              <p className="text-xs text-gray-500">
                This reason will be visible to the user
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reject-note">Internal Notes (Optional)</Label>
              <Textarea
                id="reject-note"
                placeholder="Internal admin notes (not visible to user)..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleAction('reject')}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? 'Rejecting...' : 'Reject Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


