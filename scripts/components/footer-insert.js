document.addEventListener('DOMContentLoaded', function() {
    fetch('assets/footer.html')
        .then(response => response.text())
        .then(data => {
            const footerContainer = document.getElementById('footer-placeholder');
            if (footerContainer) {
                footerContainer.innerHTML = data;
                loadFooterLogo();
                setupDynamicFooterColors();
                // Initialize button hover effect for footer buttons
                if (typeof ButtonHover !== 'undefined') {
                    ButtonHover.init('.footer-buy-ticket-btn');
                }
            }
        })
        .catch(error => console.error('Error loading footer:', error));
});

function loadFooterLogo() {
    const logoContainer = document.getElementById('footer-logo-container');
    if (logoContainer) {
        fetch('pictures/icons/RUDME-logo.svg')
            .then(response => response.text())
            .then(svg => {
                logoContainer.innerHTML = svg;
                const svgElement = logoContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.style.width = '100%';
                    svgElement.style.height = 'auto';
                }
            })
            .catch(error => console.error('Error loading footer logo:', error));
    }
}

function setupDynamicFooterColors() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    let lastColor = '';
    let isFooterVisible = false;

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

    // Check if footer is in viewport
    function isFooterInViewport() {
        const rect = footer.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }

    function updateFooterColor() {
        // Only update if footer is visible
        if (!isFooterInViewport()) {
            isFooterVisible = false;
            return;
        }

        // If footer just became visible, force color check
        if (!isFooterVisible) {
            isFooterVisible = true;
            lastColor = ''; // Force update
        }

        let bgColor;

        // Get current body background color - prefer inline style over computed
        bgColor = document.body.style.backgroundColor;

        // If no inline style, get computed style
        if (!bgColor) {
            bgColor = window.getComputedStyle(document.body).backgroundColor;
        }

        // If body background is empty, use CSS variable as fallback
        if (isEmptyColor(bgColor)) {
            const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--current-bg').trim();
            if (!isEmptyColor(cssVar)) {
                bgColor = cssVar;
            } else {
                // Default to white if no color found
                bgColor = '#ffffff';
            }
        }

        // Skip if color hasn't changed
        if (bgColor === lastColor) return;
        lastColor = bgColor;

        // Keep text black always
        footer.style.color = 'black';

        // Update logo to match background color
        const svgElement = footer.querySelector('svg');
        if (svgElement) {
            svgElement.style.fill = bgColor;
            const paths = svgElement.querySelectorAll('path, circle, rect, polygon');
            paths.forEach(path => {
                if (!path.style.fill || path.style.fill === 'currentColor') {
                    path.style.fill = bgColor;
                }
            });
        }

        // Update button text color to match background
        const buyTicketBtn = footer.querySelector('.footer-buy-ticket-btn');
        if (buyTicketBtn) {
            buyTicketBtn.style.color = bgColor;
        }
    }

    // Use MutationObserver to watch for style changes on body
    const observer = new MutationObserver(() => {
        updateFooterColor();
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

    // Update on scroll (simpler than polling)
    window.addEventListener('scroll', () => {
        if (isFooterInViewport()) {
            updateFooterColor();
        }
    });

    // Also update on window resize
    window.addEventListener('resize', () => {
        if (isFooterInViewport()) {
            updateFooterColor();
        }
    });

    // Initial color update
    updateFooterColor();

    // Use IntersectionObserver to detect when footer enters viewport
    const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Footer just entered viewport - force immediate color update
                lastColor = ''; // Reset to force update
                updateFooterColor();
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of footer is visible
    });

    intersectionObserver.observe(footer);
}