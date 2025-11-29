# 2D Fixture Catalog

This document describes all the custom 2D SVG renderings available in the design studio.

## Bathroom Fixtures

### Toilet (`fixture-toilet`)
- **Dimensions**: 2' × 1.5'
- **Rendering**: Tank + bowl + seat with elliptical shapes
- **Details**: Realistic proportions with separate tank and bowl sections
- **Price**: $450

### Shower (`fixture-shower-36x36`)
- **Dimensions**: 3' × 3'
- **Rendering**: Square base with center drain and 8 drain holes in circular pattern
- **Details**: Shower head indicator in corner
- **Price**: $1,250

### Vanity (`fixture-vanity-24`, `fixture-vanity-30`)
- **Dimensions**: 24" (2' × 1.5') or 30" (2.5' × 1.5')
- **Rendering**: Cabinet base with countertop, sink bowl, faucet, and door handles
- **Details**: Vertical door divider, dual handles
- **Price**: $850 (24") / $950 (30")

### Bathtub (`fixture-tub-60`)
- **Dimensions**: 5' × 2.5'
- **Rendering**: Rounded tub outline with inner basin, faucet, and drain
- **Details**: Faucet at one end, drain at other
- **Price**: $1,450

### Washer/Dryer (`fixture-washer`, `fixture-dryer`)
- **Dimensions**: 2.5' × 2.5' each
- **Rendering**: Front-load style with circular door/window, inner drum, control panel
- **Details**: 3 control buttons on top panel
- **Price**: $950 (washer) / $850 (dryer)

## Kitchen/Galley Fixtures

### Sink Base Cabinet (`fixture-sink-base`)
- **Dimensions**: 2' × 2'
- **Rendering**: Cabinet with countertop, sink bowl, faucet, and door handles
- **Details**: Similar to vanity but kitchen-sized
- **Price**: $650

### Refrigerator (`fixture-fridge-24`)
- **Dimensions**: 2' × 2'
- **Rendering**: Rectangular body with freezer divider line, door handles, water dispenser
- **Details**: Two handles (freezer + fridge), dispenser outline on top section
- **Price**: $1,250

### Range/Stove (`fixture-range-30`)
- **Dimensions**: 2.5' × 2'
- **Rendering**: 4 burners in grid pattern, control panel at top
- **Details**: Circular burners with control strip
- **Price**: $950

### Dishwasher (`fixture-dishwasher`)
- **Dimensions**: 2' × 2'
- **Rendering**: Control panel at top, horizontal handle, rack lines
- **Details**: 3 rack indicator lines
- **Price**: $750

### Base Cabinet Run (`fixture-cabinet-run-24`, `fixture-cabinet-run-30`)
- **Dimensions**: 24" (2' × 2') or 30" (2.5' × 2')
- **Rendering**: Shelves/doors with vertical divider, multiple handles
- **Details**: Grid of 6 handles (2 columns × 3 rows)
- **Price**: $450 + $150/ft (24") / $550 + $150/ft (30")

### Dining Table (`fixture-table-48`)
- **Dimensions**: 4' × 3'
- **Rendering**: Table top with edge detail and 4 corner legs
- **Details**: Simple table representation
- **Price**: $450

### Kitchen Island (`fixture-island-48`)
- **Dimensions**: 4' × 2.5'
- **Rendering**: Similar to cabinet but larger, with shelves and handles
- **Details**: Center piece for galley layouts
- **Price**: $1,250

## Bedroom/Sleep Fixtures

### Beds (`fixture-bed-twin`, `fixture-bed-full`, `fixture-bed-queen`)
- **Dimensions**: 
  - Twin: 6.5' × 3.5'
  - Full: 6.5' × 4.5'
  - Queen: 6.5' × 5'
- **Rendering**: Frame + mattress outline + 2 pillows + bedding lines
- **Details**: Pillows at head, 3 horizontal bedding lines
- **Price**: $650 (twin) / $750 (full) / $850 (queen)

### Desk (`fixture-desk-48`)
- **Dimensions**: 4' × 2'
- **Rendering**: Table top with edge and 4 corner legs
- **Details**: Similar to table but smaller
- **Price**: $450

### Chair (`fixture-chair-desk`)
- **Dimensions**: 2' × 2'
- **Rendering**: Seat + backrest + 2 front legs
- **Details**: Simple chair profile
- **Price**: $150

### Sofa (`fixture-sofa-72`)
- **Dimensions**: 6' × 3'
- **Rendering**: Large rectangular seating with backrest
- **Details**: Living room seating
- **Price**: $850

## Openings

### Doors (`fixture-interior-door`, `fixture-exterior-door`)
- **Dimensions**: 3' × 0.5'
- **Rendering**: Door frame + panel + handle + swing arc (if open)
- **Details**: Handle on right side, dashed arc shows swing path
- **Price**: $350 (interior) / $950 (exterior)

### Windows (`fixture-window-24x36`, `fixture-window-36x48`)
- **Dimensions**: 24" (2' × 0.5') or 36" (3' × 0.5')
- **Rendering**: Frame with cross panes (4 sections) + glass reflection
- **Details**: White reflection line for glass effect
- **Price**: $350 (24") / $450 (36")

## Storage

### Bench (`fixture-bench-36`, `fixture-bench-48`)
- **Dimensions**: 36" (3' × 1.5') or 48" (4' × 1.5')
- **Rendering**: Cabinet with shelves, divider, and handles
- **Details**: Multi-purpose storage seating
- **Price**: $250 (36") / $350 (48")

### Cabinet/Storage (`fixture-cabinet-*`, `storage-*`)
- **Rendering**: Rectangular body with shelf lines, vertical divider, multiple handles
- **Details**: Grid pattern of handles indicates doors/drawers
- **Varies by size**

## Rendering Features

All 2D fixtures include:

1. **Scale Accuracy**: All dimensions are rendered to scale (32px per foot)
2. **State Indicators**:
   - Selected: Cyan highlight (#22d3ee) with thicker stroke
   - Error: Red highlight (#ef4444) with error fill
   - Hovered: Shows dimension annotations
3. **Interactive Elements**: Pointer events for drag, select, hover
4. **Detail Level**: Appropriate detail for plan view (not too cluttered)
5. **Color Coding**: Consistent stroke/fill colors based on state
6. **Rotation Support**: All fixtures rotate correctly at 0°, 90°, 180°, 270°

## Adding New Fixtures

To add a new fixture type:

1. Add the catalog entry to `prisma/seed.ts`
2. Add rendering logic to `Fixture2DRenderer.tsx` based on the `key` pattern
3. Include appropriate details (handles, controls, functional elements)
4. Test at multiple scales and rotations
5. Ensure pointer events work correctly

## Best Practices

- Keep detail level appropriate for 2D plan view
- Use consistent stroke widths (1-3px)
- Add functional indicators (faucets, handles, controls)
- Use opacity for layered elements
- Include clearance zones in catalog schema
- Test hover states and dimension annotations



