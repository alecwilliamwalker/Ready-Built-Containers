"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

export function AdminLogoutButton() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to log out");
      }
      showToast({ variant: "success", title: "Logged out" });
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast({ variant: "error", title: "Logout failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout} disabled={isSubmitting}>
      {isSubmitting ? "Signing out..." : "Sign out"}
    </Button>
  );
}

