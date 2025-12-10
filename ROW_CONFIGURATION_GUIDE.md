# Row Configuration Guide

## Understanding Row Configuration Fields

### **Left Aisle / Right Aisle**

**Purpose**: Creates gaps (aisles) on the left or right side of a row. These are measured in "seat units" - the system treats them as if there are seats there, but doesn't place actual seats.

**How it works**:
- The system calculates spacing based on: `effectiveSeatCount = seatCount + aisleLeft + aisleRight`
- Seats are placed AFTER the left aisle space
- The right aisle creates space AFTER the last seat

**Example 1: Center aisle**
```
Row with 10 seats, aisleLeft=0, aisleRight=0:
[1][2][3][4][5][6][7][8][9][10]

Row with 10 seats, aisleLeft=2, aisleRight=2:
[  ][  ][1][2][3][4][5][6][7][8][9][10][  ][  ]
     ↑ aisleLeft=2          ↑ aisleRight=2
```

**Example 2: Left aisle only (your case)**
```
Row with 8 seats, aisleLeft=13, aisleRight=0:
[  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][14][15][16][17][18][19][20][21]
     ↑ 13 empty spaces (seats 1-13 missing)    ↑ seats start from 14
```

### **X Offset / Y Offset**

**Purpose**: Fine-tune the position of the entire row by shifting it horizontally (X) or vertically (Y) by a specific number of pixels/units.

**When to use**:
- **X Offset**: When you need to shift a row left/right slightly (e.g., to align with other sections, or to account for a corner section)
- **Y Offset**: When you need to shift a row up/down slightly (e.g., to create staggered rows, or to align with a curved section)

**Example**:
```
Row 1: offsetX=0, offsetY=0
[1][2][3][4][5]

Row 2: offsetX=10, offsetY=5
         [1][2][3][4][5]  ← shifted 10 units right, 5 units down
```

### **Start Seat Number**

**Purpose**: The seat number to start counting from for this row.

**Example**:
- If `startSeatNumber=14` and `seatCount=8`, seats will be numbered: 14, 15, 16, 17, 18, 19, 20, 21
- If `startSeatNumber=1` and `seatCount=10`, seats will be numbered: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

---

## Configuration for Your Seating (A1 Kulma)

Based on your image showing rows 1-10 where rows 8-10 have left seats 1-13 absent:

### Row Configuration:

**Rows 1-7** (standard rows):
- Row 1: Seat Count = 4, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0
- Row 2: Seat Count = 6, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0
- Row 3: Seat Count = 8, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0
- Row 4: Seat Count = 10, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0
- Row 5: Seat Count = 10, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0
- Row 6: Seat Count = 10, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0
- Row 7: Seat Count = 10, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0

**Rows 8-10** (with missing left seats):
- Row 8: Seat Count = 8, Start Seat # = 14, Left Aisle = 13, Right Aisle = 0
- Row 9: Seat Count = 8, Start Seat # = 14, Left Aisle = 13, Right Aisle = 0
- Row 10: Seat Count = 8, Start Seat # = 14, Left Aisle = 13, Right Aisle = 0

### Visual Representation:

```
Row 1:  [1][2][3][4]
Row 2:  [1][2][3][4][5][6]
Row 3:  [1][2][3][4][5][6][7][8]
Row 4:  [1][2][3][4][5][6][7][8][9][10]
Row 5:  [1][2][3][4][5][6][7][8][9][10]
Row 6:  [1][2][3][4][5][6][7][8][9][10]
Row 7:  [1][2][3][4][5][6][7][8][9][10]
Row 8:  [  ][  ][  ]...[  ][14][15][16][17][18][19][20][21]
         ↑ 13 empty spaces (aisleLeft=13)    ↑ seats 14-21
Row 9:  [  ][  ][  ]...[  ][14][15][16][17][18][19][20][21]
Row 10: [  ][  ][  ]...[  ][14][15][16][17][18][19][20][21]
```

---

## Step-by-Step Configuration

1. **Select "Variable Rows"** in the Row Configuration dropdown
2. **Add 10 rows** using the "Add Row" button
3. **Configure each row**:
   - **Rows 1-7**: Set Seat Count, Start Seat # = 1, Left Aisle = 0, Right Aisle = 0
   - **Rows 8-10**: Set Seat Count = 8, Start Seat # = 14, Left Aisle = 13, Right Aisle = 0
4. **Save the section**

The system will automatically:
- Create the gap on the left for rows 8-10 (where seats 1-13 would be)
- Number seats starting from 14 for rows 8-10
- Space all seats evenly within the section boundaries

