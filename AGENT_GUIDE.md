# Agent Guide - Ready Built Containers

> **Purpose**: This guide helps AI agents and developers quickly navigate the Ready Built Containers codebase. It provides a directory map, key file locations, and entry points for common tasks.

## Project Overview

Ready Built Containers is a Next.js 16 (App Router) application for a shipping container hunting cabin business. It consists of:
- **Marketing Site**: Public-facing pages for lead generation
- **Design Studio**: Interactive 2D/3D cabin layout editor
- **Admin Dashboard**: Staff dashboard for managing leads, quotes, and reservations
- **User Accounts**: Customer account system for saving designs
- **API Layer**: REST endpoints for forms, auth, and data operations

**Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma (SQLite/PostgreSQL), Stripe, Resend

---

## Quick Reference - Directory Map

```
src/
├── app/                          # Next.js App Router pages & API routes
│   ├── (marketing)/              # Public marketing pages (grouped route)
│   │   ├── page.tsx              # Homepage
│   │   ├── models/               # Product catalog pages
│   │   ├── process/              # Build process explanation
│   │   ├── plans/                # Floor plan comparison
│   │   ├── quote/                # Quote request form
│   │   ├── consultation/         # Consultation booking
│   │   ├── reserve/              # Deposit/reservation page
│   │   ├── faq/                  # FAQ page
│   │   ├── privacy/, terms/      # Legal pages
│   │   └── thank-you/            # Post-submission confirmation
│   ├── admin/                    # Staff admin dashboard
│   ├── design/                   # Design Studio pages
│   │   ├── page.tsx              # Main design studio entry
│   │   └── [id]/                 # Load specific saved design
│   ├── account/                  # Customer account pages
│   │   └── designs/              # User's saved designs list
│   ├── api/                      # API route handlers
│   │   ├── admin/                # Admin-only endpoints (auth-gated)
│   │   ├── auth/                 # User authentication (login/register/logout)
│   │   ├── catalog/              # Fixture catalog data
│   │   ├── designs/              # Design CRUD operations
│   │   ├── leads/                # Lead capture
│   │   ├── quotes/               # Quote requests
│   │   ├── consultations/        # Consultation requests
│   │   ├── reservations/         # Stripe checkout
│   │   └── stripe/               # Stripe webhooks
│   ├── globals.css               # Tailwind + design tokens
│   ├── layout.tsx                # Root layout
│   └── not-found.tsx             # 404 page
│
├── components/                   # React components
│   ├── design/                   # Design Studio components (22 files)
│   │   ├── DesignStudio.tsx      # Main editor orchestrator
│   │   ├── DesignStudioWrapper.tsx # Auth/data loading wrapper
│   │   ├── FixtureCanvas.tsx     # 2D SVG canvas with interactions
│   │   ├── Fixture2DRenderer.tsx # Custom SVG fixture rendering
│   │   ├── ThreeViewport.tsx     # 3D Three.js viewport
│   │   ├── FixtureLibrary.tsx    # Draggable fixture palette
│   │   ├── FixtureInspector.tsx  # Properties panel
│   │   ├── Toolbar.tsx           # Top toolbar (tools, view mode)
│   │   ├── LayersPanel.tsx       # Zone/fixture layers
│   │   ├── ValidationPanel.tsx   # Design validation warnings
│   │   ├── PriceSummaryPanel.tsx # Live pricing
│   │   └── ...                   # Other editor panels
│   ├── layout/                   # Site-wide layout components
│   │   ├── SiteHeader.tsx        # Navigation header
│   │   ├── SiteFooter.tsx        # Footer
│   │   └── PageContainer.tsx     # Content wrapper
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── providers/                # React context providers
│   │   └── ToastProvider.tsx     # Toast notification system
│   ├── *Form.tsx                 # Form components (Lead, Quote, Reservation, etc.)
│   ├── Hero.tsx                  # Homepage hero section
│   ├── ModelsGrid.tsx            # Model card grid
│   ├── ModelDetail.tsx           # Single model page content
│   └── ...                       # Other marketing components
│
├── lib/                          # Shared utilities & business logic
│   ├── design/                   # Design Studio logic (31 files)
│   │   ├── editor-reducer.ts     # State machine for editor actions
│   │   ├── geometry.ts           # Fixture geometry calculations
│   │   ├── validation.ts         # Design validation rules
│   │   ├── pricing.ts            # Price calculation
│   │   ├── templates.ts          # Zone templates & presets
│   │   ├── catalog-utils.ts      # Fixture catalog helpers
│   │   ├── zone-utils.ts         # Zone manipulation utilities
│   │   ├── three/                # Three.js 3D rendering
│   │   │   ├── SceneManager.ts   # Three.js scene setup
│   │   │   ├── ContainerWalls.ts # 3D container geometry
│   │   │   ├── FixtureRenderer.ts# 3D fixture rendering
│   │   │   ├── geometry/         # 3D geometry generators
│   │   │   │   ├── BathGeometry.ts
│   │   │   │   ├── KitchenGeometry.ts
│   │   │   │   ├── FurnitureGeometry.ts
│   │   │   │   └── ...
│   │   │   └── hooks/            # React hooks for Three.js
│   │   └── ...
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Admin authentication (JWT)
│   ├── user-auth.ts              # Customer authentication
│   ├── email.ts                  # Resend email client
│   ├── stripe.ts                 # Stripe checkout helpers
│   ├── validation.ts             # Zod schemas for forms
│   ├── env.ts                    # Environment variable validation
│   ├── format.ts                 # Number/currency formatting
│   └── utils.ts                  # General utilities
│
├── types/                        # TypeScript type definitions
│   ├── design.ts                 # Core design types (fixtures, zones, editor state)
│   └── model.ts                  # Product model types
│
prisma/
├── schema.prisma                 # Database schema (all models)
├── seed.ts                       # Demo data + fixture catalog
├── migrations/                   # Database migrations
└── prisma/dev.db                 # SQLite dev database

public/images/
├── models/                       # Product photography
│   ├── heroes/                   # Hero images for model pages
│   └── basecamp-40-real/         # Real photos
├── floorplans/                   # SVG floor plan diagrams
├── process-*.svg                 # Process timeline images
└── hero-*.svg                    # Homepage hero assets
```

---

## Detailed Breakdown

### 1. Marketing Site (`src/app/(marketing)/`)

The marketing site uses a route group `(marketing)` to share a common layout with navigation and footer.

| Route | Purpose | Key Components |
|-------|---------|----------------|
| `/` | Homepage with hero, models, process, FAQ | `Hero`, `ModelsGrid`, `ProcessTimeline`, `LeadCaptureForm` |
| `/models` | All cabin models listing | `ModelsGrid` |
| `/models/[slug]` | Individual model detail page | `ModelDetail`, `Gallery`, `FloorplanSelector` |
| `/plans` | Floor plan comparison | `PlansGallery` |
| `/process` | Build process explanation | `ProcessTimeline` |
| `/quote` | Quote request form | `QuoteForm` |
| `/consultation` | Consultation booking | `ConsultationForm` |
| `/reserve` | $5k deposit reservation | `ReservationForm` |
| `/faq` | Full FAQ page | `FAQAccordion` |

**Layout**: `src/app/(marketing)/layout.tsx` - Includes `SiteHeader` and `SiteFooter`

---

### 2. Design Studio (`src/components/design/`, `src/lib/design/`)

The Design Studio is an interactive 2D/3D editor for cabin layouts.

#### Entry Points
- **Page**: `src/app/design/page.tsx` - Main entry (loads catalog, handles auth)
- **Wrapper**: `src/components/design/DesignStudioWrapper.tsx` - Data loading
- **Main Component**: `src/components/design/DesignStudio.tsx` - Editor orchestration

#### Core Architecture
- **State Management**: `src/lib/design/editor-reducer.ts` - Reducer pattern for all design actions
- **Types**: `src/types/design.ts` - `DesignConfig`, `FixtureConfig`, `ZoneConfig`, `DesignAction`
- **Validation**: `src/lib/design/validation.ts` - Constraint checking
- **Pricing**: `src/lib/design/pricing.ts` - Live cost calculation

#### 2D Canvas
- **Canvas**: `src/components/design/FixtureCanvas.tsx` - SVG-based 2D view with drag/drop
- **Fixture Rendering**: `src/components/design/Fixture2DRenderer.tsx` - Custom SVG shapes for each fixture type
- **Geometry**: `src/lib/design/geometry.ts` - Rect/collision calculations

#### 3D Viewport
- **Viewport**: `src/components/design/ThreeViewport.tsx` - Three.js integration
- **Scene**: `src/lib/design/three/SceneManager.ts` - Three.js scene management
- **Fixtures**: `src/lib/design/three/FixtureRenderer.ts` - 3D fixture creation
- **Geometry Generators**: `src/lib/design/three/geometry/` - Per-category 3D shapes

#### Templates & Catalog
- **Zone Templates**: `src/lib/design/templates.ts` - Pre-built zone configurations (Basic/Standard/Ultimate tiers)
- **Fixture Catalog**: `prisma/seed.ts` - All available fixtures with dimensions and pricing

---

### 3. API Routes (`src/app/api/`)

All API routes use Next.js Route Handlers.

#### Public Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/leads` | POST | Lead capture form submission |
| `/api/quotes` | POST | Quote request submission |
| `/api/consultations` | POST | Consultation booking |
| `/api/reservations/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/catalog/modules` | GET | Fixture catalog for design studio |

#### User Auth Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/register` | POST | Create user account |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/designs` | GET/POST | List/create designs |
| `/api/designs/[id]` | GET/PATCH | Get/update design |
| `/api/designs/[id]/submit` | POST | Submit design for review |

#### Admin Endpoints (require admin session)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/login` | POST | Admin login |
| `/api/admin/logout` | POST | Admin logout |
| `/api/admin/leads` | GET | List leads |
| `/api/admin/quotes` | GET | List quote requests |
| `/api/admin/consultations` | GET | List consultations |
| `/api/admin/reservations` | GET | List reservations |

---

### 4. Database Layer (`prisma/`)

**Schema**: `prisma/schema.prisma`

#### Core Models
| Model | Purpose |
|-------|---------|
| `Model` | Product catalog (cabins) |
| `ModelImage` | Product gallery images |
| `Floorplan` | Floor plan variants per model |
| `Lead` | Marketing lead submissions |
| `QuoteRequest` | Detailed quote requests |
| `ConsultationRequest` | Consultation bookings |
| `Reservation` | Stripe deposit transactions |
| `AdminUser` | Staff login credentials |
| `User` | Customer accounts |
| `Design` | Saved cabin designs (JSON config) |
| `DesignSubmission` | Design review requests |
| `ModuleCatalog` | Fixture definitions (from seed) |

**Prisma Client**: `src/lib/db.ts` - Singleton instance

**Seed Data**: `prisma/seed.ts` - Creates demo models, fixtures, and default admin

---

### 5. Authentication

#### Admin Auth (`src/lib/auth.ts`)
- JWT-based, stored in HTTP-only cookie
- Functions: `adminLogin()`, `getAdminSession()`, `requireAdminSession()`
- Cookie name: `admin_session`

#### User Auth (`src/lib/user-auth.ts`)
- JWT-based, stored in HTTP-only cookie
- Functions: `userLogin()`, `userRegister()`, `getUserSession()`
- Cookie name: `user_session`

---

### 6. External Integrations

| Service | Location | Purpose |
|---------|----------|---------|
| **Stripe** | `src/lib/stripe.ts` | $5k deposit checkout sessions |
| **Resend** | `src/lib/email.ts` | Transactional emails (leads, confirmations) |
| **Prisma** | `src/lib/db.ts` | Database ORM |

---

## Common Tasks

### Add a new marketing page
1. Create `src/app/(marketing)/your-page/page.tsx`
2. Use `PageContainer` for consistent layout
3. Import components from `src/components/`

### Add a new fixture type
1. Add catalog entry in `prisma/seed.ts` (schemaJson with footprint, pricing)
2. Add 2D rendering in `src/components/design/Fixture2DRenderer.tsx`
3. Add 3D geometry in `src/lib/design/three/geometry/`
4. Run `npx prisma db seed` to update database

### Modify design editor behavior
1. Add new action type in `src/types/design.ts` (`DesignAction` union)
2. Handle action in `src/lib/design/editor-reducer.ts`
3. Dispatch action from component (e.g., `FixtureCanvas.tsx`)

### Add a new API endpoint
1. Create `src/app/api/your-route/route.ts`
2. Export `GET`, `POST`, etc. handlers
3. Use Prisma for data, Zod for validation

### Modify database schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your-migration-name`
3. Update seed if needed

### Add validation rules
1. Form validation: `src/lib/validation.ts` (Zod schemas)
2. Design validation: `src/lib/design/validation.ts` (constraint rules)

---

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Design types | `src/types/design.ts` |
| Editor state machine | `src/lib/design/editor-reducer.ts` |
| Fixture catalog (seed) | `prisma/seed.ts` |
| Zone templates | `src/lib/design/templates.ts` |
| 2D fixture rendering | `src/components/design/Fixture2DRenderer.tsx` |
| 3D scene setup | `src/lib/design/three/SceneManager.ts` |
| Database schema | `prisma/schema.prisma` |
| Form validation schemas | `src/lib/validation.ts` |
| Admin auth | `src/lib/auth.ts` |
| User auth | `src/lib/user-auth.ts` |
| Email sending | `src/lib/email.ts` |
| Stripe integration | `src/lib/stripe.ts` |
| Global styles | `src/app/globals.css` |

---

## Environment Variables

Required in `.env`:
```
DATABASE_URL=file:./prisma/dev.db
ADMIN_JWT_SECRET=your-32-char-secret
```

Optional (for full functionality):
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_ID_DEPOSIT=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_API_KEY=re_...
EMAIL_FROM_ADDRESS=noreply@example.com
INTERNAL_NOTIFICATIONS_EMAIL=team@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/...
```

---

## Development Commands

```bash
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint check
npx prisma studio     # Database GUI
npx prisma migrate dev --name <name>  # Create migration
npx prisma db seed    # Run seed script
```

---

## Architecture Notes

- **Server Components**: Marketing pages fetch Prisma data directly
- **Client Components**: Design Studio, forms, and interactive elements use `"use client"`
- **Styling**: Tailwind CSS 4 with design tokens in `globals.css`
- **Fonts**: Geist + Barlow Semi Condensed via `next/font`
- **Forms**: React Hook Form + Zod validation
- **Toast Notifications**: Context provider in `src/components/providers/ToastProvider.tsx`

---

*Last updated: November 2025*


