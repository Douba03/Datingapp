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

interface ReportActionsProps {
  reportId: string;
  reportedName: string;
}

export function ReportActions({ reportId, reportedName }: ReportActionsProps) {
  const router = useRouter();
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'resolve' | 'close') => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/admin/update-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          action,
          resolution: resolution || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update report");
      }

      // Close the dialog
      setIsResolveOpen(false);
      setIsCloseOpen(false);
      setResolution("");

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Failed to update report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => setIsResolveOpen(true)}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Resolve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsCloseOpen(true)}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Close
        </Button>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
          <DialogHeader className="space-y-3 pt-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              Resolve Report
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Mark this report as resolved. This indicates that action has been taken
              regarding the report against{" "}
              <span className="font-semibold text-gray-900">{reportedName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-sm text-green-800">
                  <p className="font-medium">This action will:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Close the report as resolved</li>
                    <li>Record your resolution notes</li>
                    <li>Update the report status to "Resolved"</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution" className="text-sm font-medium">
                Resolution Notes <span className="text-gray-400">(Optional)</span>
              </Label>
              <Textarea
                id="resolution"
                placeholder="e.g., User has been warned and inappropriate content removed. Profile is now compliant with community guidelines."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Add notes about what action was taken for future reference
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsResolveOpen(false);
                setResolution("");
              }}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAction('resolve')}
              disabled={isLoading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-600" />
          <DialogHeader className="space-y-3 pt-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              Close Report
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Mark this report as closed without taking action. This indicates that
              the report against{" "}
              <span className="font-semibold text-gray-900">{reportedName}</span>{" "}
              was reviewed but no action is needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-sm text-gray-800">
                  <p className="font-medium">This action will:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Close the report without action</li>
                    <li>Record your closure notes</li>
                    <li>Update the report status to "Closed"</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-resolution" className="text-sm font-medium">
                Reason for Closing <span className="text-gray-400">(Optional)</span>
              </Label>
              <Textarea
                id="close-resolution"
                placeholder="e.g., After review, this report does not violate community guidelines. Content is appropriate and follows platform rules."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Add notes about why no action was taken for future reference
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCloseOpen(false);
                setResolution("");
              }}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('close')}
              disabled={isLoading}
              className="w-full sm:w-auto border-gray-600 text-gray-700 hover:bg-gray-100"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Closing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Close Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

