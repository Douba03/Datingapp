"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ban, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserActionsProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export function UserActions({ userId, userName, onSuccess }: UserActionsProps) {
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Warn state
  const [warnReason, setWarnReason] = useState("");

  // Ban state
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState<"hard" | "shadow">("hard");

  const handleWarn = async () => {
    if (!warnReason.trim()) {
      setError("Please provide a reason for the warning");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/warn-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          reason: warnReason,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to warn user");
      }

      // Success!
      setWarnDialogOpen(false);
      setWarnReason("");
      alert(`✅ Warning issued to ${userName}`);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banReason.trim()) {
      setError("Please provide a reason for the ban");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          reason: banReason,
          isHardBan: banType === "hard",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to ban user");
      }

      // Success!
      setBanDialogOpen(false);
      setBanReason("");
      alert(`✅ User ${userName} has been ${banType === "hard" ? "banned" : "shadow banned"}`);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => setWarnDialogOpen(true)}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warn
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8"
          onClick={() => setBanDialogOpen(true)}
        >
          <Ban className="h-3 w-3 mr-1" />
          Ban
        </Button>
      </div>

      {/* Warn Dialog */}
      <Dialog open={warnDialogOpen} onOpenChange={setWarnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warn User</DialogTitle>
            <DialogDescription>
              Issue a warning to <strong>{userName}</strong>. This will be recorded in their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="warn-reason">Warning Reason *</Label>
              <Textarea
                id="warn-reason"
                placeholder="e.g., Inappropriate behavior, spam, harassment..."
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                rows={3}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWarnDialogOpen(false);
                setWarnReason("");
                setError("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWarn}
              disabled={loading || !warnReason.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Warning...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Issue Warning
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban <strong>{userName}</strong> from the platform. This is a serious action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban-type">Ban Type *</Label>
              <Select value={banType} onValueChange={(v: "hard" | "shadow") => setBanType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hard">
                    <div>
                      <p className="font-medium">Hard Ban</p>
                      <p className="text-xs text-gray-500">User cannot access the app</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="shadow">
                    <div>
                      <p className="font-medium">Shadow Ban</p>
                      <p className="text-xs text-gray-500">User can access but others can't see them</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Ban Reason *</Label>
              <Textarea
                id="ban-reason"
                placeholder="e.g., Violation of terms, harassment, spam..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Warning:</strong> This action will immediately restrict the user's access.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setBanReason("");
                setError("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={loading || !banReason.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  {banType === "hard" ? "Ban User" : "Shadow Ban User"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

