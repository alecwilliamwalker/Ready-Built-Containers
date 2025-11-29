/**
 * Helper script to update basic templates from exported design JSON
 * 
 * Usage:
 * 1. Click "Export Template" in the design studio
 * 2. Paste the JSON into the `exportedData` variable below
 * 3. Send this file to the AI assistant to update the templates
 */

import type { ZoneTemplateConfig } from "./templates";

// PASTE YOUR EXPORTED DESIGN JSON HERE
const exportedData = {
    "shell": {
        "id": "shell-40",
        "lengthFt": 40,
        "widthFt": 8,
        "heightFt": 9.5
    },
    "zones": [
        {
            "id": "kitchen-living",
            "name": "Kitchen & Living",
            "lengthFt": 21.75,
            "widthFt": 8,
            "fixtures": []
        },
        {
            "id": "bath-hallway",
            "name": "Bath",
            "lengthFt": 7.75,
            "widthFt": 6,
            "fixtures": []
        },
        {
            "id": "hallway",
            "name": "Hallway",
            "lengthFt": 7.75,
            "widthFt": 2,
            "fixtures": []
        },
        {
            "id": "bedroom",
            "name": "Bedroom",
            "lengthFt": 10.5,
            "widthFt": 8,
            "fixtures": []
        }
    ]
};

/**
 * Formats the fixtures array for easy copy-paste into templates.ts
 */
function formatFixturesForTemplate(zoneName: string) {
    const zone = exportedData.zones.find(z => z.id === zoneName);
    if (!zone || !zone.fixtures || zone.fixtures.length === 0) {
        return "[]";
    }

    const fixturesStr = zone.fixtures.map(fixture => {
        return `    {
      id: "${fixture.id}",
      catalogKey: "${fixture.catalogKey}",
      xFt: ${fixture.xFt},
      yFt: ${fixture.yFt},
      rotationDeg: ${fixture.rotationDeg},
    }`;
    }).join(',\n');

    return `[\n${fixturesStr}\n  ]`;
}

// Generate formatted output for each zone
console.log("=== UPDATE THESE IN templates.ts ===\n");

console.log("// kitchenLivingBasic.fixtures:");
console.log(formatFixturesForTemplate("kitchen-living"));
console.log("\n");

console.log("// bathHallwayBasic.fixtures:");
console.log(formatFixturesForTemplate("bath-hallway"));
console.log("\n");

console.log("// hallwayBasic.fixtures:");
console.log(formatFixturesForTemplate("hallway"));
console.log("\n");

console.log("// bedroomBasic.fixtures:");
console.log(formatFixturesForTemplate("bedroom"));
console.log("\n");

export { };
