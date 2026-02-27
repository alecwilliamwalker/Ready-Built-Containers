import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedModels() {
  // Delete old models that are no longer used
  await prisma.model.deleteMany({
    where: {
      slug: {
        in: ["basecamp-20", "basecamp-40", "outfitter-40-plus", "deluxe"]
      }
    }
  });

  const models = [
    {
      slug: "hc20",
      name: "20' High Cube",
      tagline: "Compact off-grid basecamp",
      description:
        "The ideal basecamp for solo hunters or couples. This 20' high-cube ISO shell features a locking vestibule entry, insulated interior, compact galley, and sleeping area for two. Prewired for solar and generator with cistern-ready plumbing—drop it on your land and go off-grid immediately.",
      lengthFt: 20,
      sleeps: 2,
      hasBathroom: false,
      hasKitchen: true,
      basePrice: 2900000,
      images: [
        {
          url: "/images/models/standard/exterior-front-deck.jpg",
          alt: "20' High Cube front exterior",
          sortOrder: 0,
        },
        {
          url: "/images/models/standard/interior-living-room.jpg",
          alt: "20' High Cube interior living space",
          sortOrder: 1,
        },
        {
          url: "/images/models/standard/exterior-yard-context.jpg",
          alt: "20' High Cube in remote setting",
          sortOrder: 2,
        },
      ],
      floorplans: [
        {
          name: "20' Basecamp Layout",
          description: "Locking vestibule entry, compact galley, and sleeping area with gear storage.",
          imageUrl: "/images/floorplans/hc20-plan.svg",
          isDefault: true,
        },
      ],
    },
    {
      slug: "hc40",
      name: "40' High Cube",
      tagline: "Full-featured off-grid cabin",
      description:
        "Our flagship 40' high-cube ISO shell with everything you need for extended off-grid stays. Locking container doors protect the insulated man-door entry, leading into a warm living space with full galley kitchen, center hallway with full bathroom, and rear bunk room sleeping four. Complete off-grid package includes solar prewiring, generator input, cistern-ready plumbing, and holding tank rough-ins.",
      lengthFt: 40,
      sleeps: 4,
      hasBathroom: true,
      hasKitchen: true,
      basePrice: 5100000,
      images: [
        {
          url: "/images/models/standard/exterior-front-deck.jpg",
          alt: "40' High Cube front exterior deck and entry",
          sortOrder: 0,
        },
        {
          url: "/images/models/standard/interior-living-room.jpg",
          alt: "40' High Cube living room interior",
          sortOrder: 1,
        },
        {
          url: "/images/models/standard/interior-living-corner.jpg",
          alt: "40' High Cube living corner detail",
          sortOrder: 2,
        },
        {
          url: "/images/models/standard/interior-hallway-kitchen.jpg",
          alt: "40' High Cube hallway to kitchen interior",
          sortOrder: 3,
        },
        {
          url: "/images/models/standard/interior-bathroom.jpg",
          alt: "40' High Cube bathroom interior",
          sortOrder: 4,
        },
        {
          url: "/images/models/standard/interior-shower.jpg",
          alt: "40' High Cube shower interior",
          sortOrder: 5,
        },
        {
          url: "/images/models/standard/interior-bunk-room.jpg",
          alt: "40' High Cube bunk room interior",
          sortOrder: 6,
        },
        {
          url: "/images/models/standard/interior-bunk-storage.jpg",
          alt: "40' High Cube bunk storage interior",
          sortOrder: 7,
        },
        {
          url: "/images/models/standard/exterior-entry-closeup.jpg",
          alt: "40' High Cube entry closeup detail",
          sortOrder: 8,
        },
        {
          url: "/images/models/standard/exterior-rear.jpg",
          alt: "40' High Cube rear exterior bunk area",
          sortOrder: 9,
        },
        {
          url: "/images/models/standard/exterior-yard-context.jpg",
          alt: "40' High Cube in yard context",
          sortOrder: 10,
        },
      ],
      floorplans: [
        {
          name: "40' Bunk Layout",
          description: "Secure vestibule entry, living + galley front half, hall bath mid, four bunks aft.",
          imageUrl: "/images/floorplans/hc40-plan.svg",
          isDefault: true,
        },
      ],
    },
    {
      slug: "standard",
      name: "Standard",
      tagline: "40' standard cabin with full amenities",
      description:
        "Our standard 40' high-cube ISO shell with everything you need for extended off-grid stays. Locking container doors protect the insulated man-door entry, leading into a warm living space with full galley kitchen, center hallway with full bathroom, and rear bunk room sleeping four.",
      lengthFt: 40,
      sleeps: 4,
      hasBathroom: true,
      hasKitchen: true,
      basePrice: 5100000,
      images: [
        {
          url: "/images/models/standard/exterior-front-deck.jpg",
          alt: "Standard front exterior deck and entry",
          sortOrder: 0,
        },
        {
          url: "/images/models/standard/interior-living-room.jpg",
          alt: "Standard living room interior",
          sortOrder: 1,
        },
      ],
      floorplans: [
        {
          name: "Standard Layout",
          description: "Secure vestibule entry, living + galley front half, hall bath mid, four bunks aft.",
          imageUrl: "/images/floorplans/hc40-plan.svg",
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
  const email = process.env.SEED_ADMIN_EMAIL ?? "readybuiltcontainers@gmail.com";
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
