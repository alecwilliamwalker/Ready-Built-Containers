import type { DesignConfig, ZoneConfig, ZoneConstraints } from "@/types/design";

export type ZoneType = "kitchen-living" | "bathroom" | "hallway" | "bath-hallway" | "bedroom";

// Zone constraints - defines min/max sizes and whether zone can be resized
export const ZONE_CONSTRAINTS: Record<ZoneType, ZoneConstraints> = {
    "kitchen-living": { minLengthFt: 10, maxLengthFt: 24, canResize: true },
    bathroom: { minLengthFt: 4, maxLengthFt: 12, canResize: true },
    hallway: { minLengthFt: 2, maxLengthFt: 8, canResize: true },
    bedroom: { minLengthFt: 8, maxLengthFt: 16, canResize: true },
    "bath-hallway": { minLengthFt: 8, maxLengthFt: 14, canResize: true }, // deprecated but supported
};

/**
 * Get zone type from zone ID (assumes ID format like "kitchen-living", "bedroom", etc.)
 */
export function getZoneType(zoneId: string): ZoneType | null {
    const normalized = zoneId.toLowerCase();
    if (normalized in ZONE_CONSTRAINTS) {
        return normalized as ZoneType;
    }
    return null;
}

/**
 * Validate if a zone resize is allowed based on constraints
 */
export function canResizeZone(
    zone: ZoneConfig,
    newLengthFt: number
): { valid: boolean; reason?: string } {
    const zoneType = getZoneType(zone.id);
    if (!zoneType) {
        return { valid: false, reason: "Unknown zone type" };
    }

    const constraints = zone.constraints || ZONE_CONSTRAINTS[zoneType];

    if (!constraints.canResize) {
        return { valid: false, reason: "Zone cannot be resized" };
    }

    if (newLengthFt < constraints.minLengthFt) {
        return { valid: false, reason: `Minimum size is ${constraints.minLengthFt}ft` };
    }

    if (constraints.maxLengthFt && newLengthFt > constraints.maxLengthFt) {
        return { valid: false, reason: `Maximum size is ${constraints.maxLengthFt}ft` };
    }

    return { valid: true };
}

/**
 * Resize a zone and adjust adjacent zones to maintain total length
 */
export function resizeZone(
    design: DesignConfig,
    zoneId: string,
    newLengthFt: number
): DesignConfig {
    const shellLength = design.shell.lengthFt;
    const zones = [...design.zones];
    const zoneIndex = zones.findIndex((z) => z.id === zoneId);

    if (zoneIndex === -1) {
        return design;
    }

    const zone = zones[zoneIndex];
    const validation = canResizeZone(zone, newLengthFt);

    if (!validation.valid) {
        console.warn(`Cannot resize zone: ${validation.reason}`);
        return design;
    }

    const oldLength = zone.lengthFt;
    const deltaLength = newLengthFt - oldLength;

    // Update the zone being resized
    zones[zoneIndex] = { ...zone, lengthFt: newLengthFt };

    // Adjust the next zone to compensate (if exists)
    if (zoneIndex < zones.length - 1) {
        const nextZone = zones[zoneIndex + 1];
        const nextNewLength = nextZone.lengthFt - deltaLength;

        const nextValidation = canResizeZone(nextZone, nextNewLength);
        if (!nextValidation.valid) {
            console.warn(`Cannot adjust adjacent zone: ${nextValidation.reason}`);
            return design;
        }

        zones[zoneIndex + 1] = { ...nextZone, lengthFt: nextNewLength };
    } else if (zoneIndex > 0) {
        // If it's the last zone, adjust the previous one
        const prevZone = zones[zoneIndex - 1];
        const prevNewLength = prevZone.lengthFt - deltaLength;

        const prevValidation = canResizeZone(prevZone, prevNewLength);
        if (!prevValidation.valid) {
            console.warn(`Cannot adjust adjacent zone: ${prevValidation.reason}`);
            return design;
        }

        zones[zoneIndex - 1] = { ...prevZone, lengthFt: prevNewLength };
    }

    // Recalculate zone xFt positions
    let currentX = 0;
    const repositionedZones = zones.map((z) => {
        const updated = { ...z, xFt: currentX };
        currentX += z.lengthFt;
        return updated;
    });

    // Verify total length matches shell
    const totalLength = repositionedZones.reduce((sum, z) => sum + z.lengthFt, 0);
    if (Math.abs(totalLength - shellLength) > 0.01) {
        console.warn(`Zone resize would create invalid total length: ${totalLength}ft vs ${shellLength}ft`);
        return design;
    }

    // Update fixtures to maintain their position relative to their zone
    const updatedFixtures = design.fixtures.map((fixture) => {
        const fixtureZoneIndex = repositionedZones.findIndex((z) => z.id === fixture.zone);
        if (fixtureZoneIndex === -1) return fixture;

        const oldZone = zones.find((z) => z.id === fixture.zone);
        const newZone = repositionedZones[fixtureZoneIndex];

        if (!oldZone || !newZone) return fixture;

        // Calculate relative position within zone (0 to 1)
        const relativePos = (fixture.xFt - oldZone.xFt) / oldZone.lengthFt;

        // Apply to new zone dimensions
        const newXFt = newZone.xFt + (relativePos * newZone.lengthFt);

        return { ...fixture, xFt: newXFt };
    });

    return {
        ...design,
        zones: repositionedZones,
        fixtures: updatedFixtures,
    };
}

/**
 * Get the zone boundary positions for rendering resize handles
 */
export function getZoneBoundaries(zones: ZoneConfig[]): Array<{ x: number; leftZoneId: string; rightZoneId: string }> {
    const boundaries: Array<{ x: number; leftZoneId: string; rightZoneId: string }> = [];

    for (let i = 0; i < zones.length - 1; i++) {
        const leftZone = zones[i];
        const rightZone = zones[i + 1];
        const boundaryX = leftZone.xFt + leftZone.lengthFt;

        boundaries.push({
            x: boundaryX,
            leftZoneId: leftZone.id,
            rightZoneId: rightZone.id,
        });
    }

    return boundaries;
}
