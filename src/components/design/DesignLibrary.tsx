"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCents } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

export type DesignLibraryProps = {
  designs: Array<{
    id: string;
    name: string;
    shellLengthFt: number;
    priceCents: number;
    previewImageUrl: string | null;
    updatedAt: string;
    config?: unknown;
  }>;
};

export function DesignLibrary({ designs: initialDesigns }: DesignLibraryProps) {
  const [designs, setDesigns] = useState(initialDesigns);
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function renameDesign(id: string) {
    const current = designs.find((design) => design.id === id);
    if (!current) return;
    const nextName = window.prompt("Rename design", current.name);
    if (!nextName || nextName.trim().length < 2) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName.trim() }),
      });
      if (!response.ok) throw new Error("Rename failed");
      setDesigns((prev) => prev.map((design) => (design.id === id ? { ...design, name: nextName.trim() } : design)));
      showToast({ variant: "success", title: "Design renamed" });
    } catch (error) {
      console.error(error);
      showToast({ variant: "error", title: "Unable to rename design" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function duplicateDesign(id: string) {
    const source = designs.find((design) => design.id === id);
    if (!source) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${source.name} copy`,
          shellLengthFt: source.shellLengthFt,
          config: source.config ?? {},
          priceCents: source.priceCents,
          previewImageUrl: source.previewImageUrl,
        }),
      });
      if (!response.ok) throw new Error("Duplicate failed");
      const payload = await response.json();
      setDesigns((prev) => [{ ...payload.design, config: source.config }, ...prev]);
      showToast({ variant: "success", title: "Design duplicated" });
    } catch (error) {
      console.error(error);
      showToast({ variant: "error", title: "Unable to duplicate design" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteDesign(id: string) {
    const confirmDelete = window.confirm("Delete this design? This action cannot be undone.");
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/designs/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setDesigns((prev) => prev.filter((design) => design.id !== id));
      showToast({ variant: "success", title: "Design deleted" });
    } catch (error) {
      console.error(error);
      showToast({ variant: "error", title: "Unable to delete design" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (designs.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-muted/60 bg-white p-6 text-center shadow-[0_12px_30px_-22px_rgba(14,20,32,0.65)]">
        <p className="text-sm text-foreground/70">You have no saved designs yet.</p>
        <Button href="/design" className="mt-4">
          Start designing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {designs.map((design) => (
        <article
          key={design.id}
          className="flex flex-col gap-4 rounded-2xl border border-surface-muted/60 bg-white p-4 shadow-[0_12px_30px_-22px_rgba(14,20,32,0.65)] md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">{design.name}</h3>
            <p className="text-sm text-foreground/70">
              {design.shellLengthFt}' shell · {formatCurrencyCents(design.priceCents)} · Updated{" "}
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(design.updatedAt))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={`/design?id=${design.id}`}
              className="rounded-md border border-forest/30 px-3 py-2 font-semibold text-forest/90 hover:border-forest/60"
            >
              Edit
            </Link>
            <Button type="button" variant="outline" onClick={() => renameDesign(design.id)} disabled={isSubmitting}>
              Rename
            </Button>
            <Button type="button" variant="outline" onClick={() => duplicateDesign(design.id)} disabled={isSubmitting}>
              Duplicate
            </Button>
            <Button type="button" variant="outline" onClick={() => deleteDesign(design.id)} disabled={isSubmitting}>
              Delete
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

