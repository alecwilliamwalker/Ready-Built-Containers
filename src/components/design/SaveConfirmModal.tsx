"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type SaveConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggedIn: boolean;
  isProcessing?: boolean;
};

export function SaveConfirmModal({
  open,
  onClose,
  onConfirm,
  isLoggedIn,
  isProcessing = false,
}: SaveConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="p-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Save Your Design?
            </h3>
            <p className="text-sm text-foreground/60">
              Your design needs to be saved before submitting
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground/70 mb-6">
          {isLoggedIn ? (
            <>
              Would you like to save your design before submitting it for a proposal?
              This will preserve all your customizations.
            </>
          ) : (
            <>
              To save your design and submit for a proposal, you&apos;ll need to sign in
              or create an account. This lets you access your saved designs anytime.
            </>
          )}
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : isLoggedIn
              ? "Save & Submit"
              : "Continue to Sign In"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


