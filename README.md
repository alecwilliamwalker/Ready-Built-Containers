# Ready Built Containers

Production-ready marketing, lead generation, and light sales site for Ready Built Containers' shipping container hunting cabins. Built with Next.js (App Router), Tailwind CSS, Prisma, React Hook Form, Zod, Stripe, and Resend.

## Prerequisites

- Node.js 20+
- npm (or pnpm/yarn if you prefer)

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the example environment file and adjust values as needed
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` defaults to SQLite for local development (`file:./prisma/dev.db`).
   - Set Stripe and email keys before enabling reservation checkout or live notifications.
3. Apply Prisma migrations and seed demo content
   ```bash
   npx prisma migrate dev
   ```
   This migrates the database and seeds default cabin models, floorplans, and an admin user.
4. Start the development server
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000.

## Prisma & Database

- Generated client lives at `@/lib/db`.
- Seed script creates three standard models (`basecamp-20`, `basecamp-40`, `outfitter-40-plus`) along with floorplans and an admin login (`admin@readybuiltcontainers.com` / `readybuilt2025`, configurable via environment).
- To swap to PostgreSQL in production, update `DATABASE_URL` and adjust `provider` in `prisma/schema.prisma` before running migrations.

## Helpful Commands

```bash
npm run lint          # lint the codebase
npx prisma studio     # inspect database data
npx prisma migrate dev --name <migration-name>
```

## Environment Variables

See `.env.example` for the full list, including optional Calendly embed, Stripe configuration, email provider keys, and admin session secret. Key values:

- `DATABASE_URL` – SQLite by default (`file:./prisma/dev.db`), swap to Postgres-compatible for production.
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_DEPOSIT`, `STRIPE_WEBHOOK_SECRET` – required for reservation checkout.
- `EMAIL_API_KEY`, `EMAIL_FROM_ADDRESS`, `INTERNAL_NOTIFICATIONS_EMAIL` – used for Resend transactional email.
- `ADMIN_JWT_SECRET` – 32+ character secret for admin auth cookies.
- `NEXT_PUBLIC_CALENDLY_URL` – optional embedded scheduler.
- `NEXT_PUBLIC_SITE_URL` – base URL used for Stripe redirects.

## Adding Models & Media

- Update `prisma/seed.ts` with new model specs, images, and floorplans. Use `npx prisma db seed` (or rerun `npx prisma migrate dev`) to repopulate local data.
- Place hero and gallery assets under `public/images/models/` and plan diagrams under `public/images/floorplans/`. Reference them in Prisma seed and components with `/images/...` paths.
- For ad-hoc admin additions, log into `/admin` (default credentials `admin@readybuiltcontainers.com` / `readybuilt2025`) and review new inquiries immediately after seeding.
