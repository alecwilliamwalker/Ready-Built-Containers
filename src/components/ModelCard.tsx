import Link from "next/link";
import { Card, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Gallery } from "@/components/Gallery";
import { formatCurrencyCents } from "@/lib/format";
import type { ModelSummary } from "@/types/model";

export function ModelCard({ model }: { model: ModelSummary }) {
  const bathroomLabel = model.hasBathroom ? "Full bath" : "Dry cabin";

  const bunksLabel = (() => {
    if (model.slug === "hc40") return "Four stacked bunks";
    if (model.slug === "hc20") return "Sleep area for 2";
    return "Bunk-ready layout";
  })();

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-800/60 bg-slate-950/70 px-6 py-5">
        <CardTitle className="text-slate-100">{model.name}</CardTitle>
        {model.tagline && <CardDescription className="text-slate-300">{model.tagline}</CardDescription>}
      </div>
      <CardContent className="flex flex-1 flex-col gap-5 px-6 py-6">
        {model.images && model.images.length > 0 ? (
          <Gallery images={model.images} />
        ) : (
          <div className="h-64 rounded-xl bg-slate-950/85 flex items-center justify-center text-slate-500">
            No images available
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
            <dd className="font-semibold text-slate-900">{model.hasKitchen ? "Open concept" : "Prep zone"}</dd>
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
