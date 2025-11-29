import { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { DesignLibrary } from "@/components/design/DesignLibrary";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-auth";

export const metadata: Metadata = {
  title: "Your Designs",
  description: "Manage saved Ready Built container designs, duplicate iterations, and continue editing.",
};

export default async function AccountDesignsPage() {
  const session = await getUserSession();

  if (!session) {
    return (
      <PageContainer className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <SectionTitle
          eyebrow="Design Library"
          title="Sign in to view your saved layouts"
          subtitle="Create an account from the design studio to keep version history and submit proposals."
          align="center"
        />
        <Link href="/design" className="text-sm font-semibold text-forest hover:text-forest/80">
          Head to the design studio →
        </Link>
      </PageContainer>
    );
  }

  const designs = await prisma.design.findMany({
    where: { userId: session.sub },
    orderBy: { updatedAt: "desc" },
  });

  const serializableDesigns = designs.map((design) => ({
    id: design.id,
    name: design.name,
    shellLengthFt: design.shellLengthFt,
    priceCents: design.priceCents,
    previewImageUrl: design.previewImageUrl,
    updatedAt: design.updatedAt.toISOString(),
    config: design.configJson,
  }));

  return (
    <PageContainer className="space-y-8 py-12">
      <SectionTitle
        eyebrow="Design Library"
        title="Manage your custom layouts"
        subtitle="Rename concepts, duplicate variations, or reopen them in the design studio."
      />
      <DesignLibrary designs={serializableDesigns} />
    </PageContainer>
  );
}

