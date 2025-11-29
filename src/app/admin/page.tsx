import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminTable } from "@/components/AdminTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { formatCurrencyCents, formatDateTime } from "@/lib/format";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
};

type AdminPageSearchParams = {
  view?: string;
  leadSource?: string;
  quoteModel?: string;
  consultModel?: string;
  reservationStatus?: string;
  designStatus?: string;
};

const VIEWS = [
  { key: "leads", label: "Leads" },
  { key: "quotes", label: "Quotes" },
  { key: "consultations", label: "Consultations" },
  { key: "reservations", label: "Reservations" },
  { key: "designs", label: "Custom Designs" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

function adminUrl(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  const view = params.view ?? "leads";
  search.set("view", view);

  Object.entries(params).forEach(([key, value]) => {
    if (key === "view") return;
    if (value && value !== "all") {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return `/admin${query ? `?${query}` : ""}`;
}

export default async function AdminPage({ searchParams }: { searchParams?: AdminPageSearchParams }) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <PageContainer className="flex min-h-screen flex-col items-center justify-center gap-8 py-16">
        <SectionTitle
          eyebrow="Admin"
          title="Ready Built Containers admin access"
          subtitle="Sign in to review leads, quotes, consultations, and reservations."
          align="center"
        />
        <AdminLoginForm />
      </PageContainer>
    );
  }

  const requestedView = searchParams?.view;
  const view = VIEWS.some((item) => item.key === requestedView) ? (requestedView as ViewKey) : "leads";
  const leadSourceFilter = searchParams?.leadSource ?? "all";
  const quoteModelFilter = searchParams?.quoteModel ?? "all";
  const consultModelFilter = searchParams?.consultModel ?? "all";
  const reservationStatusFilter = searchParams?.reservationStatus ?? "all";
  const designStatusFilter = searchParams?.designStatus ?? "all";

  const [leadCount, quoteCount, consultationCount, reservationCount, designSubmissionCount, models] = await Promise.all([
    prisma.lead.count(),
    prisma.quoteRequest.count(),
    prisma.consultationRequest.count(),
    prisma.reservation.count(),
    prisma.designSubmission.count(),
    prisma.model.findMany({ select: { slug: true, name: true } }),
  ]);

  const modelLabel = new Map(models.map((model) => [model.slug, model.name]));

  let content: ReactNode = null;

  if (view === "leads") {
    const [leadSourcesRaw, leads] = await Promise.all([
      prisma.lead.findMany({ distinct: ["source"], select: { source: true }, orderBy: { source: "asc" } }),
      prisma.lead.findMany({
        where: leadSourceFilter !== "all" ? { source: leadSourceFilter } : undefined,
        orderBy: { createdAt: "desc" },
        take: 250,
      }),
    ]);

    const leadSources = ["all", ...leadSourcesRaw.map((record) => record.source).filter((value): value is string => Boolean(value))];

    content = (
      <div className="space-y-4">
        <FilterPills
          label="Source"
          options={leadSources}
          active={leadSourceFilter}
          getHref={(value) => adminUrl({ view: "leads", leadSource: value })}
        />
        <AdminTable
          columns={[
            {
              key: "createdAt",
              header: "Received",
              render: (lead) => formatDateTime(lead.createdAt),
            },
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "state", header: "State" },
            { key: "source", header: "Source" },
            {
              key: "modelSlug",
              header: "Model",
              render: (lead) => modelLabel.get(lead.modelSlug ?? "") ?? lead.modelSlug ?? "—",
            },
            {
              key: "timeline",
              header: "Timeline",
              render: (lead) => lead.timeline ?? "—",
            },
            {
              key: "message",
              header: "Message",
              render: (lead) => (lead.message ? <span className="block max-w-xs text-sm text-foreground/80">{lead.message}</span> : "—"),
            },
          ]}
          data={leads}
          emptyMessage="No leads captured yet."
        />
      </div>
    );
  }

  if (view === "quotes") {
    const [quoteModelsRaw, quotes] = await Promise.all([
      prisma.quoteRequest.findMany({ distinct: ["modelSlug"], select: { modelSlug: true }, orderBy: { modelSlug: "asc" } }),
      prisma.quoteRequest.findMany({
        where: quoteModelFilter !== "all" ? { modelSlug: quoteModelFilter } : undefined,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const quoteModels = [
      "all",
      ...quoteModelsRaw
        .map((record) => record.modelSlug)
        .filter((value): value is string => Boolean(value)),
    ];

    content = (
      <div className="space-y-4">
        <FilterPills
          label="Model"
          options={quoteModels}
          active={quoteModelFilter}
          getHref={(value) => adminUrl({ view: "quotes", quoteModel: value })}
          formatLabel={(value) => modelLabel.get(value) ?? value}
        />
        <AdminTable
          columns={[
            {
              key: "createdAt",
              header: "Received",
              render: (quote) => formatDateTime(quote.createdAt),
            },
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            {
              key: "modelSlug",
              header: "Model",
              render: (quote) => modelLabel.get(quote.modelSlug ?? "") ?? quote.modelSlug ?? "—",
            },
            {
              key: "budgetRange",
              header: "Budget",
              render: (quote) => quote.budgetRange ?? "—",
            },
            {
              key: "timeline",
              header: "Timeline",
              render: (quote) => quote.timeline ?? "—",
            },
            {
              key: "powerPreference",
              header: "Power",
              render: (quote) => quote.powerPreference ?? "—",
            },
            {
              key: "waterPreference",
              header: "Water",
              render: (quote) => quote.waterPreference ?? "—",
            },
            {
              key: "message",
              header: "Notes",
              render: (quote) =>
                quote.message ? <span className="block max-w-xs text-sm text-foreground/80">{quote.message}</span> : "—",
            },
          ]}
          data={quotes}
          emptyMessage="No quote requests yet."
        />
      </div>
    );
  }

  if (view === "consultations") {
    const [consultModelsRaw, consultations] = await Promise.all([
      prisma.consultationRequest.findMany({ distinct: ["preferredModel"], select: { preferredModel: true }, orderBy: { preferredModel: "asc" } }),
      prisma.consultationRequest.findMany({
        where: consultModelFilter !== "all" ? { preferredModel: consultModelFilter } : undefined,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const consultModels = [
      "all",
      ...consultModelsRaw
        .map((record) => record.preferredModel)
        .filter((value): value is string => Boolean(value)),
    ];

    content = (
      <div className="space-y-4">
        <FilterPills
          label="Preferred model"
          options={consultModels}
          active={consultModelFilter}
          getHref={(value) => adminUrl({ view: "consultations", consultModel: value })}
          formatLabel={(value) => modelLabel.get(value) ?? value}
        />
        <AdminTable
          columns={[
            {
              key: "createdAt",
              header: "Received",
              render: (request) => formatDateTime(request.createdAt),
            },
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            {
              key: "preferredModel",
              header: "Model",
              render: (request) => modelLabel.get(request.preferredModel ?? "") ?? request.preferredModel ?? "—",
            },
            {
              key: "preferredDate",
              header: "Preferred Date",
              render: (request) => (request.preferredDate ? formatDateTime(request.preferredDate) : "—"),
            },
            {
              key: "timeZone",
              header: "Time Zone",
              render: (request) => request.timeZone ?? "—",
            },
            {
              key: "notes",
              header: "Notes",
              render: (request) =>
                request.notes ? <span className="block max-w-xs text-sm text-foreground/80">{request.notes}</span> : "—",
            },
          ]}
          data={consultations}
          emptyMessage="No consultation requests yet."
        />
      </div>
    );
  }

  if (view === "reservations") {
    const reservationStatuses = ["all", "pending", "completed", "canceled"];
    const reservations = await prisma.reservation.findMany({
      where: reservationStatusFilter !== "all" ? { status: reservationStatusFilter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    content = (
      <div className="space-y-4">
        <FilterPills
          label="Status"
          options={reservationStatuses}
          active={reservationStatusFilter}
          getHref={(value) => adminUrl({ view: "reservations", reservationStatus: value })}
        />
        <AdminTable
          columns={[
            {
              key: "createdAt",
              header: "Created",
              render: (reservation) => formatDateTime(reservation.createdAt),
            },
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            {
              key: "modelSlug",
              header: "Model",
              render: (reservation) => modelLabel.get(reservation.modelSlug ?? "") ?? reservation.modelSlug ?? "—",
            },
            {
              key: "amountCents",
              header: "Deposit",
              render: (reservation) => formatCurrencyCents(reservation.amountCents),
            },
            {
              key: "status",
              header: "Status",
              render: (reservation) => reservation.status,
            },
          ]}
          data={reservations}
          emptyMessage="No reservations yet."
        />
      </div>
    );
  }

  if (view === "designs") {
    const designStatuses = ["all", "pending", "in-review", "completed"];
    const submissions = await prisma.designSubmission.findMany({
      where: designStatusFilter !== "all" ? { status: designStatusFilter } : undefined,
      include: {
        design: {
          select: {
            name: true,
            shellLengthFt: true,
            priceCents: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    content = (
      <div className="space-y-4">
        <FilterPills
          label="Status"
          options={designStatuses}
          active={designStatusFilter}
          getHref={(value) => adminUrl({ view: "designs", designStatus: value })}
        />
        <AdminTable
          columns={[
            {
              key: "createdAt",
              header: "Submitted",
              render: (submission) => formatDateTime(submission.createdAt),
            },
            {
              key: "design",
              header: "Design",
              render: (submission) => submission.design?.name ?? "Untitled design",
            },
            {
              key: "user",
              header: "User",
              render: (submission) => submission.design?.user?.email ?? "—",
            },
            {
              key: "shellLengthFt",
              header: "Shell",
              render: (submission) => `${submission.design?.shellLengthFt ?? "?"}'`,
            },
            {
              key: "priceCents",
              header: "Estimate",
              render: (submission) => formatCurrencyCents(submission.design?.priceCents ?? 0),
            },
            { key: "status", header: "Status" },
            {
              key: "notes",
              header: "Notes",
              render: (submission) =>
                submission.notes ? <span className="block max-w-xs text-sm text-foreground/80">{submission.notes}</span> : "—",
            },
          ]}
          data={submissions}
          emptyMessage="No custom designs submitted yet."
        />
      </div>
    );
  }

  const counts: Record<ViewKey, number> = {
    leads: leadCount,
    quotes: quoteCount,
    consultations: consultationCount,
    reservations: reservationCount,
    designs: designSubmissionCount,
  };

  return (
    <PageContainer className="space-y-8 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SectionTitle
            eyebrow="Admin"
            title="Ready Built Containers dashboard"
            subtitle={`Signed in as ${session.email}. Use the filters below to triage inquiries.`}
          />
        </div>
        <AdminLogoutButton />
      </header>

      <nav className="flex flex-wrap items-center gap-3">
        {VIEWS.map((item) => {
          const isActive = view === item.key;
          return (
            <Link
              key={item.key}
              href={adminUrl({ view: item.key })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-forest bg-forest text-white"
                  : "border-foreground/20 text-foreground/70 hover:border-forest/40"
              }`}
            >
              {item.label}
              <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium text-white/80">
                {counts[item.key]}
              </span>
            </Link>
          );
        })}
      </nav>

      <section>{content}</section>
    </PageContainer>
  );
}

function FilterPills({
  label,
  options,
  active,
  getHref,
  formatLabel,
}: {
  label: string;
  options: string[];
  active: string;
  getHref: (value: string) => string;
  formatLabel?: (value: string) => string;
}): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="font-semibold text-foreground/70">{label}:</span>
      {options.map((option) => {
        const isActive = active === option;
        const formatted = formatLabel?.(option);
        const labelText = option === "all" ? "All" : (formatted ?? (option || "Unspecified"));
        return (
          <Link
            key={option || "none"}
            href={getHref(option)}
            className={`rounded-full border px-3 py-1.5 transition ${
              isActive
                ? "border-forest bg-forest text-white"
                : "border-foreground/15 text-foreground/70 hover:border-forest/40"
            }`}
          >
            {labelText}
          </Link>
        );
      })}
    </div>
  );
}

