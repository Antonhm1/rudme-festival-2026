// Universal header behavior for all pages
// Handles: sticky menu, dynamic color adaptation based on page background, select hover effects

(function() {
    // Parse RGB from color string
    function parseRGB(color) {
        if (!color) return null;
        color = color.trim();

        // Handle rgb/rgba format
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }

        // Handle hex format
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3) {
                return {
                    r: parseInt(hex[0] + hex[0], 16),
                    g: parseInt(hex[1] + hex[1], 16),
                    b: parseInt(hex[2] + hex[2], 16)
                };
            }
            if (hex.length === 6) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16)
                };
            }
        }

        // Handle named colors
        if (color === 'white') return { r: 255, g: 255, b: 255 };
        if (color === 'black') return { r: 0, g: 0, b: 0 };

        return null;
    }

    // Lighten a color by a given amount (0-1)
    function lightenColor(color, amount) {
        const rgb = parseRGB(color);
        if (!rgb) return color;

        const r = Math.round(rgb.r + (255 - rgb.r) * amount);
        const g = Math.round(rgb.g + (255 - rgb.g) * amount);
        const b = Math.round(rgb.b + (255 - rgb.b) * amount);

        return `rgb(${r}, ${g}, ${b})`;
    }

    // Wait for header to be inserted
    function init() {
        const menu = document.querySelector('.menu-container');
        const logo = document.querySelector('#logo-inner');
        const dateText = document.querySelector('#date-text');
        const selectDisplay = document.querySelector('.select-display');
        const selectBg = document.querySelector('.select-bg');
        const selectOptions = document.querySelector('.select-options');

        if (!menu) {
            // Header not yet inserted, wait for it
            document.addEventListener('header-inserted', init);
            return;
        }

        // Determine if this is the front page (index.html)
        const filename = window.location.pathname.split('/').pop() || 'index.html';
        const isIndex = filename === '' || filename === 'index.html';

        // Skip universal header management on front page - script.js handles it
        if (isIndex) return;

        // Initialize sticky menu behavior
        initStickyMenu(menu);

        // Initialize color observation
        initColorObserver(logo, dateText, selectDisplay, selectBg, selectOptions, menu);
    }

    // Sticky menu - becomes fixed when scrolling past a threshold
    function initStickyMenu(menu) {
        const stickyPoint = 55; // When to switch from absolute to fixed

        function handleScroll() {
            const scrollY = window.scrollY;

            if (scrollY > stickyPoint) {
                menu.classList.add('menu-fixed');
            } else {
                menu.classList.remove('menu-fixed');
            }
        }

        // Throttle scroll handler
        let ticking = false;
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick, { passive: true });

        // Check initial state
        handleScroll();
    }

    // Observe body background color changes and update header elements
    function initColorObserver(logo, dateText, selectDisplay, selectBg, selectOptions, menu) {
        let lastColor = '';

        function updateHeaderColors() {
            // Get current body background color - prefer inline style over computed
            // because CSS !important in stylesheets can interfere
            let bgColor = document.body.style.backgroundColor;

            // If no inline style, get computed style
            if (!bgColor) {
                bgColor = window.getComputedStyle(document.body).backgroundColor;
            }

            // Helper to check if color is "empty" (white, transparent, or unset)
            function isEmptyColor(color) {
                if (!color) return true;
                const c = color.replace(/\s/g, '').toLowerCase();
                return c === '' ||
                    c === 'transparent' ||
                    c === 'rgba(0,0,0,0)' ||
                    c === 'rgb(255,255,255)' ||
                    c === 'rgb(242,242,242)' ||
                    c === 'white';
            }

            // If body background is empty, use CSS variable as fallback
            if (isEmptyColor(bgColor)) {
                const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--current-bg').trim();
                if (!isEmptyColor(cssVar)) {
                    bgColor = cssVar;
                } else {
                    return; // No valid color to use yet
                }
            }

            // Skip if color hasn't changed
            if (bgColor === lastColor) return;
            lastColor = bgColor;

            // Update logo and date text color to match background
            if (logo) logo.style.color = bgColor;
            if (dateText) dateText.style.color = bgColor;

            // Update select/menu backgrounds to match
            if (selectDisplay) selectDisplay.style.backgroundColor = bgColor;
            if (selectBg) selectBg.style.backgroundColor = bgColor;
            if (selectOptions) selectOptions.style.backgroundColor = bgColor;

            // Update all option items too
            if (selectOptions) {
                const items = selectOptions.querySelectorAll('li');
                items.forEach(item => {
                    item.style.backgroundColor = bgColor;
                });
            }

            // Calculate lighter color for hover effect
            const hoverColor = lightenColor(bgColor, 0.3);

            // Update CSS variables for consistency and hover effects
            try {
                document.documentElement.style.setProperty('--current-bg', bgColor);
                document.documentElement.style.setProperty('--select-hover-bg', hoverColor);
            } catch (err) {}

            // Apply hover styles via dynamic stylesheet
            applySelectHoverStyles(bgColor, hoverColor);

            // Update social links on mobile
            updateSocialLinksColor(bgColor);
        }

        // Apply hover styles directly to select menu items via dynamic stylesheet
        function applySelectHoverStyles(baseColor, hoverColor) {
            // Remove any existing hover styles
            const existingStyle = document.getElementById('universal-header-hover-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            // Create new hover styles
            const style = document.createElement('style');
            style.id = 'universal-header-hover-styles';
            style.textContent = `
                .select-options li:hover {
                    background-color: ${hoverColor} !important;
                }
                .select-options li {
                    background-color: ${baseColor} !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Update social links color on mobile
        function updateSocialLinksColor(color) {
            try {
                if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
                    const socials = document.querySelectorAll('.social-btn, .social-link');
                    socials.forEach(el => {
                        el.style.color = color;
                    });
                }
            } catch (err) {}
        }

        // Use MutationObserver to watch for style changes on body
        const observer = new MutationObserver(() => {
            updateHeaderColors();
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // Also observe document.documentElement for CSS variable changes
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });

        // Poll for color changes (backup for pages that change color via scroll)
        let rafId = null;
        function pollColors() {
            updateHeaderColors();
            rafId = requestAnimationFrame(pollColors);
        }

        // Start polling on scroll (more efficient than always polling)
        let isPolling = false;
        let pollTimeout = null;

        function startPolling() {
            if (!isPolling) {
                isPolling = true;
                pollColors();
            }

            // Stop polling after 500ms of no scroll
            if (pollTimeout) clearTimeout(pollTimeout);
            pollTimeout = setTimeout(() => {
                isPolling = false;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }, 500);
        }

        window.addEventListener('scroll', startPolling, { passive: true });

        // Initial color update
        updateHeaderColors();

        // Also update on resize
        window.addEventListener('resize', updateHeaderColors);
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to ensure header-insert.js has run
        setTimeout(init, 50);
    }
})();
