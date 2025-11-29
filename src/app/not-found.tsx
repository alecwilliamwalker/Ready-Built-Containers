import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function NotFound() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <SectionTitle eyebrow="404" title="Page not found" subtitle="The page you are looking for has moved or no longer exists." align="center" />
      <Link href="/" className="text-sm font-semibold text-forest hover:text-forest/80">
        Return home →
      </Link>
    </PageContainer>
  );
}
