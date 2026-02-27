export const ADMIN_CREDENTIALS = {
  email: "readybuiltcontainers@gmail.com",
  password: "readybuilt2025",
};

export const TEST_USER = {
  email: `testuser-${Date.now()}@example.com`,
  password: "testpassword123",
  name: "Test User",
};

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;
}

export const MODELS = {
  standard: { slug: "standard", name: "Standard", basePriceCents: 5_100_000 },
  deluxe: { slug: "deluxe", name: "Deluxe", basePriceCents: 8_900_000 },
} as const;

export const VALID_LEAD = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-123-4567",
  state: "IA",
  zip: "50025",
  source: "e2e-test",
  message: "Automated test lead",
};

export const VALID_QUOTE = {
  name: "John Smith",
  email: "john@example.com",
  phone: "555-987-6543",
  modelSlug: "standard",
  landState: "MT",
  landZip: "59601",
  timeline: "3-6mo",
};

export const VALID_CONSULTATION = {
  name: "Bob Builder",
  email: "bob@example.com",
  phone: "555-111-2222",
  preferredModel: "deluxe",
  timeZone: "Central",
  notes: "Automated test consultation",
};

export const VALID_RESERVATION = {
  name: "Alice Reserve",
  email: "alice@example.com",
  phone: "555-333-4444",
  modelSlug: "standard",
  confirmTerms: true,
};

export const VALID_DESIGN = {
  name: "Test Layout",
  shellLengthFt: 40,
  configJson: { shell: { lengthFt: 40, widthFt: 8 }, fixtures: [] },
  priceCents: 5_100_000,
};

export const NAV_ITEMS = [
  { href: "/models", label: "Models" },
  { href: "/design", label: "Build your own" },
  { href: "/plans", label: "Plans" },
  { href: "/process", label: "Process" },
  { href: "/faq", label: "FAQ" },
  { href: "/quote", label: "Quote" },
] as const;

export const FOOTER_LINKS = [
  { href: "/models", label: "Models" },
  { href: "/design", label: "Build Your Own" },
  { href: "/plans", label: "Plan Views" },
  { href: "/process", label: "Build Process" },
  { href: "/faq", label: "FAQ" },
  { href: "/consultation", label: "Schedule Consult" },
  { href: "/reserve", label: "Reserve" },
] as const;
