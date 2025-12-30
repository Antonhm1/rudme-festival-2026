// Main interactive script for gallery, select, scrollbar and logo inlining.
// This file was extracted from index.html and adapted to fetch the logo SVG so
// the visual behavior remains the same while keeping assets separate.

// Fisher-Yates shuffle algorithm for randomizing slide order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Shuffle the slides in the gallery and update CSS color variables
function shuffleGallerySlides() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    const slideElements = Array.from(gallery.querySelectorAll('.slide'));
    if (slideElements.length <= 1) return;

    // Shuffle the slide elements
    shuffleArray(slideElements);

    // Re-append slides in shuffled order (this moves them in the DOM)
    slideElements.forEach(slide => gallery.appendChild(slide));

    // Update CSS variables to match new order
    slideElements.forEach((slide, index) => {
        const bgColor = slide.style.backgroundColor;
        if (bgColor) {
            document.documentElement.style.setProperty(`--bg-color-${index + 1}`, bgColor);
        }
    });
}

// DOM-targets will be resolved when the header is present. Declare here so
// functions below can reference them.
let gallery;
let thumb;
let scrollbar;
let slides = [];
let selectDisplay;
let logoContainer;
let dateText;

// Drag state - module level so updateScrollbar can check it
let isDraggingThumb = false;

// Reserved space for social links area on the right side of the scrollbar
const SOCIAL_LINKS_RESERVED_SPACE = 470;
const SOCIAL_LINKS_RESERVED_SPACE_MOBILE = 40;

// Helper to get reserved space based on screen size
function getSocialLinksReservedSpace() {
    try {
        if (window.matchMedia && window.matchMedia('(max-width: 800px)').matches) {
            return SOCIAL_LINKS_RESERVED_SPACE_MOBILE;
        }
    } catch (err) {
        // Fallback if matchMedia not available
    }
    return SOCIAL_LINKS_RESERVED_SPACE;
}

// Dynamic z-index management for social links when thumb approaches on mobile
function manageSocialLinksZIndex() {
    if (!thumb || !scrollbar) return;

    const socialContainer = document.querySelector('.social-container');
    if (!socialContainer) return;

    // Only apply dynamic z-index on mobile screens
    try {
        if (!window.matchMedia || !window.matchMedia('(max-width: 800px)').matches) {
            // On desktop, keep social in front
            socialContainer.style.zIndex = '1500';
            return;
        }
    } catch (err) {
        return;
    }

    // On mobile, scrollbar thumb (z-index 1400) should always be in front of social
    // Social stays at 1300 so thumb can pass over it
    // No dynamic changes needed - CSS handles it
    socialContainer.style.zIndex = '1300';
}

// Helper to resolve DOM references once header is inserted
function resolveDom() {
    gallery = document.getElementById('gallery');
    thumb = document.getElementById('scrollbar-thumb');
    scrollbar = document.querySelector('.custom-scrollbar');
    slides = gallery ? Array.from(gallery.querySelectorAll('.slide')) : [];
    selectDisplay = document.getElementById('select-display');
    logoContainer = document.getElementById('logo-container');
    dateText = document.getElementById('date-text');
}

// Apply mobile crop positions based on data-mobile-crop attribute
// This allows fine-tuning which part of landscape images shows on mobile
function applyMobileCropPositions() {
    if (!gallery) return;
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 800px)').matches;
    const slideElements = gallery.querySelectorAll('.slide');

    slideElements.forEach(slide => {
        const img = slide.querySelector('img');
        if (!img) return;

        const cropPercent = slide.dataset.mobileCrop;
        if (cropPercent !== undefined && isMobile) {
            img.style.objectPosition = `${cropPercent}% center`;
        } else {
            // Reset to default (center) on desktop
            img.style.objectPosition = '';
        }
    });
}

// Ensure a custom scrollbar DOM exists on the front page. If the HTML doesn't
// include the elements, create them so the rest of the code can operate
// without assuming presence in the template.
function ensureScrollbarExists() {
    if (!document.getElementById('gallery')) return; // only for front page

    // Find existing scrollbar containers; prefer one that already contains
    // a populated thumb (label/icon). Otherwise create/populate the first.
    let scCandidates = Array.from(document.querySelectorAll('.custom-scrollbar'));
    let sc = scCandidates.length ? scCandidates.find(c => c.querySelector('.thumb-label') || c.querySelector('.thumb-icon')) || scCandidates[0] : null;

    // Create container if missing
    if (!sc) {
        sc = document.createElement('div');
        sc.className = 'custom-scrollbar';
        document.body.appendChild(sc);
    }

    // Ensure thumb exists
    let thumbEl = sc.querySelector('#scrollbar-thumb');
    if (!thumbEl) {
        thumbEl = document.createElement('div');
        thumbEl.id = 'scrollbar-thumb';
        thumbEl.className = 'custom-scrollbar-thumb';
        sc.appendChild(thumbEl);
    }

    // Build thumb content structure with inline SVG for color control
    const arrowSvg = `<svg viewBox="0 0 17.2 33.2" aria-hidden="true"><path d="M2.5,31.1l13.2-14.5L2.5,2.1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    thumbEl.innerHTML = `
        <div class="thumb-icon thumb-icon-left">${arrowSvg}</div>
        <div class="thumb-content">
            <div class="thumb-description"></div>
            <div class="thumb-location"></div>
            <div class="thumb-photographer"></div>
        </div>
        <div class="thumb-icon thumb-icon-right">${arrowSvg}</div>
    `;

    // refresh DOM refs
    resolveDom();
}

// Load the external SVG and insert it into #logo-container so it remains part
// of the DOM and stylable with currentColor. If an inline svg already exists,
// we keep it.
async function loadAndInitLogo() {
    if (!logoContainer) return;
    // Prefer an inner insertion target (#logo-inner) so we don't remove other
    // children (like the date text) when injecting the SVG. Fall back to
    // logoContainer itself if #logo-inner is not present.
    const svgTarget = logoContainer.querySelector('#logo-inner') || logoContainer;
    // Try to find an inline SVG first. If missing, load the shared logo file.
    let svg = svgTarget.querySelector('svg');
    if (!svg) {
        try {
            const resp = await fetch('assets/logo.svg', { cache: 'no-cache' });
            if (resp.ok) {
                const txt = await resp.text();
                // Parse the returned SVG and insert only the first <svg> element to
                // avoid duplicated SVGs when the file accidentally contains multiple.
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(txt, 'image/svg+xml');
                    const fetchedSvg = doc.querySelector('svg');
                    if (fetchedSvg) {
                        // Clear the target and adopt the fetched svg into the current document
                        svgTarget.innerHTML = '';
                        const imported = document.importNode(fetchedSvg, true);
                        svgTarget.appendChild(imported);
                        svg = svgTarget.querySelector('svg');
                    } else {
                        // fallback: insert raw text
                        svgTarget.innerHTML = txt;
                        svg = svgTarget.querySelector('svg');
                    }
                } catch (err) {
                    svgTarget.innerHTML = txt;
                    svg = svgTarget.querySelector('svg');
                }
            }
        } catch (err) {
            // ignore - we'll bail out below if svg still missing
            console.warn('Failed to fetch logo.svg', err);
        }
    }
    if (!svg) return;
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('width');
    svg.removeAttribute('height');

    // Remove any internal <style> blocks (they may set .cls-1 { fill: #fff })
    // and remove explicit fill attributes so the SVG will use currentColor.
    try {
        svg.querySelectorAll('style').forEach(s => s.remove());
    } catch (err) {}
    try {
        svg.querySelectorAll('[fill]').forEach(el => el.removeAttribute('fill'));
    } catch (err) {}
    // Also remove class attributes that might be targeted by removed styles
    try {
        svg.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    } catch (err) {}
    // Remove inline style attributes which may include hard-coded fills
    try {
        svg.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    } catch (err) {}
    svg.style.fill = 'currentColor';
    svg.style.stroke = 'currentColor';


    // Choose an initial color for the logo/date based on page type.
    // Check if this is the front page or a subpage
    try {
        const filename = window.location.pathname.split('/').pop() || 'index.html';
        const isIndex = filename === '' || filename === 'index.html';

        if (isIndex) {
            // Front page: use the first slide's background color directly
            // This ensures correct color on initial load before scroll events fire
            let initial;
            try {
                initial = bgColorForIndex(0) || '#FEAD47';
            } catch (err) {
                initial = '#FEAD47';
            }
            logoContainer.style.color = initial;
            if (dateText) dateText.style.color = initial;
            try { document.documentElement.style.setProperty('--current-bg', initial); } catch (err) {}
        } else {
            // Subpages: header-universal.js handles logo/menu colors
            // Don't override - let CSS set the background and header-universal.js will read it
            return;
        }
    } catch (err) {
        // Fallback only for front page if something goes wrong
        const filename = window.location.pathname.split('/').pop() || 'index.html';
        const isIndex = filename === '' || filename === 'index.html';
        if (isIndex) {
            const fallbackColor = '#FEAD47';
            logoContainer.style.color = fallbackColor;
            if (dateText) dateText.style.color = fallbackColor;
            try { document.documentElement.style.setProperty('--current-bg', fallbackColor); } catch (err) {}
        }
    }
}

// cheap recolor: set container color (svg uses currentColor)
let lastLogoColor = '';
function setLogoColor(color) {
    if (!logoContainer) return;
    if (color === lastLogoColor) return;
    lastLogoColor = color;
    logoContainer.style.color = color;
    if (dateText) dateText.style.color = color;
    // On mobile, also set social icon/text color inline so they follow the same dynamic color
    try {
        if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
            const socials = document.querySelectorAll('.social-btn, .social-link');
            socials.forEach(el => {
                el.style.color = color;
            });
        } else {
            // clear any inline color on larger screens so CSS rules take over
            const socials = document.querySelectorAll('.social-btn, .social-link');
            socials.forEach(el => {
                el.style.color = '';
            });
        }
    } catch (err) {}
}

// Set dynamic color for thumb text and arrows
function setThumbColor(color) {
    if (!thumb) return;
    try {
        // Create a darkened version of the background color for better contrast
        const darkenedColor = darkenColor(color, 0.3);

        // Set color for all text elements in thumb
        const descEl = thumb.querySelector('.thumb-description');
        const locEl = thumb.querySelector('.thumb-location');
        const photoEl = thumb.querySelector('.thumb-photographer');

        if (descEl) descEl.style.color = darkenedColor;
        if (locEl) locEl.style.color = darkenedColor;
        if (photoEl) photoEl.style.color = darkenedColor;

        // Set color for both arrow icons (SVG uses currentColor)
        const iconLeft = thumb.querySelector('.thumb-icon-left');
        const iconRight = thumb.querySelector('.thumb-icon-right');
        if (iconLeft) iconLeft.style.color = darkenedColor;
        if (iconRight) iconRight.style.color = darkenedColor;
    } catch (err) { /* non-critical */ }
}

function updateScrollbar() {
    if (!gallery || !thumb || !scrollbar) return;

    // Skip thumb positioning during drag to avoid fighting with drag handler
    if (isDraggingThumb) return;

    const maxScroll = gallery.scrollWidth - gallery.clientWidth;
    const scrollPercentage = maxScroll === 0 ? 0 : gallery.scrollLeft / maxScroll;

    // Get the actual rendered thumb width (respects CSS min-width/max-width)
    // This ensures consistency with handleDragMove which also uses rendered width
    const thumbWidth = thumb.getBoundingClientRect().width;

    // Calculate available space, accounting for social links area on the right
    const availableWidth = scrollbar.clientWidth - getSocialLinksReservedSpace();
    const available = Math.max(0, availableWidth - thumbWidth);
    const thumbPosition = scrollPercentage * available;
    thumb.style.left = thumbPosition + 'px';

    // Manage social links z-index based on thumb position
    manageSocialLinksZIndex();

    // update descriptive content inside the thumb to reflect the currently centered slide
    try {
        const viewportCenter = (gallery.scrollLeft || 0) + (gallery.clientWidth / 2);
        let best = 0; let bestDist = Infinity;
        slides.forEach((s, i) => {
            const c = s.offsetLeft + (s.offsetWidth / 2);
            const d = Math.abs(c - viewportCenter);
            if (d < bestDist) { bestDist = d; best = i; }
        });
        const current = slides[best];
        const img = current ? current.querySelector('img') : null;

        // Get description from alt text
        const description = (current && img && img.alt) ? img.alt : '';

        // Get location and photographer from data attributes
        const location = current ? (current.dataset.location || '') : '';
        const photographer = current ? (current.dataset.photographer || '') : '';

        // Update thumb elements
        const descEl = thumb.querySelector('.thumb-description');
        const locEl = thumb.querySelector('.thumb-location');
        const photoEl = thumb.querySelector('.thumb-photographer');

        if (descEl) descEl.textContent = description;
        if (locEl) locEl.textContent = location;
        if (photoEl) photoEl.textContent = photographer ? `foto: ${photographer}` : '';
    } catch (err) { /* non-critical */ }
}

function parseRGBString(s) {
    if (!s) return [0,0,0];
    s = s.trim();
    if (s.startsWith('rgb')) {
        const nums = s.match(/[\d.]+/g).slice(0,3).map(Number);
        return nums;
    }
    if (s.startsWith('#')) {
        const hex = s.slice(1);
        if (hex.length === 3) {
            return [
                parseInt(hex[0]+hex[0],16),
                parseInt(hex[1]+hex[1],16),
                parseInt(hex[2]+hex[2],16)
            ];
        }
        return [
            parseInt(hex.slice(0,2),16),
            parseInt(hex.slice(2,4),16),
            parseInt(hex.slice(4,6),16)
        ];
    }
    return [0,0,0];
}

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(ca, cb, t) {
    return `rgb(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(lerp(ca[2], cb[2], t))})`;
}

function lightenColor(color, amount = 0.15) {
    const rgb = parseRGBString(color);
    const r = Math.round(lerp(rgb[0], 255, amount));
    const g = Math.round(lerp(rgb[1], 255, amount));
    const b = Math.round(lerp(rgb[2], 255, amount));
    return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(color, amount = 0.3) {
    const rgb = parseRGBString(color);
    const r = Math.round(lerp(rgb[0], 0, amount));
    const g = Math.round(lerp(rgb[1], 0, amount));
    const b = Math.round(lerp(rgb[2], 0, amount));
    return `rgb(${r}, ${g}, ${b})`;
}

function rootVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function bgColorForIndex(i) {
    const varName = `--bg-color-${i+1}`;
    const val = rootVar(varName);
    if (val) return val;
    if (slides[i]) return getComputedStyle(slides[i]).backgroundColor || 'rgb(0,0,0)';
    return 'rgb(0,0,0)';
}

let slidePositions = [];
function recomputeSlidePositions() {
    slidePositions = slides.map(s => s.offsetLeft);
}

function updateBackgroundOnScroll() {
    if (!gallery) return;
    if (slides.length === 0) {
        const col = bgColorForIndex(0);
        document.body.style.background = col;
        setLogoColor(col);
        setThumbColor(col);
        // keep the root CSS variable in sync so mobile selects use the same color
        try { document.documentElement.style.setProperty('--current-bg', col); } catch (err) {}
        return;
    }
    const scrollLeft = gallery.scrollLeft;
    if (slidePositions.length < 2) {
        const col = bgColorForIndex(0);
        document.body.style.background = col;
        setThumbColor(col);
        // also sync root var when there's only a single slide / no interpolation
        try { document.documentElement.style.setProperty('--current-bg', col); } catch (err) {}
        return;
    }
    // Determine interpolation between two neighbouring slides based on the
    // viewport center. Using slide centers is more robust than comparing
    // raw offsetLeft vs scrollLeft, and prevents the first slide from
    // inheriting the next slide's color after scrolling back and forth.
    const viewportCenter = scrollLeft + (gallery.clientWidth / 2);
    const centers = slides.map(s => s.offsetLeft + (s.offsetWidth / 2));
    let j = 0;
    for (let i = 0; i < centers.length - 1; i++) {
        if (viewportCenter >= centers[i] && viewportCenter <= centers[i + 1]) {
            j = i; break;
        }
        if (viewportCenter > centers[centers.length - 2]) {
            j = centers.length - 2;
        }
    }
    const start = centers[j];
    const end = centers[j + 1];
    const span = Math.max(1, end - start);
    let t = (viewportCenter - start) / span;
    t = Math.max(0, Math.min(1, t));

    const colorA = bgColorForIndex(j);
    const colorB = bgColorForIndex(j + 1);
    const ca = parseRGBString(colorA);
    const cb = parseRGBString(colorB);
    const blended = lerpColor(ca, cb, t);
    document.body.style.background = blended;
    setLogoColor(blended);
    setThumbColor(blended);
    // update the root CSS variable so mobile CSS follows the blended color
    // NB: use --current-bg so we don't clobber slide-specific --bg-color-N variables
    try { document.documentElement.style.setProperty('--current-bg', blended); } catch (err) {}
    try {
        const light = lightenColor(blended, 0.5);
        if (thumb) thumb.style.background = light;
        document.documentElement.style.setProperty('--select-hover-bg', light);
    } catch (err) {}
}

let rafId = null;
function onGalleryScroll() {
    updateScrollbar();
    if (rafId === null) {
        rafId = requestAnimationFrame(() => {
            updateBackgroundOnScroll();
            rafId = null;
        });
    }
}

// Attach all behaviours that require the header/menu DOM to be present.
function attachBehaviors() {
    resolveDom();

    // ensure the scrollbar exists on the front page and refresh refs
    ensureScrollbarExists();
    resolveDom();

    // Auto-advance (carousel) state: advance to next slide every 4s.
    // It respects user interaction (dragging/hover/focus) and page visibility.
    let autoTimer = null;
    const autoplayInterval = 4000; // ms
    const firstScrollDelay = 1500; // faster first scroll so users know they can scroll
    let isFirstAutoScroll = true; // track if this is the first auto-scroll
    let currentAutoIndex = 0;
    let isAutoScrolling = false; // flag to track programmatic scrolling
    let pauseTimer = null; // timer for pausing auto-advance after manual scroll
    const pauseDuration = 10000; // 10 seconds pause after manual scroll

    function computeCurrentSlideIndex() {
        if (!gallery || slides.length === 0) return 0;
        const viewportCenter = (gallery.scrollLeft || 0) + (gallery.clientWidth / 2);
        const centers = slides.map(s => s.offsetLeft + (s.offsetWidth / 2));
        let best = 0; let bestDist = Infinity;
        centers.forEach((c, i) => {
            const d = Math.abs(c - viewportCenter);
            if (d < bestDist) { bestDist = d; best = i; }
        });
        return best;
    }

    function goToSlideIndex(i) {
        if (!gallery || slides.length === 0) return;
        const idx = ((i % slides.length) + slides.length) % slides.length;
        currentAutoIndex = idx;
        // Ensure slidePositions are up-to-date
        if (!slidePositions || slidePositions.length !== slides.length) recomputeSlidePositions();
        const left = slidePositions[idx] || 0;
        try {
            gallery.scrollTo({ left, behavior: 'smooth' });
        } catch (err) {
            gallery.scrollLeft = left;
        }

        // Reset flag after a longer delay to allow smooth scroll animation to complete
        setTimeout(() => { isAutoScrolling = false; }, 1000);
    }

    function advanceToNextSlide() {
        // Do not advance while user is dragging
        if (typeof isDragging !== 'undefined' && isDragging) return;
        // If user is actively scrolling (recent RAF) avoid jitter by checking
        currentAutoIndex = computeCurrentSlideIndex();

        let nextIndex;
        // When at the last slide, loop back to the first
        if (currentAutoIndex === slides.length - 1) {
            nextIndex = 0;
        } else {
            // Otherwise, advance to the next slide
            nextIndex = currentAutoIndex + 1;
        }

        // Set flag before calling goToSlideIndex
        isAutoScrolling = true;
        goToSlideIndex(nextIndex);
    }

    function startAutoAdvance() {
        stopAutoAdvance();
        if (!gallery || slides.length <= 1) return;
        // set current index from current scroll position
        currentAutoIndex = computeCurrentSlideIndex();

        if (isFirstAutoScroll) {
            // First scroll happens faster so users understand they can scroll
            autoTimer = setTimeout(() => {
                advanceToNextSlide();
                isFirstAutoScroll = false;
                // Now start the regular interval
                autoTimer = setInterval(advanceToNextSlide, autoplayInterval);
            }, firstScrollDelay);
        } else {
            // Regular interval for subsequent scrolls
            autoTimer = setInterval(advanceToNextSlide, autoplayInterval);
        }
    }

    function stopAutoAdvance() {
        if (autoTimer) {
            clearTimeout(autoTimer); // works for both setTimeout and setInterval
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    if (gallery) gallery.addEventListener('scroll', onGalleryScroll);
    window.addEventListener('resize', () => {
        recomputeSlidePositions();
        updateScrollbar();
        updateBackgroundOnScroll();
        applyMobileCropPositions();
    });

    // Handle user scroll to pause auto-advance
    function onUserScroll() {
        // Only pause auto-advance if this is user-initiated scrolling, not auto-advance
        if (!isAutoScrolling) {
            // Pause auto-advance for 10 seconds on manual scroll
            stopAutoAdvance();

            // Clear existing pause timer if any
            if (pauseTimer) {
                clearTimeout(pauseTimer);
            }

            // Set new pause timer - restart auto-advance after 10 seconds
            pauseTimer = setTimeout(() => {
                pauseTimer = null;
                startAutoAdvance();
            }, pauseDuration);
        }
    }

    // Listen for scroll to pause auto-advance on user interaction
    try {
        document.addEventListener('scroll', onUserScroll, { passive: true });
        window.addEventListener('scroll', onUserScroll, { passive: true });
        if (gallery) gallery.addEventListener('scroll', onUserScroll, { passive: true });
    } catch (err) {}

    // Apply mobile crop positions immediately
    applyMobileCropPositions();

    // initial setup: wait for images
    let imagesLoaded = 0;
    const totalImages = slides.length;
    if (totalImages === 0) {
        recomputeSlidePositions();
        updateScrollbar();
        updateBackgroundOnScroll();
        // start autoplay when static content is ready
        startAutoAdvance();
    } else {
        slides.forEach(s => {
            const img = s.querySelector('img');
            if (!img) { imagesLoaded++; return; }
            if (img.complete) {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    recomputeSlidePositions();
                    updateScrollbar();
                    updateBackgroundOnScroll();
                }
            } else {
                img.addEventListener('load', () => {
                    imagesLoaded++;
                    if (imagesLoaded === totalImages) {
                        recomputeSlidePositions();
                        updateScrollbar();
                        updateBackgroundOnScroll();
                        // start autoplay once images and layout are ready
                        startAutoAdvance();
                    }
                });
                img.addEventListener('error', () => {
                    imagesLoaded++;
                    if (imagesLoaded === totalImages) {
                        recomputeSlidePositions();
                        updateScrollbar();
                        updateBackgroundOnScroll();
                        // start autoplay even if some images errored
                        startAutoAdvance();
                    }
                });
            }
        });
    }

    // Dragging with correct offset so the thumb doesn't jump
    let isDragging = false;
    let dragOffset = 0;
    let activePointerId = null; // track the active pointer for proper capture

    function getPointerX(e) {
        // Handle both pointer events and touch events
        if (e.touches && e.touches.length > 0) {
            return e.touches[0].clientX;
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return e.changedTouches[0].clientX;
        }
        return e.clientX;
    }

    function onThumbPointerDown(e) {
        if (!thumb) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const thumbRect = thumb.getBoundingClientRect();
        const pointerX = getPointerX(e);
        dragOffset = pointerX - thumbRect.left;
        isDragging = true;
        isDraggingThumb = true; // module-level flag to prevent updateScrollbar interference
        activePointerId = e.pointerId || null;
        if (gallery) gallery.classList.add('dragging-scrollbar');
        if (e.pointerId && thumb.setPointerCapture) {
            try { thumb.setPointerCapture(e.pointerId); } catch (err) {}
        }
        // Add dragging class to thumb for visual feedback
        thumb.classList.add('dragging');
    }

    function onThumbTouchStart(e) {
        if (!thumb) return;
        e.preventDefault();
        e.stopPropagation();
        const thumbRect = thumb.getBoundingClientRect();
        const pointerX = getPointerX(e);
        dragOffset = pointerX - thumbRect.left;
        isDragging = true;
        isDraggingThumb = true; // module-level flag to prevent updateScrollbar interference
        if (gallery) gallery.classList.add('dragging-scrollbar');
        thumb.classList.add('dragging');
    }

    function handleDragMove(pointerX) {
        if (!isDragging || !thumb || !scrollbar || !gallery) return;
        const scrollbarRect = scrollbar.getBoundingClientRect();
        const thumbWidth = thumb.getBoundingClientRect().width;
        // Calculate available space, accounting for social links area on the right
        const availableWidth = scrollbarRect.width - getSocialLinksReservedSpace();
        const available = Math.max(0, availableWidth - thumbWidth);
        let thumbLeft = pointerX - scrollbarRect.left - dragOffset;
        thumbLeft = Math.max(0, Math.min(available, thumbLeft));
        const scrollPercentage = available === 0 ? 0 : thumbLeft / available;
        pauseAutoAdvanceWithTimer(); // pause auto-advance while dragging

        // Directly update thumb position during drag
        thumb.style.left = thumbLeft + 'px';

        // Update gallery scroll to match
        gallery.scrollLeft = scrollPercentage * (gallery.scrollWidth - gallery.clientWidth);
    }

    function onDocumentPointerMove(e) {
        if (!isDragging) return;
        // Only respond to the same pointer that started the drag
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        handleDragMove(getPointerX(e));
    }

    function onDocumentTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault(); // Prevent page scrolling while dragging
        handleDragMove(getPointerX(e));
    }

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        // Keep isDraggingThumb true to prevent updateScrollbar from moving thumb
        activePointerId = null;
        if (thumb) thumb.classList.remove('dragging');
        if (e && e.pointerId && thumb && thumb.releasePointerCapture) {
            try { thumb.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        // Snap to closest slide immediately
        if (!gallery || slides.length === 0) {
            isDraggingThumb = false;
            return;
        }

        // Find closest slide
        const viewportCenter = gallery.scrollLeft + (gallery.clientWidth / 2);
        let closestIdx = 0;
        let closestDist = Infinity;
        slides.forEach((s, i) => {
            const slideCenter = s.offsetLeft + (s.offsetWidth / 2);
            const dist = Math.abs(slideCenter - viewportCenter);
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }
        });

        // Smoothly scroll to closest slide
        const targetLeft = slidePositions[closestIdx] || 0;
        gallery.classList.remove('dragging-scrollbar');
        isDraggingThumb = false;

        try {
            gallery.scrollTo({ left: targetLeft, behavior: 'smooth' });
        } catch (err) {
            gallery.scrollLeft = targetLeft;
        }
    }

    function onDocumentPointerUp(e) {
        endDrag(e);
    }

    function onDocumentTouchEnd(e) {
        endDrag(e);
    }

    if (thumb) {
        // Pointer events (works for mouse and some touch)
        thumb.addEventListener('pointerdown', onThumbPointerDown);
        document.addEventListener('pointermove', onDocumentPointerMove);
        document.addEventListener('pointerup', onDocumentPointerUp);
        document.addEventListener('pointercancel', onDocumentPointerUp);

        // Explicit touch events for better mobile support
        thumb.addEventListener('touchstart', onThumbTouchStart, { passive: false });
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        document.addEventListener('touchend', onDocumentTouchEnd);
        document.addEventListener('touchcancel', onDocumentTouchEnd);
    }

    // Helper function to pause auto-advance with timer
    function pauseAutoAdvanceWithTimer() {
        stopAutoAdvance();

        // Clear existing pause timer if any
        if (pauseTimer) {
            clearTimeout(pauseTimer);
        }

        // Set new pause timer - restart auto-advance after 10 seconds
        pauseTimer = setTimeout(() => {
            pauseTimer = null;
            startAutoAdvance();
        }, pauseDuration);
    }

    // Pause autoplay when user interacts, resume afterward
    try {
        if (gallery) {
            gallery.addEventListener('pointerdown', () => pauseAutoAdvanceWithTimer());
            gallery.addEventListener('touchstart', () => pauseAutoAdvanceWithTimer(), { passive: true });
            // Remove immediate resume handlers since we want the 10-second timer to control resumption
            // gallery.addEventListener('pointerup', () => startAutoAdvance());
            // gallery.addEventListener('touchend', () => startAutoAdvance());
            gallery.addEventListener('mouseenter', () => stopAutoAdvance());
            gallery.addEventListener('mouseleave', () => {
                // Only restart if there's no active pause timer
                if (!pauseTimer) {
                    startAutoAdvance();
                }
            });
        }
        // Pause when tab is hidden to save CPU and avoid missed animations
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoAdvance();
                // Clear pause timer when tab is hidden
                if (pauseTimer) {
                    clearTimeout(pauseTimer);
                    pauseTimer = null;
                }
            } else {
                startAutoAdvance();
            }
        });
        // Also stop when the user actively focuses inputs to avoid surprises
        window.addEventListener('focus', () => {
            // Only restart if there's no active pause timer
            if (!pauseTimer) {
                startAutoAdvance();
            }
        });
        window.addEventListener('blur', () => stopAutoAdvance());
    } catch (err) {
        // non-critical: ignore
    }

    if (scrollbar) {
        scrollbar.addEventListener('click', (e) => {
            if (!gallery || !thumb) return;
            if (e.target === scrollbar) {
                const scrollbarRect = scrollbar.getBoundingClientRect();
                const clickPosition = e.clientX - scrollbarRect.left;
                const thumbWidth = thumb.getBoundingClientRect().width;
                // Calculate available space, accounting for social links area on the right
                const availableWidth = scrollbarRect.width - getSocialLinksReservedSpace();
                const thumbLeft = Math.max(0, Math.min(availableWidth - thumbWidth, clickPosition - thumbWidth / 2));
                const available = Math.max(0, availableWidth - thumbWidth);
                const scrollPercentage = available === 0 ? 0 : thumbLeft / available;
                pauseAutoAdvanceWithTimer();
                gallery.scrollLeft = scrollPercentage * (gallery.scrollWidth - gallery.clientWidth);
            }
        });
    }

    // expose navigatePage globally for the fallback select onchange attribute
    window.navigatePage = function(page) {
        if (!page || page === 'home') {
            window.location.href = 'index.html';
            return;
        }

        // map menu values to filenames
        const map = {
            'home': 'index.html',
            'about': 'info.html',
            'program': 'program.html',
            'tickets': 'tickets.html',
            'volunteer': 'volunteer.html',
            'camp': 'camp.html',
            'association': 'association.html',
            'contact': 'contact.html',
            'skurvognen': 'skurvognen.html',
            // legacy/aliases
            'music': 'program.html',
            'musik': 'program.html',
            'gallery': 'program.html'
        };

        const target = map[page];
        if (target) {
            window.location.href = target;
            return;
        }

        // fallback behaviour: reset native select and show a temporary alert
        alert('Navigation to ' + page.charAt(0).toUpperCase() + page.slice(1) + ' page');
        const pm = document.getElementById('page-menu');
        if (pm) pm.value = 'home';
    };

    // custom select behaviour
    (function () {
        const wrapper = document.getElementById('custom-select');
        if (!wrapper) return;
        const display = document.getElementById('select-display');
        const options = document.getElementById('select-options');
        const fallback = document.getElementById('page-menu');

        // Determine current page from the filename and set the select display
        // so it reflects the active page on load.
        try {
            const filename = window.location.pathname.split('/').pop() || 'index.html';
            const filenameMap = {
                'index.html': 'home',
                'about.html': 'about',
                'info.html': 'about',
                'program.html': 'program',
                'tickets.html': 'tickets',
                'volunteer.html': 'volunteer',
                'camp.html': 'camp',
                'association.html': 'association',
                'contact.html': 'contact',
                'skurvognen.html': 'skurvognen'
            };
            const currentValue = filenameMap[filename] || (filename.replace('.html','') || 'home');
            const initialLi = options.querySelector(`li[data-value="${currentValue}"]`) || options.querySelector('li.selected') || options.querySelector('li');
                if (initialLi) {
                options.querySelectorAll('li').forEach(i => i.classList.remove('selected'));
                initialLi.classList.add('selected');
                // Preserve the caret element (arrow) inside the display when
                // updating the visible label. Using textContent would remove
                // the caret <span>, so move the caret and re-append it.
                try {
                    const caret = display.querySelector('.select-caret');
                    if (caret) {
                        // detach caret, set text, then re-append caret
                        display.textContent = '';
                        display.appendChild(document.createTextNode(initialLi.textContent));
                        display.appendChild(caret);
                    } else {
                        display.textContent = initialLi.textContent;
                    }
                } catch (err) {
                    display.textContent = initialLi.textContent;
                }
                if (fallback) fallback.value = currentValue;
            }

        } catch (err) {
            // ignore - non-critical
        }

        // background box behind display/dropdown: only active on subpages
        const bg = wrapper.querySelector('.select-bg');
        const isSubpage = document.body.classList.contains('is-subpage');

        // Define open/close functions that will be available in outer scope
        let close, open;

        if (bg && isSubpage) {
            function setBgToDisplayHeight() {
                try {
                    if (!bg || !display) return;
                    const dRect = display.getBoundingClientRect();
                    // When collapsed, only use display width
                    bg.style.width = Math.ceil(dRect.width) + 'px';
                    bg.style.height = Math.ceil(dRect.height) + 'px';
                } catch (err) {}
            }

            function setBgToDisplayPlusOptions() {
                try {
                    if (!bg || !display || !options) return;
                    const dRect = display.getBoundingClientRect();
                    const oRect = options.getBoundingClientRect();
                    // Use the wider of display or options width to cover the longest dropdown text
                    const maxWidth = Math.max(dRect.width, oRect.width);
                    bg.style.width = Math.ceil(maxWidth) + 'px';
                    bg.style.height = Math.ceil(dRect.height + oRect.height) + 'px';
                } catch (err) {}
            }

            // initial size
            setBgToDisplayHeight();

            close = () => {
                // shrink background to display height then close
                setBgToDisplayHeight();
                wrapper.classList.remove('open');
                wrapper.setAttribute('aria-expanded','false');
            };

            open = () => {
                wrapper.classList.add('open');
                wrapper.setAttribute('aria-expanded','true');
                // measure after the class is applied so the options are visible
                requestAnimationFrame(() => setBgToDisplayPlusOptions());
            };

            // keep background sized on resize
            window.addEventListener('resize', setBgToDisplayHeight);
        } else {
            // fallback: no background behavior, keep simple open/close
            close = () => { wrapper.classList.remove('open'); wrapper.setAttribute('aria-expanded','false'); };
            open = () => { wrapper.classList.add('open'); wrapper.setAttribute('aria-expanded','true'); };
        }

        wrapper.addEventListener('click', () => {
            if (wrapper.classList.contains('open')) { close(); return; }
            open();
        });

        options.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            options.querySelectorAll('li').forEach(i => i.classList.remove('selected'));
            li.classList.add('selected');
            const value = li.dataset.value;
            // Preserve the caret (arrow) when updating the display label.
            try {
                const caret = display.querySelector('.select-caret');
                if (caret) {
                        display.textContent = '';
                        display.appendChild(document.createTextNode(li.textContent));
                        display.appendChild(caret);
                    } else {
                        display.textContent = li.textContent;
                    }
                // (width-sync removed)
            } catch (err) {
                display.textContent = li.textContent;
            }
            if (fallback) fallback.value = value;
            close();
            window.navigatePage(value);
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) close();
        });

        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wrapper.classList.contains('open') ? close() : open(); }
        });
        // keep background sized on resize
        window.addEventListener('resize', setBgToDisplayHeight);
    })();

    // Ensure autoplay begins promptly (will be restarted later once images finish
    // loading to refresh positions). This prevents a long initial dwell while
    // slow images load.
    try { startAutoAdvance(); } catch (err) {}

    // Start logo loading and initialization
    loadAndInitLogo();
}

// Slide fetching removed: slides are managed offline with the
// `scripts/generate_slides.js` tool. Keep the static slides embedded in
// the HTML and attach behaviors immediately (or after header insertion)
// so the UI logic operates against the existing DOM.
(function init() {
    // Shuffle slides on every page load for variety
    shuffleGallerySlides();

    if (document.getElementById('custom-select')) {
        attachBehaviors();
    } else {
        document.addEventListener('header-inserted', attachBehaviors);
    }
})();




