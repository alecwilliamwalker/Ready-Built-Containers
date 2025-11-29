# Template Export/Import Workflow

This workflow makes it easy to adjust fixture positions in the design studio and update the templates.

## How to Use

### Step 1: Design Your Layout
1. Open the design studio with a basic template
2. Move fixtures to your desired positions using the 2D or 3D view
3. Adjust rotations as needed

### Step 2: Export the Layout
1. Click the **"📋 Export Template"** button in the Properties panel
2. The fixture positions will be copied to your clipboard
3. The export will also appear in the browser console

### Step 3: Send to AI
1. Paste the exported JSON
2. Send it to the AI assistant with a message like:
   ```
   Here's my updated layout for the basic template:
   [paste JSON here]
   ```

### Step 4: AI Updates Templates
The AI will automatically update the `templates.ts` file with your new fixture positions!

## Export Format

The export includes:
- **Shell dimensions** (40' × 8' × 9.5')
- **All zones** with their dimensions
- **Fixtures per zone** with:
  - `id`: Unique fixture identifier
  - `catalogKey`: Type of fixture
  - `xFt`: X position relative to zone start
  - `yFt`: Y position relative to zone bottom
  - `rotationDeg`: Rotation (0, 90, 180, or 270)

## Example Export

```json
{
  "shell": {
    "id": "shell-40",
    "lengthFt": 40,
    "widthFt": 8,
    "heightFt": 9.5
  },
  "zones": [
    {
      "id": "bedroom",
      "name": "Bedroom",
      "lengthFt": 12,
      "widthFt": 8,
      "fixtures": [
        {
          "id": "bed-twin-1",
          "catalogKey": "fixture-bed-twin",
          "xFt": 5,
          "yFt": 5,
          "rotationDeg": 0
        },
        {
          "id": "nightstand-1",
          "catalogKey": "fixture-nightstand",
          "xFt": 10.5,
          "yFt": 1,
          "rotationDeg": 0
        }
      ]
    }
  ]
}
```

## Tips

- **Positions are zone-relative**: xFt and yFt are measured from the start of each zone
- **Use the grid**: Enable snapping for precise positioning
- **Check boundaries**: Make sure fixtures don't extend beyond zone boundaries
- **Test rotations**: Try different rotations to find the best layout

## Coordinate System

- **Origin (0,0)**: Bottom-left corner of each zone
- **X-axis**: Runs along the container length (front to back)
- **Y-axis**: Runs along the container width (left to right)
- **Rotation**: 0° = default, 90° = quarter turn, etc.
