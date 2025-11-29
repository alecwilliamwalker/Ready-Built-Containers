import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedModels() {
  const models = [
    {
      slug: "basecamp-20",
      name: "Basecamp 20",
      tagline: "Compact steel cabin for remote scouting bases",
      description:
        "A nimble 20' high-cube container refitted with a secure entry, efficient galley kitchen, and convertible bunks. Ideal for single hunters or a tight-knit crew needing a heated, dry basecamp.",
      lengthFt: 20,
      sleeps: 2,
      hasBathroom: false,
      hasKitchen: true,
      basePrice: 6200000,
      images: [
        {
          url: "/images/models/heroes/basecamp-20-hero.jpg",
          alt: "Basecamp 20 hero exterior",
          sortOrder: 0,
        },
      ],
      floorplans: [
        {
          name: "Base Layout",
          description: "Direct entry, galley living core, optional bath bay, and rear bunks.",
          imageUrl: "/images/floorplans/basecamp-20-plan.svg",
          isDefault: true,
        },
      ],
    },
    {
      slug: "basecamp-40",
      name: "Basecamp 40",
      tagline: "Flagship 40' cabin with full amenities",
      description:
        "Our most-requested layout: locking container doors shield the man-door entry, leading into a warm living space with kitchen, a center hall and full bathroom, and a rear bunk room with four stacked bunks and gear storage.",
      lengthFt: 40,
      sleeps: 4,
      hasBathroom: true,
      hasKitchen: true,
      basePrice: 11800000,
      images: [
        {
          url: "/images/models/basecamp-40-real/exterior-front-deck.jpg",
          alt: "Basecamp 40 front exterior deck and entry",
          sortOrder: 0,
        },
        {
          url: "/images/models/basecamp-40-real/exterior-full-length.jpg",
          alt: "Basecamp 40 full length exterior side view",
          sortOrder: 1,
        },
        {
          url: "/images/models/basecamp-40-real/exterior-entry-closeup.jpg",
          alt: "Basecamp 40 entry closeup detail",
          sortOrder: 2,
        },
        {
          url: "/images/models/basecamp-40-real/exterior-rear.jpg",
          alt: "Basecamp 40 rear exterior bunk area",
          sortOrder: 3,
        },
        {
          url: "/images/models/basecamp-40-real/exterior-yard-context.jpg",
          alt: "Basecamp 40 in yard context",
          sortOrder: 4,
        },
        {
          url: "/images/models/basecamp-40-real/interior-living-room.jpg",
          alt: "Basecamp 40 living room interior",
          sortOrder: 5,
        },
        {
          url: "/images/models/basecamp-40-real/interior-hallway-kitchen.jpg",
          alt: "Basecamp 40 hallway to kitchen interior",
          sortOrder: 6,
        },
        {
          url: "/images/models/basecamp-40-real/interior-living-corner.jpg",
          alt: "Basecamp 40 living corner detail",
          sortOrder: 7,
        },
        {
          url: "/images/models/basecamp-40-real/interior-bunk-room.jpg",
          alt: "Basecamp 40 bunk room interior",
          sortOrder: 8,
        },
        {
          url: "/images/models/basecamp-40-real/interior-bunk-storage.jpg",
          alt: "Basecamp 40 bunk storage interior",
          sortOrder: 9,
        },
        {
          url: "/images/models/basecamp-40-real/interior-bathroom.jpg",
          alt: "Basecamp 40 bathroom interior",
          sortOrder: 10,
        },
        {
          url: "/images/models/basecamp-40-real/interior-shower.jpg",
          alt: "Basecamp 40 shower interior",
          sortOrder: 11,
        },
      ],
      floorplans: [
        {
          name: "Standard Bunk Layout",
          description: "Secure entry with living + galley front half, hall bath mid, four bunks aft.",
          imageUrl: "/images/floorplans/basecamp-40-plan.svg",
          isDefault: true,
        },
      ],
    },
    {
      slug: "outfitter-40-plus",
      name: "Outfitter 40 Plus",
      tagline: "Gear-forward layout with dual entries",
      description:
        "Designed for outfitters that rotate hunters weekly. Adds a gear area, enlarged galley, and split bunks with dedicated firearm lockers. Reinforced framing for rooftop solar array and observation deck access.",
      lengthFt: 40,
      sleeps: 6,
      hasBathroom: true,
      hasKitchen: true,
      basePrice: 14900000,
      images: [
        {
          url: "/images/models/heroes/outfitter-40-plus-hero.jpg",
          alt: "Outfitter 40 Plus hero exterior",
          sortOrder: 0,
        },
      ],
      floorplans: [
        {
          name: "Guide Team Layout",
          description: "Gear area, extended galley lounge, full bath, and six-pack bunk bay with dual egress.",
          imageUrl: "/images/floorplans/outfitter-40-plus-plan.svg",
          isDefault: true,
        },
      ],
    },
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: { slug: model.slug },
      update: {
        name: model.name,
        tagline: model.tagline,
        description: model.description,
        lengthFt: model.lengthFt,
        sleeps: model.sleeps,
        hasBathroom: model.hasBathroom,
        hasKitchen: model.hasKitchen,
        basePrice: model.basePrice,
        isActive: true,
        images: {
          deleteMany: {},
          create: model.images.map((image) => ({
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder,
          })),
        },
        floorplans: {
          deleteMany: {},
          create: model.floorplans.map((floorplan) => ({
            name: floorplan.name,
            description: floorplan.description,
            imageUrl: floorplan.imageUrl,
            isDefault: floorplan.isDefault,
          })),
        },
      },
      create: {
        slug: model.slug,
        name: model.name,
        tagline: model.tagline,
        description: model.description,
        lengthFt: model.lengthFt,
        sleeps: model.sleeps,
        hasBathroom: model.hasBathroom,
        hasKitchen: model.hasKitchen,
        basePrice: model.basePrice,
        images: {
          create: model.images,
        },
        floorplans: {
          create: model.floorplans,
        },
      },
    });
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@readybuiltcontainers.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "readybuilt2025";
  const hashed = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      password: hashed,
    },
    create: {
      email,
      password: hashed,
    },
  });
}

async function seedModuleCatalog() {
  // Clear existing catalog items first (upsert doesn't delete removed items)
  await prisma.moduleCatalog.deleteMany({});
  
  const modules = [
    {
      key: "module-vestibule",
      name: "Entry",
      category: "access",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 0.67, width: 8 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 0.5, back: 3, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 185000,
      },
    },
    {
      key: "module-window",
      name: "Insulated Window",
      category: "opening",
      schemaJson: {
        type: "opening",
        widthFt: 3,
        heightFt: 4,
        minSpacingFt: 2,
      },
      priceRuleJson: {
        baseCents: 45000,
      },
    },
    {
      key: "module-door",
      name: "Man Door",
      category: "opening",
      schemaJson: {
        type: "opening",
        widthFt: 3,
        heightFt: 7,
        requiresEdge: true,
      },
      priceRuleJson: {
        baseCents: 125000,
      },
    },
    // Interior walls (used by wall drawing tool, hidden from fixture library)
    {
      key: "fixture-wall",
      name: "Interior Wall",
      category: "interior",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 4, width: 0.25 },  // Default 4ft, thin
        footprintAnchor: "center",
        mount: "floor",
        isWall: true,  // Flag for special wall handling
        defaultMaterial: "drywall",  // Default material type
        minClearanceFt: { front: 0, back: 0, left: 0, right: 0 },
        hidden: true,  // Hide from fixture library - walls are drawn, not placed
      },
      priceRuleJson: {
        baseCents: 35000,
        perLinearFtCents: 8000,
      },
    },
    // Opening fixtures (doors)
    {
      key: "fixture-interior-door",
      name: "Interior Door",
      category: "opening",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 0.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 2, left: 0, right: 0 },
      },
      priceRuleJson: {
        baseCents: 35000,
      },
    },
    {
      key: "fixture-exterior-door",
      name: "Exterior Door",
      category: "opening",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 0.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 3, back: 2, left: 0, right: 0 },
      },
      priceRuleJson: {
        baseCents: 95000,
      },
    },
    // Bath fixtures
    {
      key: "fixture-toilet",
      name: "Toilet",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 1.5 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["water", "waste"],
        minClearanceFt: { front: 1.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 45000,
      },
    },
    {
      key: "fixture-shower-36x36",
      name: "Shower 36x36",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 3 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["water", "waste", "vent"],
        minClearanceFt: { front: 1, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 125000,
      },
    },
    {
      key: "fixture-vanity-24",
      name: "Vanity 24\"",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 1.5 },
        footprintAnchor: "center",
        mount: "wall",
        utilities: ["water", "waste"],
        minClearanceFt: { front: 2, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 85000,
      },
    },
    {
      key: "fixture-vanity-30",
      name: "Vanity 30\"",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2.5, width: 1.5 },
        footprintAnchor: "center",
        mount: "wall",
        utilities: ["water", "waste"],
        minClearanceFt: { front: 2, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 95000,
      },
    },
    // Galley fixtures
    {
      key: "fixture-sink-base",
      name: "Sink Base Cabinet",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 2 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["water", "waste"],
        minClearanceFt: { front: 2.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 65000,
      },
    },
    {
      key: "fixture-fridge-24",
      name: "Refrigerator 24\"",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 2 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["power"],
        minClearanceFt: { front: 2, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 125000,
      },
    },
    {
      key: "fixture-range-30",
      name: "Range 30\"",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2.5, width: 2 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["power", "vent"],
        minClearanceFt: { front: 2.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 95000,
      },
    },
    {
      key: "fixture-cabinet-run-24",
      name: "Base Cabinet Run 24\"",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 2 },
        footprintAnchor: "front-left",
        mount: "floor",
        minClearanceFt: { front: 2.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 45000,
        perLinearFtCents: 15000,
      },
    },
    {
      key: "fixture-cabinet-run-30",
      name: "Base Cabinet Run 30\"",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2.5, width: 2 },
        footprintAnchor: "front-left",
        mount: "floor",
        minClearanceFt: { front: 2.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 55000,
        perLinearFtCents: 15000,
      },
    },
    {
      key: "fixture-upper-cabinet-24",
      name: "Upper Cabinet 24\"",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 1 },
        footprintAnchor: "front-left",
        mount: "wall",
        minClearanceFt: { front: 0.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 35000,
        perLinearFtCents: 12000,
      },
    },
    {
      key: "fixture-table-48",
      name: "Dining Table 48\"",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 4, width: 3 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 2, left: 1.5, right: 1.5 },
      },
      priceRuleJson: {
        baseCents: 45000,
      },
    },
    {
      key: "fixture-island-48",
      name: "Kitchen Island 48\"",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 4, width: 2.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 3, back: 3, left: 2, right: 2 },
      },
      priceRuleJson: {
        baseCents: 125000,
      },
    },
    {
      key: "fixture-sofa-72",
      name: "Sofa 72\"",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 6 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 1, left: 1, right: 1 },
      },
      priceRuleJson: {
        baseCents: 85000,
      },
    },
    {
      key: "fixture-recliner",
      name: "Recliner",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 3 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 1, left: 1, right: 1 },
      },
      priceRuleJson: {
        baseCents: 65000,
      },
    },
    {
      key: "fixture-bench-36",
      name: "Bench 36\"",
      category: "storage",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 1.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 1.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 25000,
      },
    },
    // Sleep fixtures
    {
      key: "fixture-bed-twin",
      name: "Twin Bed",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 6.5, width: 3.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 1, left: 1.5, right: 1.5 },
      },
      priceRuleJson: {
        baseCents: 65000,
      },
    },
    {
      key: "fixture-bed-full",
      name: "Full Bed",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 6.5, width: 4.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 1, left: 1.5, right: 1.5 },
      },
      priceRuleJson: {
        baseCents: 75000,
      },
    },
    {
      key: "fixture-bed-queen",
      name: "Queen Bed",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 6.5, width: 5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 1, left: 1.5, right: 1.5 },
      },
      priceRuleJson: {
        baseCents: 85000,
      },
    },
    {
      key: "fixture-desk-48",
      name: "Desk 48\"",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 4, width: 2 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2.5, back: 1, left: 1, right: 1 },
      },
      priceRuleJson: {
        baseCents: 45000,
      },
    },
    {
      key: "fixture-chair-desk",
      name: "Desk Chair",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 2 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 1.5, back: 1, left: 1, right: 1 },
      },
      priceRuleJson: {
        baseCents: 15000,
      },
    },
    // Additional appliances
    {
      key: "fixture-dishwasher",
      name: "Dishwasher",
      category: "fixture-galley",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 2 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["water", "waste", "power"],
        minClearanceFt: { front: 2.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 75000,
      },
    },
    {
      key: "fixture-washer",
      name: "Washer",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2.5, width: 2.5 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["water", "waste", "power"],
        minClearanceFt: { front: 2, back: 1, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 95000,
      },
    },
    {
      key: "fixture-dryer",
      name: "Dryer",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2.5, width: 2.5 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["power", "vent"],
        minClearanceFt: { front: 2, back: 1, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 85000,
      },
    },
    {
      key: "fixture-tub-60",
      name: "Bathtub 60\"",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 5, width: 2.5 },
        footprintAnchor: "center",
        mount: "floor",
        utilities: ["water", "waste"],
        minClearanceFt: { front: 2, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 145000,
      },
    },
    // Windows (price includes $150 framing surcharge for rough opening)
    {
      key: "fixture-window-24x36",
      name: "Window 24x36",
      category: "opening",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 0.5 },
        footprintAnchor: "center",
        mount: "wall",
        minClearanceFt: { front: 0, back: 0, left: 1, right: 1 },
      },
      priceRuleJson: {
        baseCents: 50000, // $350 window + $150 framing = $500
      },
    },
    {
      key: "fixture-window-36x48",
      name: "Window 36x48",
      category: "opening",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 0.5 },
        footprintAnchor: "center",
        mount: "wall",
        minClearanceFt: { front: 0, back: 0, left: 1, right: 1 },
      },
      priceRuleJson: {
        baseCents: 60000, // $450 window + $150 framing = $600
      },
    },
    {
      key: "fixture-bench-48",
      name: "Bench 48\"",
      category: "storage",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 4, width: 1.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 1.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 35000,
      },
    },
    // Vestibule fixtures
    {
      key: "fixture-coat-rack",
      name: "Wall Coat Rack",
      category: "storage",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 1.5, width: 0.5 },
        footprintAnchor: "center",
        mount: "wall",
        minClearanceFt: { front: 1, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 15000,
      },
    },
    {
      key: "fixture-storage-cubbies",
      name: "Storage Cubby System",
      category: "storage",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 1.5, width: 1.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 1.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 45000,
      },
    },
    // Additional bath fixtures
    {
      key: "fixture-linen-cabinet",
      name: "Linen Cabinet",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 1.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 1, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 65000,
      },
    },
    {
      key: "fixture-vanity-60-double",
      name: "Double Vanity 60\"",
      category: "fixture-bath",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 5, width: 1.5 },
        footprintAnchor: "center",
        mount: "wall",
        utilities: ["water", "waste"],
        minClearanceFt: { front: 2.5, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 185000,
      },
    },
    {
      key: "fixture-bunk-twin",
      name: "Twin Bunk Bed",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 6.5, width: 3.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 0.5, left: 1, right: 1 },
      },
      priceRuleJson: {
        baseCents: 65000,
      },
    },
    {
      key: "fixture-nightstand",
      name: "Nightstand",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 2, width: 1.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 1, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 15000,
      },
    },
    {
      key: "fixture-dresser-36",
      name: "Dresser 36\"",
      category: "fixture-sleep",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 3, width: 1.5 },
        footprintAnchor: "center",
        mount: "floor",
        minClearanceFt: { front: 2, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 45000,
      },
    },
    {
      key: "fixture-closet-system-72",
      name: "Closet System 72\"",
      category: "storage",
      schemaJson: {
        type: "fixture",
        footprintFt: { length: 6, width: 2 },
        footprintAnchor: "center",
        mount: "wall",
        minClearanceFt: { front: 2, back: 0.5, left: 0.5, right: 0.5 },
      },
      priceRuleJson: {
        baseCents: 95000,
      },
    },
  ];

  for (const module of modules) {
    await prisma.moduleCatalog.upsert({
      where: { key: module.key },
      update: {
        name: module.name,
        category: module.category,
        schemaJson: module.schemaJson,
        priceRuleJson: module.priceRuleJson,
      },
      create: module,
    });
  }
}

async function main() {
  await seedModels();
  await seedAdmin();
  await seedModuleCatalog();
  console.log("Database seeded with demo models, admin user, and module catalog.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
