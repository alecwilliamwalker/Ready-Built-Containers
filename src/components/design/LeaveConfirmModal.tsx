"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type LeaveConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function LeaveConfirmModal({
  open,
  onClose,
  onConfirm,
}: LeaveConfirmModalProps) {
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Leave Design Studio?
            </h3>
            <p className="text-sm text-foreground/60">
              Your unsaved changes may be lost
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground/70 mb-6">
          Are you sure you want to stop building? If you haven&apos;t saved your
          design, any changes will be lost.
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Keep Building
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            Leave Studio
          </Button>
        </div>
      </div>
    </Modal>
  );
}

