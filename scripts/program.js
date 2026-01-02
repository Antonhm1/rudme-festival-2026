/* assets/program.js — program page specific JS: per-box custom scrollbars */

// Header colors are now handled by header-universal.js
// This file only handles the artist box scrollbars and click interactions

// Darken the logo color specifically for the program page
function darkenLogoColor(baseColor) {
    const logo = document.querySelector('#logo-inner');
    const dateText = document.querySelector('#date-text');
    if (!logo) return;

    // Parse and darken the color
    const rgb = parseColorToRgb(baseColor);
    // Darken by 40% (multiply each channel by 0.6)
    const darkerR = Math.round(rgb[0] * 0.6);
    const darkerG = Math.round(rgb[1] * 0.6);
    const darkerB = Math.round(rgb[2] * 0.6);
    const darkerColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;

    // Apply the darker color to logo and date
    logo.style.color = darkerColor;
    if (dateText) dateText.style.color = darkerColor;
}

// Helper function for color manipulation (used for box scrollbar thumbs)
function parseColorToRgb(color) {
    if (!color) return [255, 255, 255];
    color = color.trim();

    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            return [
                parseInt(hex[0] + hex[0], 16),
                parseInt(hex[1] + hex[1], 16),
                parseInt(hex[2] + hex[2], 16)
            ];
        }
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16)
        ];
    }

    if (color.startsWith('rgb')) {
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
            return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
        }
    }

    return [255, 255, 255]; // fallback to white
}

function lightenColor(color, amount = 0.4) {
    const rgb = parseColorToRgb(color);
    const r = Math.round(rgb[0] + (255 - rgb[0]) * amount);
    const g = Math.round(rgb[1] + (255 - rgb[1]) * amount);
    const b = Math.round(rgb[2] + (255 - rgb[2]) * amount);
    return `rgb(${r}, ${g}, ${b})`;
}

// Update page background color when clicking an artist box
// This triggers header-universal.js to update header colors automatically
function updatePageBackgroundColor(boxColor) {
    document.body.style.backgroundColor = boxColor;
    document.documentElement.style.setProperty('--current-bg', boxColor);
}

function attachBoxScrollbars() {
    const boxes = Array.from(document.querySelectorAll('.artist-box'));
    if (!boxes.length) return;

    boxes.forEach(box => {
        const scrollEl = box.querySelector('.box-scroll');
        const scrollbar = box.querySelector('.box-scrollbar');
        const thumb = box.querySelector('.custom-scrollbar-thumb');
        if (!scrollEl || !scrollbar || !thumb) return;

        // Color the thumb according to the box color variable (lighter)
        try {
            const c = getComputedStyle(box).getPropertyValue('--box-color').trim() || '#ffffff';
            function parseHex(h) {
                const hex = h.replace('#','');
                const r = parseInt(hex.slice(0,2),16);
                const g = parseInt(hex.slice(2,4),16);
                const b = parseInt(hex.slice(4,6),16);
                return [r,g,b];
            }
            if (c.startsWith('#') && c.length >= 7) {
                const rgb = parseHex(c);
                const lr = Math.round((rgb[0] + 255) / 2);
                const lg = Math.round((rgb[1] + 255) / 2);
                const lb = Math.round((rgb[2] + 255) / 2);
                thumb.style.background = `rgb(${lr}, ${lg}, ${lb})`;
            }
        } catch (err) {}

        function update() {
            const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
            const scrollPercentage = maxScroll === 0 ? 0 : Math.min(1, scrollEl.scrollLeft / maxScroll);
            const thumbWidth = (scrollEl.clientWidth / scrollEl.scrollWidth) * scrollbar.clientWidth || scrollbar.clientWidth;

            // Use better minimum width on mobile, but keep the proportional calculation
            const isMobile = window.matchMedia('(max-width: 600px)').matches;
            const minThumbWidth = isMobile ? Math.max(scrollbar.clientWidth * 0.3, 40) : 24;
            const finalThumbWidth = Math.max(minThumbWidth, thumbWidth);

            const available = Math.max(0, scrollbar.clientWidth - finalThumbWidth);
            const thumbPosition = scrollPercentage * available;

            thumb.style.width = finalThumbWidth + 'px';
            thumb.style.left = Math.max(0, Math.min(available, thumbPosition)) + 'px';
        }

        // Sync on scroll and resize
        scrollEl.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        // initial
        setTimeout(update, 50);

        // dragging
        let isDragging = false;
        let dragOffset = 0;

        thumb.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            const rect = thumb.getBoundingClientRect();
            dragOffset = e.clientX - rect.left;
            isDragging = true;
            scrollEl.classList.add('dragging-scrollbar');
            try { thumb.setPointerCapture && thumb.setPointerCapture(e.pointerId); } catch (err) {}
        });

        function onMove(e) {
            if (!isDragging) return;
            const rect = scrollbar.getBoundingClientRect();
            const thumbW = thumb.getBoundingClientRect().width;
            const available = Math.max(0, rect.width - thumbW);
            let left = e.clientX - rect.left - dragOffset;
            left = Math.max(0, Math.min(available, left));
            const scrollPerc = available === 0 ? 0 : left / available;
            const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
            scrollEl.scrollLeft = Math.max(0, Math.min(maxScroll, scrollPerc * maxScroll));
        }

        function onUp(e) {
            if (!isDragging) return;
            isDragging = false;
            scrollEl.classList.remove('dragging-scrollbar');
            try { thumb.releasePointerCapture && thumb.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);

        // clicking on the track
        scrollbar.addEventListener('click', (e) => {
            if (e.target === thumb) return;
            const rect = scrollbar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const thumbW = thumb.getBoundingClientRect().width;
            const thumbLeft = Math.max(0, Math.min(rect.width - thumbW, clickX - thumbW / 2));
            const available = Math.max(0, rect.width - thumbW);
            const scrollPerc = available === 0 ? 0 : thumbLeft / available;
            const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
            scrollEl.scrollLeft = Math.max(0, Math.min(maxScroll, scrollPerc * maxScroll));
        });

        // Click handler: auto-scroll to next item
        box.addEventListener('click', (e) => {
            // Don't scroll if clicking on the scrollbar or if already dragging
            if (e.target.closest('.box-scrollbar') || scrollEl.classList.contains('dragging-scrollbar')) return;

            const items = scrollEl.querySelectorAll('.box-item');
            if (items.length > 1) {
                const itemWidth = items[0].offsetWidth;
                const currentScroll = scrollEl.scrollLeft;
                const currentIndex = Math.round(currentScroll / itemWidth);
                const nextIndex = (currentIndex + 1) % items.length; // Loop back to first item
                const targetScroll = nextIndex * itemWidth;

                scrollEl.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        });

        // Pointer handlers: restore Spotify embeds and manage scroll position
        box.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'touch') return;
            if (scrollEl.classList.contains('dragging-scrollbar')) return;

            // Restore Spotify embeds (if we previously unloaded them on leave)
            try {
                const spIframes = box.querySelectorAll('.spotify-embed iframe');
                spIframes.forEach(ifr => {
                    try {
                        const orig = ifr.dataset.origSrc;
                        if (orig && (!ifr.src || ifr.src === 'about:blank')) {
                            ifr.src = orig;
                        }
                    } catch (err) {}
                });
            } catch (err) {}
        });

        box.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'touch') return;
            if (scrollEl.classList.contains('dragging-scrollbar')) return;

            // Do NOT reset header colors - keep the last artist box color persistent

            // Unload Spotify embeds to stop playback
            try {
                const spIframes = box.querySelectorAll('.spotify-embed iframe');
                spIframes.forEach(ifr => {
                    try {
                        if (ifr.dataset.origSrc) {
                            ifr.src = 'about:blank';
                        }
                    } catch (err) {}
                });
            } catch (err) {}

            // If the inner horizontal container was manually scrolled, return it to
            // the first item when the pointer leaves the box. Use a small threshold
            // to avoid fighting subtle fractional scroll positions.
            try {
                if ((scrollEl.scrollLeft || 0) > 8) {
                    try {
                        scrollEl.scrollTo({ left: 0, behavior: 'smooth' });
                    } catch (err) {
                        // fallback for older browsers
                        scrollEl.scrollLeft = 0;
                    }
                }
            } catch (err) {}
        });
        
        // Focus handler removed - colors now controlled by scroll position
    });
}

// Simplified directional scroll color system (now works on both mobile and desktop)
function initializeScrollColorSystem() {
    let leftColumnArtists = [];
    let rightColumnArtists = [];
    let rafId = null;

    // Target commitment system
    let lastScrollY = window.scrollY;
    let scrollDirection = 'down'; // 'up' or 'down'
    let targetArtist = null; // Artist we're currently transitioning to
    let currentArtist = null; // Artist we're currently showing
    let isCommitted = false; // Whether we've reached the target color

    function updateArtistBoxes() {
        // Get all artist boxes
        const allBoxes = Array.from(document.querySelectorAll('.artist-box')).map((box, index) => {
            const rect = box.getBoundingClientRect();
            const color = getComputedStyle(box).getPropertyValue('--box-color').trim() || '#FEAD47';
            return {
                element: box,
                top: rect.top + window.scrollY,
                bottom: rect.bottom + window.scrollY,
                center: rect.top + window.scrollY + rect.height / 2,
                left: rect.left,
                color: color,
                index: index,
                name: box.querySelector('.box-title')?.textContent || `Artist ${index + 1}`
            };
        });

        // Separate into left and right columns
        separateColumns(allBoxes);
    }

    function separateColumns(allBoxes) {
        // Sort by vertical position first, then by horizontal position
        const sortedBoxes = [...allBoxes].sort((a, b) => {
            const verticalDiff = a.top - b.top;
            return Math.abs(verticalDiff) < 50 ? a.left - b.left : verticalDiff;
        });

        leftColumnArtists = [];
        rightColumnArtists = [];

        // Group by rows and separate columns
        let currentRowBoxes = [];
        let currentRowTop = null;

        sortedBoxes.forEach(box => {
            if (currentRowTop === null || Math.abs(box.top - currentRowTop) <= 50) {
                // Same row
                currentRowBoxes.push(box);
                if (currentRowTop === null) currentRowTop = box.top;
            } else {
                // Process completed row
                processRow(currentRowBoxes);
                currentRowBoxes = [box];
                currentRowTop = box.top;
            }
        });

        // Process final row
        if (currentRowBoxes.length > 0) {
            processRow(currentRowBoxes);
        }

        // Sort columns by vertical position
        leftColumnArtists.sort((a, b) => a.top - b.top);
        rightColumnArtists.sort((a, b) => a.top - b.top);
    }

    function processRow(boxes) {
        if (boxes.length === 1) {
            // Single column layout - add to left column
            leftColumnArtists.push(boxes[0]);
        } else if (boxes.length >= 2) {
            // Two column layout - sort by horizontal position
            boxes.sort((a, b) => a.left - b.left);
            leftColumnArtists.push(boxes[0]); // Leftmost
            rightColumnArtists.push(boxes[1]); // Rightmost
        }
    }

    function updateBackgroundOnScroll() {
        if (leftColumnArtists.length === 0) return;

        const currentScrollY = window.scrollY;
        const viewportCenter = currentScrollY + window.innerHeight / 2;

        // Update scroll direction
        updateScrollDirection(currentScrollY);

        // Determine target artist based on new simple algorithm
        determineTargetArtist(viewportCenter);

        // Update colors based on current/target state
        updateColorsWithCommitment(viewportCenter);
    }

    function updateScrollDirection(currentScrollY) {
        const scrollDelta = currentScrollY - lastScrollY;
        const minDelta = 5; // Minimum scroll distance to register direction change

        if (Math.abs(scrollDelta) >= minDelta) {
            const newDirection = scrollDelta > 0 ? 'down' : 'up';

            if (newDirection !== scrollDirection) {
                scrollDirection = newDirection;
                // Reset commitment when direction changes
                isCommitted = false;
            }
        }

        lastScrollY = currentScrollY;
    }

    function determineTargetArtist(viewportCenter) {
        // Get the appropriate artist list for current scroll direction
        const artistList = scrollDirection === 'down' ? leftColumnArtists :
                          (rightColumnArtists.length > 0 ? rightColumnArtists : leftColumnArtists);

        if (artistList.length === 0) return;

        // Find which artist is currently centered (or closest to being centered)
        const currentIndex = getCurrentArtistIndex(viewportCenter, artistList);

        // Determine target based on scroll direction and current position
        let newTarget = null;

        if (scrollDirection === 'down') {
            // Scrolling down: target next artist in sequence or stay with current if at end
            if (viewportCenter > artistList[currentIndex].center) {
                // We've passed current artist center, target next one
                newTarget = artistList[currentIndex + 1] || artistList[currentIndex];
            } else {
                // We haven't reached current artist center yet
                newTarget = artistList[currentIndex];
            }
        } else {
            // Scrolling up: target previous artist in sequence or stay with current if at beginning
            if (viewportCenter < artistList[currentIndex].center) {
                // We've passed current artist center going up, target previous one
                newTarget = artistList[currentIndex - 1] || artistList[currentIndex];
            } else {
                // We haven't reached current artist center yet
                newTarget = artistList[currentIndex];
            }
        }

        // Only change target when we move to a new artist or direction changes
        if (newTarget && newTarget !== targetArtist) {
            currentArtist = targetArtist; // Previous target becomes current
            targetArtist = newTarget;
            isCommitted = false;
        }
    }

    function getCurrentArtistIndex(viewportCenter, artistList) {
        // Find the artist whose center is closest to viewport center
        let closestIndex = 0;
        let closestDistance = Math.abs(viewportCenter - artistList[0].center);

        artistList.forEach((artist, index) => {
            const distance = Math.abs(viewportCenter - artist.center);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        return closestIndex;
    }

    function hasReachedTarget(viewportCenter) {
        if (!targetArtist) return false;
        const distance = Math.abs(viewportCenter - targetArtist.center);
        return distance < 100; // Close enough to center for commitment
    }

    function updateColorsWithCommitment(viewportCenter) {
        if (!targetArtist) {
            // Initialize with first artist based on direction
            const firstArtist = scrollDirection === 'down' ? leftColumnArtists[0] :
                               (rightColumnArtists.length > 0 ? rightColumnArtists[0] : leftColumnArtists[0]);
            if (firstArtist) {
                currentArtist = firstArtist;
                targetArtist = firstArtist;
                updatePageColors(firstArtist.color);
            }
            return;
        }

        // Check if we've reached the target (artist is centered in viewport)
        if (hasReachedTarget(viewportCenter)) {
            isCommitted = true;
            currentArtist = targetArtist;
            updatePageColors(targetArtist.color);
            return;
        }

        // If we're transitioning between artists, use smooth interpolation
        if (currentArtist && targetArtist && currentArtist !== targetArtist) {
            const interpolatedColor = getInterpolatedColorBetweenArtists(viewportCenter, currentArtist, targetArtist);
            updatePageColors(interpolatedColor);
        } else {
            // Show target color if no transition needed
            updatePageColors(targetArtist.color);
        }
    }

    function getInterpolatedColorBetweenArtists(viewportCenter, artist1, artist2) {
        // Calculate distances from viewport center to each artist center
        const distance1 = Math.abs(viewportCenter - artist1.center);
        const distance2 = Math.abs(viewportCenter - artist2.center);
        const totalDistance = distance1 + distance2;

        // Avoid division by zero
        if (totalDistance === 0) return artist2.color;

        // Calculate interpolation factor (0 = fully artist1, 1 = fully artist2)
        const t = distance1 / totalDistance;

        // Smooth interpolation between the two colors
        return interpolateColors(artist1.color, artist2.color, t);
    }

    function interpolateColors(color1, color2, t) {
        const rgb1 = parseColorToRgb(color1);
        const rgb2 = parseColorToRgb(color2);

        const r = Math.round(rgb1[0] * (1 - t) + rgb2[0] * t);
        const g = Math.round(rgb1[1] * (1 - t) + rgb2[1] * t);
        const b = Math.round(rgb1[2] * (1 - t) + rgb2[2] * t);

        return `rgb(${r}, ${g}, ${b})`;
    }

    function updatePageColors(color) {
        document.body.style.background = color;
        document.documentElement.style.setProperty('--current-bg', color);
        // Header colors are now handled automatically by header-universal.js

        // Make logo darker on program page only
        darkenLogoColor(color);
    }

    function onScroll() {
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                updateBackgroundOnScroll();
                rafId = null;
            });
        }
    }

    // Initialize
    function init() {
        updateArtistBoxes();
        updateBackgroundOnScroll();

        // Add scroll listener
        window.addEventListener('scroll', onScroll, { passive: true });

        // Update positions on resize
        window.addEventListener('resize', () => {
            updateArtistBoxes();
            updateBackgroundOnScroll();
        });
    }

    return {
        init,
        updateArtistBoxes,
        // Expose for testing
        get leftColumnArtists() { return leftColumnArtists; },
        get rightColumnArtists() { return rightColumnArtists; },
        get currentArtist() { return currentArtist; },
        get targetArtist() { return targetArtist; },
        get scrollDirection() { return scrollDirection; }
    };
}

// Load artists.json and render the artist boxes, then attach scrollbars.
function mapCropToPosition(crop) {
    switch ((crop||'').toLowerCase()) {
        case 'top': return 'center top';
        case 'bottom': return 'center bottom';
        case 'mid':
        case 'middle':
        default: return 'center';
    }
}

// Fisher-Yates shuffle algorithm for randomizing artist order
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function loadArtists() {
    fetch('database/artists.json')
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch')))
        .then(data => {
            // Shuffle artists so they appear in random order each page load
            const artists = shuffleArray(Array.isArray(data.artists) ? data.artists : []);
            const grid = document.getElementById('artist-grid') || document.querySelector('.artist-grid');
            if (!grid) return;
            grid.innerHTML = '';

            // Set initial background color from first artist immediately
            if (artists.length > 0 && artists[0].color) {
                document.body.style.backgroundColor = artists[0].color;
                document.documentElement.style.setProperty('--current-bg', artists[0].color);
                // Also darken the logo color on initial load
                darkenLogoColor(artists[0].color);
            }

            // helper: extract YouTube video id from common URL forms
            function getYouTubeId(url) {
                if (!url) return null;
                try {
                    const u = new URL(url, window.location.href);
                    const host = (u.hostname || '').toLowerCase();
                    if (host.includes('youtu.be')) {
                        return u.pathname.slice(1).split(/[^0-9A-Za-z_-]/)[0] || null;
                    }
                    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
                        if (u.pathname.startsWith('/watch')) return u.searchParams.get('v');
                        const parts = u.pathname.split('/');
                        const embedIndex = parts.indexOf('embed');
                        if (embedIndex !== -1 && parts[embedIndex+1]) return parts[embedIndex+1];
                        // sometimes the id is the last path segment
                        const last = parts.pop();
                        if (last && /^[A-Za-z0-9_-]{6,}$/.test(last)) return last;
                    }
                } catch (err) {
                    // fall through to regex fallback
                }
                // fallback regex (covers many common variants)
                const m = url && url.toString().match(/(?:v=|v\/|embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
                return m ? m[1] : null;
            }

            artists.forEach(a => {
                const box = document.createElement('div');
                box.className = 'artist-box';
                // make boxes keyboard-focusable so keyboard users can also set the bg
                box.tabIndex = 0;
                if (a.color) box.style.setProperty('--box-color', a.color);

                const title = document.createElement('div');
                title.className = 'box-title';
                title.textContent = a.name || '';
                box.appendChild(title);

                const scroll = document.createElement('div');
                scroll.className = 'box-scroll';

                // image tile (always first)
                const imgItem = document.createElement('div');
                imgItem.className = 'box-item';
                const img = document.createElement('img');
                img.className = 'artist-photo';
                img.src = a.image || '';
                img.alt = a.name || '';
                img.loading = 'lazy';
                img.style.objectPosition = mapCropToPosition(a.crop);
                imgItem.appendChild(img);
                scroll.appendChild(imgItem);

                // spotify embed (always second if present)
                if (a.spotify && String(a.spotify).trim()) {
                    try {
                        const spItem = document.createElement('div');
                        spItem.className = 'box-item';
                        const wrapper = document.createElement('div');
                        wrapper.className = 'spotify-embed';
                        // insert raw iframe HTML from JSON; JSON is maintained by site authors
                        wrapper.innerHTML = a.spotify;
                        // make sure any iframe inside gets lazy loading and responsive class
                        const iframe = wrapper.querySelector('iframe');
                        if (iframe) {
                            iframe.loading = 'lazy';
                            iframe.style.width = '100%';
                            // remove any fixed height attribute coming from the JSON embed
                            // so CSS/JS can control sizing; then force it to fill vertically
                            try { iframe.removeAttribute && iframe.removeAttribute('height'); } catch (e) {}
                            iframe.style.width = '100%';
                            iframe.style.height = '100%';
                            iframe.style.display = 'block';
                            iframe.style.minHeight = '0';
                            iframe.style.border = '0';
                            // remember original src so we can unload/reload to stop playback
                            try { iframe.dataset.origSrc = iframe.src || ''; } catch (e) {}
                        }
                        spItem.appendChild(wrapper);
                        scroll.appendChild(spItem);
                    } catch (err) {
                        // fallback: add a simple link if the embed string is invalid
                        const spItem = document.createElement('div');
                        spItem.className = 'box-item';
                        const anchor = document.createElement('a');
                        anchor.href = String(a.spotify).match(/src="([^"]+)"/) ? String(a.spotify).match(/src="([^"]+)"/)[1] : '#';
                        anchor.target = '_blank';
                        anchor.rel = 'noopener';
                        anchor.textContent = 'Spotify ›';
                        spItem.appendChild(anchor);
                        scroll.appendChild(spItem);
                    }
                }


                box.appendChild(scroll);

                const scrollbar = document.createElement('div');
                scrollbar.className = 'box-scrollbar custom-scrollbar';
                const thumb = document.createElement('div');
                thumb.className = 'custom-scrollbar-thumb';
                scrollbar.appendChild(thumb);
                box.appendChild(scrollbar);

                grid.appendChild(box);
            });

            // wait a tick for layout, then wire the scrollbar logic and color system
            setTimeout(() => {
                attachBoxScrollbars();

                // Initialize scroll-based color system for dynamic background colors
                const colorSystem = initializeScrollColorSystem();
                colorSystem.init();

                // Store reference for potential updates
                window.programColorSystem = colorSystem;

                // Ensure first artist color is set after scroll system init
                // This overrides any interpolation that might have happened
                if (artists.length > 0 && artists[0].color && window.scrollY === 0) {
                    document.body.style.backgroundColor = artists[0].color;
                    document.documentElement.style.setProperty('--current-bg', artists[0].color);
                    darkenLogoColor(artists[0].color);
                }
            }, 50);
        })
        .catch(err => {
            // leave the grid empty on error, but log for debugging
            console.error('Error loading artists.json', err);
        });
}

// Initialize: load when header is inserted or DOM is ready
// Note: Header styling and sticky menu are now handled by header-universal.js
document.addEventListener('header-inserted', () => {
    loadArtists();
});
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            loadArtists();
        }, 50);
    });
} else {
    // run shortly after load so layout is stable
    setTimeout(() => {
        loadArtists();
    }, 50);
}

// Sticky menu behavior is now handled by header-universal.js

/* Page-level custom vertical scrollbar removed — rely on native vertical scrollbar. */

/*
  Small helper: show a thumb-only native vertical scrollbar while the user is
  scrolling or when the pointer is near the right edge of the window.
  Adds/removes `html.show-vertical-scrollbar` to control visibility (CSS above).
*/
(function pageVScrollbarController() {
    let hideTimer = null;
    const HIDE_DELAY = 900; // ms after last activity to hide

    function show() {
        document.documentElement.classList.add('show-vertical-scrollbar');
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        hideTimer = setTimeout(() => {
            document.documentElement.classList.remove('show-vertical-scrollbar');
            hideTimer = null;
        }, HIDE_DELAY);
    }

    // Show on scroll or touchstart
    window.addEventListener('scroll', show, { passive: true });
    window.addEventListener('touchstart', show, { passive: true });

    // Show when pointer moves near the right edge (within 60px)
    window.addEventListener('mousemove', (e) => {
        try {
            const nearRight = e.clientX >= (window.innerWidth - 60);
            if (nearRight) show();
        } catch (err) { /* ignore */ }
    });

    // Also reveal when pointer enters the window (desktop)
    window.addEventListener('pointerenter', show);
    // Clean up on page hide
    window.addEventListener('pagehide', () => { if (hideTimer) clearTimeout(hideTimer); });
})();
