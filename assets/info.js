// Info page functionality - scroll-based color transitions and parallax

document.addEventListener('DOMContentLoaded', function() {
    initializeColorTransitions();
    initializeParallax();
});

// Initialize gradual color transitions on scroll
function initializeColorTransitions() {
    const startColor = '#FFEE7B'; // Yellow at top
    const endColor = '#1CC937';   // Green when scrolled down

    // Function to interpolate between two hex colors
    function interpolateColor(color1, color2, factor) {
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    // Update colors on scroll
    function updateBackgroundColor() {
        const scrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Calculate scroll progress (0 to 1)
        const scrollProgress = Math.min(scrollY / documentHeight, 1);

        // Interpolate the background color
        const currentBgColor = interpolateColor(startColor, endColor, scrollProgress);

        // Apply the color to body
        document.body.style.backgroundColor = currentBgColor;

        // Update header colors to match
        const logo = document.querySelector('#logo-container svg');
        const dateText = document.querySelector('#date-text');
        const selectBg = document.querySelector('.select-bg');

        if (logo) logo.style.color = currentBgColor;
        if (dateText) dateText.style.color = currentBgColor;
        if (selectBg) selectBg.style.backgroundColor = currentBgColor;

        // Update contact item colors
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach(item => {
            item.style.setProperty('--item-color', currentBgColor);
        });
    }

    // Listen for scroll events with throttling
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateBackgroundColor();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Initial update
    updateBackgroundColor();

    // Add scroll listener
    window.addEventListener('scroll', requestTick);
}

// Initialize horizontal parallax effect on hero image
function initializeParallax() {
    const heroImage = document.querySelector('.hero-image');
    if (!heroImage) return;

    const maxMovement = -20; // Maximum horizontal movement in percentage (negative = move left)

    function updateParallax() {
        const scrollY = window.scrollY;
        const heroHeight = 800; // Height of hero section

        // Calculate progress (0 to 1) based on how far we've scrolled past the hero
        const progress = Math.min(Math.max(scrollY / heroHeight, 0), 1);

        // Calculate horizontal offset
        const offset = progress * maxMovement;

        heroImage.style.marginLeft = offset + '%';
    }

    // Listen for scroll with throttling
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Initial update
    updateParallax();

    // Add scroll listener
    window.addEventListener('scroll', requestTick);
}
