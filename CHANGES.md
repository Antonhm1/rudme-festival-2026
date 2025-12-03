# Project Changes Log

## 2025-12-03: Implemented Directional Scroll Color System for Program Page

### Overview
Replaced hover-based color system with sophisticated scroll-based directional color transitions that respond to scroll direction and viewport position. Implemented sequential color progression through artist columns with smooth interpolation.

### Key Features Implemented

**1. Directional Column Algorithm**
- **Scrolling Down**: Shows left column artist colors in sequence (ANIMAUX ANIMÉ grey → MINDS OF 99 blue → PATINA pink)
- **Scrolling Up**: Shows right column artist colors in sequence (GILLI orange → NAUSIA green → SØN dark blue)
- **Direction Detection**: Tracks scroll direction changes and switches column priorities accordingly

**2. Sequential Color Progression**
- Artists are organized into left/right columns based on grid layout position
- Colors change when viewport center passes artist box centers
- Commitment system prevents rapid color switching - colors "stick" when artist is centered
- Smooth color interpolation between sequential artists for gradual transitions

**3. Technical Implementation**
- **Column Separation**: `separateColumns()` function organizes artist boxes into left/right arrays based on horizontal position
- **Target Selection**: `determineTargetArtist()` uses sequential logic instead of closest-distance to ensure proper progression
- **Scroll Direction**: `updateScrollDirection()` tracks scroll delta and direction changes
- **Color Interpolation**: `getInterpolatedColorBetweenArtists()` creates smooth color blending during transitions

### Files Modified

**assets/program.js**
- Added `initializeScrollColorSystem()` with directional algorithm (400+ lines)
- Implemented column-based artist organization and sequential targeting
- Added smooth color interpolation between artists
- Integrated with existing header color adaptation system
- Added initialization with white background and black text

**assets/program.css**
- Fixed scrolling issue: Added `!important` overrides to enable vertical scrolling
- Increased bottom padding from 60px to 150vh for proper scrolling to last artist boxes
- Ensured CSS specificity doesn't prevent scrolling

### User Experience Improvements

**1. Intuitive Directional Behavior**
- Natural left-to-right progression when scrolling down
- Right-to-left progression when scrolling up
- Consistent with reading patterns and layout expectations

**2. Smooth Visual Transitions**
- Gradual color blending between artists eliminates abrupt changes
- Colors commit when artist boxes are centered in viewport
- Header elements (logo, date, select menu) adapt to current background color

**3. Enhanced Scroll Experience**
- Sufficient bottom padding allows full exploration of all artist colors
- Responsive design works on both desktop (2-column) and mobile (1-column) layouts
- Performance optimized with requestAnimationFrame for smooth 60fps scrolling

### Technical Benefits
- **Maintainable**: Clear separation of column logic, direction tracking, and color interpolation
- **Testable**: Exposed internal state for automated testing with Puppeteer
- **Performant**: Efficient scroll event handling with RAF batching
- **Responsive**: Graceful degradation from 2-column to 1-column layouts

### Testing Implemented
- Created comprehensive Puppeteer tests to verify directional behavior
- Validated smooth color transitions between sequential artists
- Confirmed proper column separation and targeting logic
- Tested commitment system and direction change handling

---

## 2025-12-03: Fixed Mobile Scrollbar Thumb vs Social Links Overlap

### Issue
On mobile devices, the custom scrollbar thumb would overlap and block the Facebook and Instagram social links when scrolling to the right side of the gallery. This made the social links unclickable when the thumb was positioned over them.

### Root Cause
- Social links positioned at `bottom: 25px; right: 20px` with z-index 1500
- Custom scrollbar thumb moves horizontally across bottom with z-index 1400 when active
- On mobile, thumb could travel far enough right to overlap social links area
- Z-index hierarchy caused thumb to render behind social links, blocking interaction

### Solution Implemented
**Dynamic Z-Index Management for Mobile** (script.js):

1. **Added `manageSocialLinksZIndex()` function** (lines 32-62):
   - Monitors thumb position relative to viewport width
   - Only activates on mobile screens (max-width: 800px)
   - Calculates thumb's right edge position using `getBoundingClientRect()`
   - Defines threshold at 150px from right edge of screen

2. **Dynamic Z-Index Switching Logic**:
   - When thumb approaches (within 150px of right edge): lowers social container z-index to 1200
   - When thumb moves away: restores social container z-index to 1500
   - Uses inline styles to override CSS z-index values

3. **Integration with Existing Code**:
   - Added call to `manageSocialLinksZIndex()` in `updateScrollbar()` function (line 347)
   - Ensures z-index management runs on every scroll/drag event
   - Maintains existing thumb positioning and reserved space logic

### Technical Details
- **Files Modified**: `assets/script.js`
- **Mobile Detection**: Uses `window.matchMedia('(max-width: 800px)')`
- **Threshold**: 150px from right edge (adjustable)
- **Z-Index Values**: 1200 (hidden) / 1500 (visible)
- **Performance**: Runs only when thumb position updates, minimal overhead

### Result
- Social links remain clickable when thumb is away from right side
- Thumb can smoothly pass over social links when needed on mobile
- No visual artifacts or jarring transitions
- Desktop behavior unchanged
- Maintains responsive design principles

### Future Considerations
- Threshold value (150px) can be adjusted if needed
- Could be extended to other overlapping UI elements
- Alternative approach: CSS-only solution with container queries (when broadly supported)

---