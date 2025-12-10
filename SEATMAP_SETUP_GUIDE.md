# Seatmap Setup Guide - Step by Step

## Goal: Create an Ice Hockey Arena with Sections A-M

This guide will walk you through creating a venue layout similar to the ice hockey arena with sections A through M arranged around an ice rink.

---

## Step 1: Create a New Venue

1. Go to `/seatmap/new` in your CMS
2. You'll see **Step 1 of 2: Select or Create Venue**
3. Fill in the venue form:
   - **Name**: "Ice Hockey Arena" (or your venue name)
   - **Venue Type**: Select "arena"
   - **External Venue ID**: Leave empty (optional)
   - **Physical Dimensions**: Optional - you can skip this
   - **Layout Configuration**: Leave defaults (or adjust if needed)
4. Click **"Create Venue"**
5. The venue will be created and you'll move to **Step 2**

---

## Step 2: Configure Sections

### Option A: Quick Setup (Using the Form)

1. In **Step 2**, you'll see your selected venue
2. Click **"Configure Sections"** button
3. A dialog will open showing:
   - **Visual Preview** (canvas on the left)
   - **Section List** (on the right)

#### Adding Sections One by One:

1. Click **"Add New Section"** button
2. Fill in the section form:
   - **Section Name**: "A" (then "B", "C", etc. for each section)
   - **Section Type**: "Seating"
   - **Shape**: "Rectangle"
   - **Capacity**: Enter the number of seats (e.g., 200)
   - **Rows**: Optional (e.g., 20)
   - **Seats per Row**: Optional (e.g., 10)
   - **Base Price**: Optional (in cents, e.g., 5000 = €50.00)
   - **Color**: Choose a color (default blue is fine)
   - **Wheelchair Accessible**: Check if this section has accessible seating
3. Click **"Save Section"**
4. Repeat for sections B, C, D, E, F, G, H, I, J, K, L, M

**Note**: Sections will automatically be positioned in a grid. You can reposition them on the canvas later.

### Option B: Draw Sections on Canvas (Recommended for Arena Layout)

1. Click **"Configure Sections"** button
2. In the canvas toolbar, click the **"Draw Rectangle"** icon (the + icon)
3. Click and drag on the canvas to draw where Section A should be
4. The section will be created automatically
5. Click the **Edit icon** (pencil) next to the section in the list
6. Change the name to "A" and set other properties
7. Repeat for all sections (B-M), drawing them around where the ice rink will be

---

## Step 3: Set Up the Central Feature (Ice Rink)

1. In the Section Editor dialog, click the **"Central Feature (Optional)"** tab
2. Select **"Ice Rink"** from the Feature Type dropdown
3. Enter **Feature Name**: "Ice Rink"
4. Set the position and size:
   - **Center X**: 400 (center of canvas)
   - **Center Y**: 300 (center of canvas)
   - **Radius**: 150 (adjust based on your canvas size)
5. Choose colors:
   - **Fill Color**: Light blue (#E3F2FD)
   - **Stroke Color**: Dark blue (#1976D2)

### 🖼️ Adding an Image to the Ice Rink (NEW!)

You can now upload an actual image of your ice rink/field/stage to use as a visual reference:

1. Scroll down to the **"Image (Optional)"** section
2. Click **"Upload Image"** button and select an image file from your computer
   - OR enter an image URL in the "Or Enter Image URL" field
3. The image will appear on the canvas within the shape you defined
4. Adjust the **Image Opacity** slider to make the image more or less transparent
5. Optionally set custom **Image Width** and **Image Height** (leave empty to use the shape dimensions)

**Tips:**
- The image will be clipped to fit within the shape (circle, rectangle, or polygon)
- You can adjust opacity to see both the image and the shape outline
- For best results, use a top-down view of your rink/field
- Supported formats: JPG, PNG, GIF, WebP

---

## Step 4: Arrange Sections Around the Rink

### Method 1: Draw Sections in Position

1. Make sure you're in the **"Sections"** tab
2. Click the **"Draw Rectangle"** tool
3. Draw sections around the ice rink:
   - **Bottom side**: Draw sections A, B, C, D, E
   - **Right side**: Draw sections F, G
   - **Top side**: Draw sections H, I, J, K, L
   - **Left side**: Draw sections M, N
4. After drawing each section, click **Edit** to name it (A, B, C, etc.)

### Method 2: Edit Section Positions Manually

1. Draw a section on the canvas
2. Click **Edit** on that section
3. Note the bounds values (x1, y1, x2, y2)
4. You can manually adjust these in the form (though this requires knowing coordinates)

**Better approach**: Draw sections where you want them, then edit their names and properties.

---

## Step 5: Add Special Sections

### Private Boxes (AITIO)

1. Click **"Add New Section"**
2. Set:
   - **Name**: "AITIO 1" (or "AITIO 2", etc.)
   - **Type**: "Private Box" or "Box"
   - **Shape**: "Rectangle"
   - Draw it on the canvas where boxes should be

### Standing Areas

1. Click **"Add New Section"**
2. Set:
   - **Name**: "N-KENTTÄ SEISOMA" (or other standing area name)
   - **Type**: "Standing"
   - **Shape**: "Rectangle" or "Polygon" for irregular shapes
   - Draw it on the canvas

### Lounges

1. Click **"Add New Section"**
2. Set:
   - **Name**: "KOFF LOUNGE" (or other lounge name)
   - **Type**: "Lounge"
   - **Shape**: "Rectangle"
   - Draw it on the canvas

---

## Step 6: Mark Accessible Sections

1. For sections that have wheelchair access, click **Edit** on that section
2. Check the **"Wheelchair Accessible"** checkbox
3. Save the section

---

## Step 7: Save Your Configuration

1. Once all sections are configured, click **"Save Configuration"** at the bottom of the dialog
2. This saves all sections and the central feature to the venue
3. The dialog will close

---

## Step 8: Generate the Manifest

1. Back on the manifest generation page, you'll see your venue with sections configured
2. Fill in the manifest form:
   - **Event ID**: Optional (leave empty for now)
   - **Total Places**: Total number of seats across all sections
   - **Place ID Pattern**: Choose "Sequential" or "Grid"
   - **Layout Algorithm**: Choose "Grid" (or it will use your manual sections)
3. Click **"Generate Manifest"**
4. The system will:
   - Use your manually configured sections
   - Distribute seats within each section based on capacity
   - Create the seat map

---

## Tips:

1. **Start with the Ice Rink**: Set up the central feature first, then arrange sections around it
2. **Use the Canvas**: Drawing sections on the canvas is easier than trying to calculate coordinates
3. **Name as You Go**: After drawing each section, immediately edit it to give it the correct name (A, B, C, etc.)
4. **Save Frequently**: Use the "Save Configuration" button to save your work
5. **Undo/Redo**: Use Ctrl+Z to undo mistakes, Ctrl+Y to redo

---

## Quick Reference:

- **Draw Rectangle**: Click the + icon, then click and drag on canvas
- **Draw Polygon**: Click the pencil icon, then click points on canvas, double-click to finish
- **Edit Section**: Click the pencil icon next to a section in the list
- **Delete Section**: Click the trash icon next to a section
- **Zoom**: Use the zoom in/out buttons in the toolbar
- **Save**: Click "Save Configuration" to save all changes

---

## Example: Setting Up Section A

1. Click "Configure Sections"
2. Click "Draw Rectangle" tool (+ icon)
3. Click and drag on the bottom-left area of the canvas (where section A should be)
4. Section is created automatically
5. Click "Edit" (pencil icon) next to the new section
6. Change name to "A"
7. Set capacity (e.g., 200)
8. Check "Wheelchair Accessible" if needed
9. Click "Save Section"
10. Repeat for B, C, D, E, etc.

---

If you get stuck, the sections you create will be visible in the list on the right side of the dialog. You can always edit or delete them.

