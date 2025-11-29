# Architecture Overview

Ready Built Containers is a Next.js 16 (App Router) application that powers the public marketing site, lead-generation flows, and a lightweight admin dashboard. It combines React Server Components, Prisma for persistence, Stripe for reservation deposits, and Resend for transactional email.

## Project Structure

- `src/app/(marketing)/` – public routes (home, models, plans, process, quote, consultation, reserve, etc.). These are primarily Server Components that can fetch Prisma data.
- `src/app/admin/` – server-rendered admin dashboard plus client helpers for authentication state and tables.
- `src/app/api/` – route handlers for public form submissions, admin data endpoints, Stripe checkout, and webhooks.
- `src/components/` – reusable UI building blocks: hero sections, cards, forms, layout primitives, admin widgets, toast provider, etc.
- `src/lib/` – shared services (Prisma client, auth helpers, env parsing, validation schemas, Stripe helpers, email client, formatting utilities).
- `prisma/` – schema, migrations, SQLite development database, and seed script (demo models + admin account).
- `public/images/` – marketing imagery for hero sections, model renders, and process diagrams.

## Core Architecture Layers

### 1. Presentation Layer (Marketing UI)
- **Location**: `src/app/(marketing)`, `src/components/`
- **Responsibilities**: Render marketing copy, model cards, plan comparisons, and CTAs. Server Components query Prisma directly (e.g., `src/app/(marketing)/page.tsx` for featured models) and pass data to reusable components (`Hero`, `ModelsGrid`, `ModelDetail`, `PlansGallery`, etc.).
- **Styling**: Tailwind CSS 4 (PostCSS plugin) with design tokens declared in `src/app/globals.css`. Fonts are loaded via `next/font` (Geist + Barlow).

### 2. Client Interactivity & Forms
- **Location**: `src/components/*Form.tsx`, `src/components/providers/ToastProvider.tsx`
- **Responsibilities**: Client Components use React Hook Form + Zod (`src/lib/validation.ts`) to validate inputs, show inline error states, and POST JSON payloads to their API routes. Toasts provide optimistic UX for submissions and admin auth.

### 3. API & Business Logic
- **Location**: `src/app/api/**/route.ts`
- **Responsibilities**:
  - Public routes (`/api/leads`, `/api/quotes`, `/api/consultations`) validate, persist via Prisma, and send two emails (internal notification + customer confirmation) using Resend (`src/lib/email.ts`).
  - `/api/reservations/checkout` creates Stripe Checkout Sessions (helpers in `src/lib/stripe.ts`) and inserts pending `Reservation` rows with the expected deposit amount.
  - `/api/stripe/webhook` verifies signatures and transitions reservations to `completed`/`canceled` while updating final amounts.
  - `/api/admin/*` endpoints ensure an admin session exists (`getAdminSession`) before returning filtered data for dashboard tables.

### 4. Auth & Admin Experience
- **Location**: `src/lib/auth.ts`, `src/app/admin`, `src/app/api/admin`
- **Responsibilities**: Authenticate staff via email/password (bcrypt hashes stored in `AdminUser`), issue JWTs signed with `ADMIN_JWT_SECRET`, store them in HTTP-only cookies, and guard admin routes. The dashboard (Server Component) fetches counts/tables with Prisma and lets users filter data with client-side links/pills.

### 5. Data & Persistence
- **Location**: `prisma/schema.prisma`, `src/lib/db.ts`
- **Responsibilities**: Prisma models for:
  - `Model`, `ModelImage`, `Floorplan` – product catalog shown across the site.
  - `Lead`, `QuoteRequest`, `ConsultationRequest` – marketing funnel submissions.
  - `Reservation` – Stripe checkout records with status/amount tracking.
  - `AdminUser` – admin credentials.
Local development uses SQLite (`file:./prisma/dev.db`). Production can switch to PostgreSQL by adjusting `DATABASE_URL` and the provider before running migrations. `prisma/seed.ts` populates demo data and a default admin user (`admin@readybuiltcontainers.com / readybuilt2025`, overridable via env vars).

## Data Flow

1. Marketing pages render via Server Components, optionally loading Prisma data (models, floorplans, counts).
2. Visitors submit a client-side form (lead/quote/consult/reserve/admin login) validated by Zod + React Hook Form.
3. The request hits a Next.js route handler that re-validates, persists through Prisma, and triggers side effects (emails, Stripe session creation).
4. Admin dashboard requests counts and latest submissions directly on the server; filters are applied via query params and re-rendered tables.
5. Stripe sends webhook events after checkout. The webhook route verifies signatures with `STRIPE_WEBHOOK_SECRET` and updates reservation rows accordingly.

## External Integrations

- **Prisma** – ORM + migration layer (SQLite dev, Postgres-ready for prod).
- **Stripe** – Checkout Sessions for the $5k refundable deposit, plus webhook lifecycle updates.
- **Resend** – Transactional email provider for both internal notifications and customer acknowledgements.
- **Next Font / Google Fonts** – `Geist`, `Geist Mono`, `Barlow Semi Condensed` for typography.

## Build & Tooling

- **Runtime**: Node 20+, Next.js 16 (App Router, React 19).
- **Styling**: Tailwind CSS 4 (`@tailwindcss/postcss`), global design tokens defined in CSS.
- **Validation / Type Safety**: TypeScript 5 (strict), Zod schemas, shared types in `src/types`.
- **Linting**: `eslint-config-next` core web vitals (`npm run lint`).
- **Scripts**: `npm run dev`, `npm run build`, `npm run start`, and `npx prisma migrate dev` or `npx prisma db seed`.

## Operational Notes

- Environment variables are validated up front in `src/lib/env.ts`; local `.env` should at minimum define `DATABASE_URL`, `ADMIN_JWT_SECRET`, and any Stripe/Resend keys required for the feature set.
- The Stripe webhook route requires publicly accessible HTTPS (e.g., Vercel or `stripe listen`) and the correct `STRIPE_WEBHOOK_SECRET`.
- Admin login is cookie-based; be sure to rotate `ADMIN_JWT_SECRET` and seed secure passwords before production deploys.
