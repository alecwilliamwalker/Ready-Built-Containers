import Link from "next/link";
import { Card, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCents } from "@/lib/format";
import type { ModelSummary } from "@/types/model";
import Image from "next/image";

export function ModelCard({ model }: { model: ModelSummary }) {
  const bathroomLabel =
    model.slug === "basecamp-20"
      ? "Dry cabin / optional bath"
      : model.hasBathroom
      ? "Full bath"
      : "Dry cabin";

  const bunksLabel = (() => {
    if (model.slug === "basecamp-20") return "Upper / lower bunks";
    if (model.slug === "basecamp-40") return "Four stacked bunks";
    if (model.slug.includes("outfitter")) return "Six stacked bunks";
    return "Bunk-ready layout";
  })();

  const heroImage = model.images?.[0];

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-800/60 bg-slate-950/70 px-6 py-5">
        <CardTitle className="text-slate-100">{model.name}</CardTitle>
        {model.tagline && <CardDescription className="text-slate-300">{model.tagline}</CardDescription>}
      </div>
      <CardContent className="flex flex-1 flex-col gap-5 px-6 py-6">
        {model.images?.[0] ? (
          <div className="group relative h-64 w-full overflow-hidden rounded-xl bg-slate-950/85 shadow-[0_12px_35px_-30px_rgba(12,20,31,0.9)] transition-all duration-500 hover:shadow-[0_20px_50px_-30px_rgba(16,185,129,0.3)]">
            <Image
              src={model.images[0].url}
              alt={model.images[0].alt}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-64 rounded-xl bg-slate-950/85 flex items-center justify-center text-slate-500">
            No hero image
          </div>
        )}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-700">Length</dt>
            <dd className="font-semibold text-slate-900">{model.lengthFt}'</dd>
          </div>
          <div>
            <dt className="text-slate-700">Sleeps</dt>
            <dd className="font-semibold text-slate-900">{model.sleeps}</dd>
          </div>
          <div>
            <dt className="text-slate-700">Bathroom</dt>
            <dd className="font-semibold text-slate-900">{bathroomLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-700">Kitchen</dt>
            <dd className="font-semibold text-slate-900">{model.hasKitchen ? "Galley built-in" : "Prep zone"}</dd>
          </div>
          <div>
            <dt className="text-slate-700">Bunks</dt>
            <dd className="font-semibold text-slate-900">{bunksLabel}</dd>
          </div>
        </dl>
        <p className="text-sm font-semibold text-forest">
          Starting at {formatCurrencyCents(model.basePrice)}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-slate-800/60 bg-slate-950/70 px-6 py-4">
        <Link
          href={`/models/${model.slug}`}
          className="text-sm font-semibold text-slate-900 transition hover:text-forest"
        >
          View details
        </Link>
        <Button href={`/quote?model=${model.slug}`} variant="accent">
          Request a Quote
        </Button>
      </CardFooter>
    </Card>
  );
}
