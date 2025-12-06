# Project Changes Log

## 2025-12-03: Fixed Program Page Scrollbar Thumb Sizing on Mobile

### Issue
On small screens (mobile devices), the scrollbar thumb in artist boxes was not properly scaling to represent the content ratio. The thumb appeared too small and didn't maintain the expected proportional relationship between visible content and total scrollable content.

### Root Cause
Previous attempts to fix the thumb sizing had used a fixed 50% width approach, which ignored the actual content ratio. The scrollbar thumb should represent the proportion of visible content to total content, not an arbitrary percentage.

### Solution Implemented
**Proportional Thumb Width with Enhanced Mobile Support** (program.js):

1. **Restored Proportional Calculation**:
   - `thumbWidth = (scrollEl.clientWidth / scrollEl.scrollWidth) * scrollbar.clientWidth`
   - Thumb size now accurately reflects the ratio of visible content to total scrollable content
   - Example: If 312px is visible out of 636px total content, thumb is ~49% of scrollbar width

2. **Enhanced Mobile Minimum Width**:
   - Mobile devices (max-width: 600px): minimum 30% of scrollbar width or 40px
   - Desktop: maintains original 24px minimum
   - Ensures thumb remains usable while preserving proportional accuracy

3. **Content-Responsive Behavior**:
   - Thumb automatically adapts to different content amounts
   - More scrollable content = smaller thumb (represents smaller visible portion)
   - Less scrollable content = larger thumb (represents larger visible portion)

### Technical Details
- **Files Modified**: `assets/program.js` (lines 227-230)
- **Mobile Detection**: Uses `window.matchMedia('(max-width: 600px)')`
- **Minimum Width Logic**: `Math.max(scrollbar.clientWidth * 0.3, 40)` for mobile
- **Fallback**: Desktop maintains `24px` minimum for consistent UX

### Result
- Scrollbar thumb now properly represents content proportion on all screen sizes
- Enhanced mobile usability with appropriate minimum sizing
- Maintains desktop compatibility and existing behavior
- Thumb size automatically adjusts based on actual scrollable content amount

---

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

## 2024-12-04: Volunteer Page Implementation with Dynamic Content and Advanced Color System

### Overview
Implemented a comprehensive volunteer/frivillig page with dynamic content loading from JSON, smooth scrolling navigation, and advanced color transitions based on scroll position.

### Key Features Implemented

#### 1. Dynamic Content Generation from JSON
- Created `assets/volunteers.json` containing all role information
- JavaScript dynamically generates role boxes and sections from JSON data
- Roles include: Frivillig, Afvikler, Arrangør, Praktikant, Rudme Lejr, Foreningsmedlem

#### 2. Page Structure and Styling
**Initial Requirements from UI Mockup:**
- Hero image with 30px margins (top/left/right), positioned behind header
- "BLIV EN DEL AF FÆLLESSKABET" text positioned below image, right-aligned
- Role boxes section with colored buttons for each role
- Individual role sections with detailed information

**Typography Specifications:**
- All text uses regular Helvetica (font-weight: 400), not bold
- Letter-spacing applied for consistent styling (-1px to -3px depending on size)
- Font sizes: Hero text (40px), Section title (45px), Role boxes (22px), Role headers (55px)

**Layout Adjustments Made:**
- Hero image: Full width minus 30px margins on each side
- Hero text: Right-aligned, positioned 490px below top
- Role boxes: Variable width, float left, container limited to 70% width
- Role sections: Centered boxes at 70% width with lighter background

#### 3. Advanced Color System

**Background Color Transitions:**
- Page background gradually transitions between role section colors while scrolling
- Uses color interpolation to create smooth transitions
- Transition starts when scrolling past 50% of current section
- Initial background color set to green (#90EE90) to match first role section

**Dynamic Header Color Updates:**
- Logo and date text colors match current background color
- Menu container background adapts to page background
- Select display background matches current background
- Role header text uses 40% darker version of background for contrast

**Color Fixes Applied:**
- Removed hardcoded purple backgrounds from `.volunteer-main` and `.roles-section` (set to transparent)
- Fixed select display background from hardcoded purple to dynamic color
- Changed initial color from purple (#B19CD9) to green (#90EE90) for seamless transitions

#### 4. Sticky Menu Behavior
**User Requirements:**
- Menu starts at position 75px from top (below logo)
- Scrolls with page initially
- "Sticks" to viewport at 20px from top when scrolled past threshold
- Returns to original position when scrolling back up

**Implementation:**
- Used JavaScript to toggle `menu-fixed` class based on scroll position
- Sticky point calculated at 55px scroll (75px initial - 20px final)
- Menu background color continues to update while sticky
- CSS position changes from absolute to fixed when class is applied

#### 5. Role Navigation
- Click on role boxes to smooth scroll to corresponding section
- Accounts for fixed header height (150px offset)
- Uses event delegation for dynamically created elements

### Technical Implementation Details

#### Files Created/Modified:
1. **volunteer.html** - Page structure with placeholders for dynamic content
2. **assets/volunteer.css** - All volunteer page styling
3. **assets/volunteer.js** - Dynamic content generation and interaction logic
4. **assets/volunteers.json** - Role data source
5. **assets/styles.css** - Updated global menu positioning rules

#### Key JavaScript Functions:
- `loadVolunteerData()` - Fetches and processes JSON data
- `generateRoleBoxes()` - Creates clickable role navigation boxes
- `generateRoleSections()` - Builds detailed role sections
- `initializeColorTransitions()` - Handles scroll-based color changes
- `updateHeaderColorForBackground()` - Updates all header elements with current color
- `initializeStickyMenu()` - Manages menu sticky behavior
- `interpolateColor()` - Smoothly transitions between hex colors
- `darkenColor()` - Creates darker text variants for contrast

### Bug Fixes and Iterations

1. **Color Transition Not Working:**
   - Problem: Background stayed purple throughout page
   - User feedback: "I see the problem now. I think there's a div called 'volunteer-main' and that background color is maybe just purple"
   - Cause: Hardcoded purple backgrounds in CSS blocking body color
   - Solution: Set backgrounds to transparent

2. **Menu Position Conflicts:**
   - Problem: Multiple conflicting CSS rules for menu position
   - Cause: Duplicate `.menu-container` rules at lines 54 and 542
   - Solution: Consolidated rules and removed conflicts

3. **Select Display Color:**
   - User feedback: "Right now, the drop-down select menu seems to change colors appropriately, but the select display is a hard-coded purple color"
   - Solution: Added dynamic backgroundColor update in JavaScript

4. **Role Header Visibility:**
   - User feedback: "The role header text color should change dynamically and be the background color at a darker version"
   - Solution: Applied 40% darker color variant for contrast

5. **Initial Color Mismatch:**
   - User feedback: "Can you make it so the initial background color is the same as the color of the first role section?"
   - Problem: Page started with purple, jumped to green at first section
   - Solution: Changed initial color to match first role (green #90EE90)

6. **Menu Sticky Behavior Clarification:**
   - Initial misunderstanding: Made menu scroll with content
   - User correction: "No, I meant the opposite... It should be fixed, so it's always visible in the viewport"
   - Further refinement: "Can you make it so it's positioned as where it is now when you're all the way at the top? But when you start scrolling, it stays in its position. But when it then gets a bit closer to the top, it first sticks"
   - Final solution: Implemented sticky behavior with JavaScript class toggling

### User Experience Improvements
- Seamless color flow from page top through all sections
- Menu always visible but moves naturally with initial scroll
- Clear visual hierarchy with contrasting text colors
- Smooth transitions enhance perceived performance
- Responsive design maintains functionality on mobile
- No jarring color jumps - gradual interpolation throughout

### Test Coverage
Created comprehensive test suite:
- `test-header-colors.js` - Verifies header color changes
- `test-debug-colors.js` - Debug section and color attributes
- `test-gradual-scroll.js` - Tests gradual color transitions
- `test-menu-scroll.js` - Validates menu scroll behavior
- `test-menu-fixed.js` - Checks fixed positioning
- `test-sticky-menu.js` - Tests sticky menu implementation
- `test-initial-color.js` - Verifies initial green background

### Result
A fully functional volunteer page with sophisticated color transitions, dynamic content loading, and refined user interactions that match the design requirements while providing an enhanced user experience through smooth animations and thoughtful color management.

---

## 2025-12-05: Enhanced Volunteer Page with Poster Section and Role System

### Overview
Extended the volunteer page with a comprehensive poster section featuring horizontally scrolling job assignments, role badges, and enhanced user interactions. Implemented auto-scrolling functionality, custom scrollbar, and dynamic content loading from centralized JSON.

### Key Features Implemented

#### 1. Poster Section with Job Assignments
**Initial Implementation:**
- Added 8 job positions/posters: Baren, Ma'teltet, Team Clean, Indgang, Scene, Info, Sikkerhed, Backstage
- Each poster has unique color scheme and description
- Created `assets/posters.json` with all poster information

**Layout and Styling:**
- Full viewport width horizontal scrolling
- Poster title right-aligned matching hero text style
- Custom scrollbar positioned behind boxes
- Responsive design for mobile and desktop

#### 2. Poster Box Scaling (500x500px)
**Size Adjustments:**
- Scaled poster boxes from 340×300px to 500×500px
- Image height increased to 400px
- Title font size: 36px (from 24px)
- Button font size: 20px with 12×30px padding
- Description font size: 20px
- More square appearance for better visual balance

**Interactive Features:**
- Entire box is clickable for expansion (not just button)
- Single box expansion - clicking one closes others
- Fixed height (500px) when collapsed, auto height when expanded
- Removed hover animation (translateY) for cleaner interaction

#### 3. Auto-Scrolling with User Control
**Scrolling Behavior:**
- Continuous auto-scroll at 0.5px per frame
- Pauses immediately on mouse enter
- Resumes on mouse leave (no delay)
- Seamless infinite loop by duplicating content
- Manual scrolling supported while auto-scroll paused

#### 4. Custom Scrollbar Implementation
**Visual Design:**
- Size: 240px wide × 180px tall (doubled from original)
- Position: Half behind boxes, half below
- Color: 70% lighter version of current background
- Opacity states: 0.5 default, 0.7 hover, 0.9 active
- Updates color dynamically with background transitions

**Functionality:**
- Draggable for manual position control
- Syncs with container scroll position
- Native scrollbar hidden for cleaner appearance

#### 5. Role Badge System
**"MULIGE ROLLER" Section:**
- Added below description in expanded poster boxes
- Displays applicable volunteer roles for each position
- Role badges with colored backgrounds:
  - Frivillige: Green (#90EE90)
  - Afviklere: Sky blue (#87CEEB)
  - Arrangører: Pink (#FFB6C1)

**Visual Styling:**
- 24px heading "MULIGE ROLLER"
- 18px role badge text
- 10×20px padding per badge
- Removed decorative border lines for cleaner look

#### 6. Centralized JSON Data Structure
**Enhanced posters.json:**
```json
{
  "roleColors": {
    "Frivillige": "#90EE90",
    "Afviklere": "#87CEEB",
    "Arrangører": "#FFB6C1"
  },
  "posters": [
    {
      "id": "baren",
      "title": "Baren",
      "image": "pictures/...",
      "description": "...",
      "color": "#FF6B6B",
      "roles": ["Frivillige", "Afviklere"]
    }
    // ... more posters
  ]
}
```

### Technical Implementation Details

#### JavaScript Updates (volunteer.js):
- `loadPosterData()` - Fetches poster data from JSON
- `generatePosterBoxes()` - Creates poster elements with role badges
- `initializePosterScroll()` - Manages auto-scroll and interactions
- Enhanced click handlers for box expansion
- Dynamic scrollbar color management
- Role color mapping from JSON

#### CSS Updates (volunteer.css):
- Poster section with full viewport width
- Fixed poster box heights with expansion support
- Custom scrollbar styling and positioning
- Role badge styling with flex layout
- Mobile responsive adjustments

### Bug Fixes and Refinements

1. **Poster Box Expansion Issue:**
   - Problem: All boxes expanded when clicking one (flexbox stretching)
   - Solution: Added fixed height and `align-self: flex-start`

2. **Auto-Scroll Resume:**
   - Problem: Auto-scroll resumed after timeout even while hovering
   - Solution: Only resume on mouse leave, no timeout

3. **Scrollbar Positioning:**
   - Initial: Behind boxes at wrong height
   - Adjusted: `bottom: -90px` for half behind/half below effect

4. **Role Display:**
   - Removed border lines above description and roles section
   - Adjusted padding and margins for cleaner appearance

### Mobile Optimizations
- Poster boxes: 250×280px on mobile
- Image: 210px height
- Smaller font sizes and padding
- Responsive scrollbar behavior
- Touch-friendly interactions

### Testing Coverage
Created comprehensive Puppeteer tests:
- `test-poster-scaled.js` - Verifies 500px box dimensions
- `test-poster-expansion.js` - Tests single box expansion
- `test-poster-roles.js` - Validates role badge display
- `test-json-loading.js` - Confirms JSON data loading

### User Experience Improvements
- Smooth auto-scrolling creates dynamic feel
- Large poster boxes improve content visibility
- Role badges provide clear volunteer opportunities
- Single expansion prevents overwhelming layout changes
- Custom scrollbar offers visual feedback and control
- Responsive design maintains functionality across devices

### Result
A sophisticated poster section that seamlessly integrates with the volunteer page, providing an engaging way to explore festival job opportunities. The combination of auto-scrolling, large visual elements, and clear role indicators creates an intuitive and attractive user experience. All data is centralized in JSON for easy maintenance and updates.

---

## 2025-12-06: Gallery Auto-Scroll Enhancements

### Overview
Enhanced the homepage gallery's automatic scrolling behavior with user-interaction awareness and improved looping functionality.

### Key Features Implemented

#### 1. User-Controlled Auto-Scroll Pause
**Behavior:**
- Auto-scroll pauses for 10 seconds when user manually scrolls
- Timer resets on each scroll interaction
- Only resumes after 10 continuous seconds of no scrolling
- Prevents conflicts between automatic and manual navigation

**Implementation:**
- Added `pauseTimer` and `pauseDuration` (10000ms) variables
- Modified `onUserScroll()` to trigger pause timer
- Created `pauseAutoAdvanceWithTimer()` helper function
- Applied pause behavior to all interaction methods:
  - Gallery scrolling
  - Scrollbar dragging
  - Scrollbar clicking
  - Touch/pointer interactions

#### 2. Continuous Forward Loop
**Behavior:**
- Gallery always advances forward through slides
- After reaching the last slide, loops back to first slide
- No more back-and-forth reversing at ends
- Creates seamless infinite carousel effect

**Implementation:**
- Simplified auto-advance logic to always increment index
- Loop back to index 0 when reaching last slide
- Maintained arrow direction indicators for manual scrolling
- Removed complex reverse direction logic for auto-scroll

#### 3. Preserved Manual Navigation
**Features Maintained:**
- Users can still manually scroll in both directions
- Arrow direction indicator updates based on manual scroll direction
- Smooth scrolling transitions preserved
- Touch and drag interactions fully functional

### Technical Details
- **File Modified**: `assets/script.js`
- **Key Functions Updated**:
  - `startAutoAdvance()` - Simplified loop logic
  - `onUserScroll()` - Added pause timer
  - `pauseAutoAdvanceWithTimer()` - New helper function
  - `goToSlideIndex()` - Maintains forward direction for auto-scroll

### User Experience Improvements
- More predictable auto-scroll behavior (always forward)
- Respects user intent with 10-second pause
- Seamless looping creates continuous flow
- No jarring direction changes
- Clear separation between automatic and manual navigation

### Data Updates
- Fixed double `##` in color value for picture-25 in `pictures.json`
- Regenerated gallery slides from updated JSON data
- All 27 slides properly configured with correct colors

### Result
The gallery now provides a more intuitive and user-friendly experience with smart auto-scrolling that respects manual interaction while maintaining smooth, continuous forward progression through all slides.

---