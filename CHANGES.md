# Project Changes Log

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