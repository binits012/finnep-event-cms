# Seatmap Spacing Variables Reference

This document explains all spacing-related variables used in the seatmap system.

---

## 🔧 BACKEND Variables

Located in: `finnep-eventapp-backend/util/manualSectionLayout.js`

These control **where seats are actually generated** - the physical coordinates stored in the manifest.

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| `seatSpacingMultiplier` | 1.0 | 0.1 - 1.0 | Horizontal spacing between seats |
| `rowSpacingMultiplier` | 1.0 | 0.1 - 1.0 | Vertical spacing between rows |
| `curveDepthMultiplier` | 0.7 | 0.0 - 1.0+ | Curve intensity for cone/fan style |
| `topPadding` | 10 | 0 - 100+ | Gap from top of polygon to first row |

### 1. `seatSpacingMultiplier`

**What it does:** Controls how much of the polygon's WIDTH is used for seats.

**Formula:**
```
availableWidth = polygonWidth - margins
seatSpacing = (availableWidth / (seatsInRow - 1)) × seatSpacingMultiplier
```

**Values:**
- `1.0` = Seats spread across FULL polygon width (edge to edge)
- `0.5` = Seats only use 50% of width (clustered in center)
- `0.65` = Seats use 65% of width (leaves gaps on sides)

**When to adjust:** If seats are too spread out or too clustered horizontally.

---

### 2. `rowSpacingMultiplier`

**What it does:** Controls how much of the polygon's HEIGHT is used for rows.

**Formula:**
```
availableHeight = polygonHeight - topPadding - margins
rowSpacing = (availableHeight / (totalRows - 1)) × rowSpacingMultiplier
```

**Values:**
- `1.0` = Rows spread across FULL polygon height (top to bottom)
- `0.5` = Rows only use 50% of height (clustered at top)
- `0.75` = Rows use 75% of height (leaves gap at bottom)

**When to adjust:** If rows are too spread out or too clustered vertically.

---

### 3. `curveDepthMultiplier`

**What it does:** Controls how much rows curve toward the stage in **cone/fan presentation style**.

**Formula:**
```
curveDepth = max(15px, rowSpacing × curveDepthMultiplier)
curveOffset = -curveDepth × (distanceFromCenter)²
```

**Values:**
- `0.0` = No curve (flat rows)
- `0.7` = Moderate curve (default)
- `1.0` = Strong curve (edge seats pushed significantly forward)
- `1.5+` = Very aggressive curve

**When to adjust:** Only affects `cone` presentation style. Increase for more dramatic fan-out effect.

**Visual Example:**
```
curveDepth = 0.0 (flat):     curveDepth = 0.7 (curved):
○ ○ ○ ○ ○ ○ ○                    ○ ○ ○ ○ ○ ○ ○
○ ○ ○ ○ ○ ○ ○                  ○ ○ ○ ○ ○ ○ ○
○ ○ ○ ○ ○ ○ ○                ○   ○ ○ ○ ○ ○   ○
```

---

## 🖥️ FRONTEND Variables

Located in: `finnep-eventapp-cms/src/components/seatmap/SeatMapViewer.jsx`

These control **how seats are displayed** - visual adjustments that don't change actual seat coordinates.

| Variable | Baseline | Range | Purpose |
|----------|----------|-------|---------|
| `seatGap` | 10 | 1 - 10 | Display-side horizontal scaling |
| `rowGap` | 10 | 1 - 10 | Display-side vertical scaling |
| `dotSize` | 8 | 1 - 20 | Seat circle radius in pixels |

### 4. `seatGap` (UI: "Seat Gap")

**What it does:** Scales seat positions HORIZONTALLY from each section's center for display only.

**Formula:**
```
scale = min(1.0, seatGap / 10)
displayX = sectionCenterX + (originalX - sectionCenterX) × scale
```

**Values:**
- `10` = No scaling (seats displayed at true positions)
- `5` = 50% scale (seats shrunk toward section center)
- `1` = 10% scale (seats very tightly clustered)
- `>10` = Clamped to 1.0 (no expansion allowed)

---

### 5. `rowGap` (UI: "Row Gap")

**What it does:** Scales seat positions VERTICALLY from each section's center for display only.

**Formula:**
```
scale = min(1.0, rowGap / 10)
displayY = sectionCenterY + (originalY - sectionCenterY) × scale
```

**Values:**
- `10` = No scaling (rows displayed at true positions)
- `5` = 50% scale (rows shrunk toward section center)
- `1` = 10% scale (rows very tightly clustered)
- `>10` = Clamped to 1.0 (no expansion allowed)

---

## 🔄 Backend vs Frontend Comparison

| Aspect | Backend | Frontend |
|--------|---------|----------|
| **When applied** | During manifest generation | During display rendering |
| **Stored where** | In seat coordinates (x, y) | In venue.backgroundSvg.displayConfig |
| **Affects** | Actual seat positions | Visual representation only |
| **Requires regeneration** | Yes | No - changes immediately |
| **Customer app uses** | ✅ Yes | ❓ Depends on implementation |

---

## 📝 Recommended Workflow

1. **Configure BACKEND values** in Section Editor:
   - `seatSpacingMultiplier` = `1.0` (fill polygon width)
   - `rowSpacingMultiplier` = `1.0` (fill polygon height)
   - `topPadding` = `10` (minimal top gap)
   - `curveDepthMultiplier` = `0.7` (for cone/fan style)

2. **Generate/Regenerate the manifest**

3. **Adjust FRONTEND values** in View Seats tab (if needed):
   - `seatGap` = `10` and `rowGap` = `10` for true representation
   - Reduce only if you want a "compressed" preview look

---

## ⚠️ Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Seats don't fill polygon | Low multipliers (< 1.0) | Set multipliers to 1.0, regenerate |
| Seats spill outside polygon | Code bug (fixed) | Seats now constrained to polygon |
| Large gap at top | High `topPadding` | Reduce to 10 or less |
| Rows too close together | Low `rowSpacingMultiplier` | Increase toward 1.0 |

