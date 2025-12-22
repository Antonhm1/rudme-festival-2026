// Info page functionality - dynamic content loading and scroll-based color transitions

document.addEventListener('DOMContentLoaded', function() {
    loadInfoData();
});

// Load info sections from JSON and generate content
async function loadInfoData() {
    try {
        const response = await fetch('assets/info-sections.json');
        const data = await response.json();

        generateInfoBoxes(data.sections);
        generateInfoSections(data.sections);

        // Initialize color transitions after content is loaded
        setTimeout(() => {
            initializeColorTransitions();
            // Set initial background color to hero color (not first section)
            const heroColor = '#7D245B';
            document.body.style.backgroundColor = heroColor;

            // Add click handler for contact boxes
            initializeContactBoxClicks();
        }, 100);
    } catch (error) {
        console.error('Could not load info data:', error);
    }
}

// Generate clickable info boxes at the top
function generateInfoBoxes(sections) {
    const grid = document.getElementById('info-boxes-grid');
    if (!grid) return;

    sections.forEach(section => {
        const box = document.createElement('div');
        box.className = 'info-box';
        box.setAttribute('data-section', section.id);
        box.style.backgroundColor = section.color;
        box.textContent = section.title;

        // Click to scroll to section
        box.addEventListener('click', () => {
            const targetSection = document.getElementById(section.id);
            if (targetSection) {
                const offset = 100; // Account for fixed header
                const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });

        grid.appendChild(box);
    });
}

// Generate full info sections using shared SectionComponent
function generateInfoSections(sections) {
    const container = document.getElementById('info-sections-container');
    if (!container) return;

    sections.forEach(section => {
        SectionComponent.create({
            id: section.id,
            title: section.title,
            image: section.image,
            imageCrop: section.crop,
            content: section.content,
            subsections: section.subsections,
            color: section.color,
            container: container
        });
    });
}

// Initialize gradual color transitions on scroll
function initializeColorTransitions() {
    let sections = [];
    const initialColor = '#9D3B78'; // Hero section color (magenta)

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

    // Update page-specific elements based on background color
    // Header elements (logo, date, menu) are handled by header-universal.js via CSS variable
    function updateHeaderColorForBackground(bgColor) {
        // Set CSS variable so header-universal.js can pick it up
        try {
            document.documentElement.style.setProperty('--current-bg', bgColor);
        } catch (err) {}

        // Update contact item colors (page-specific)
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach(item => {
            item.style.setProperty('--item-color', bgColor);
        });
    }

    // Update colors on scroll
    function updateBackgroundColor() {
        // Get current sections
        if (sections.length === 0) {
            sections = document.querySelectorAll('.content-section');
            if (sections.length === 0) return;
        }

        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        let currentBgColor = initialColor;

        // Get first section's content position (find the header inside first section)
        const firstSection = sections[0];
        const firstHeader = firstSection.querySelector('.content-section-header');
        const firstSectionColor = firstSection.getAttribute('data-color') || initialColor;

        // Calculate where the first section content actually starts
        const headerRect = firstHeader ? firstHeader.getBoundingClientRect() : firstSection.getBoundingClientRect();
        const contentStart = headerRect.top + scrollY;

        // Hero transition: starts at 0, ends when content becomes visible
        // Content becomes visible when it enters the bottom half of viewport
        const transitionEnd = contentStart - windowHeight * 0.5;

        if (scrollY < transitionEnd && transitionEnd > 0) {
            // We're in the hero area - interpolate from hero color to first section color
            const progress = scrollY / transitionEnd;
            currentBgColor = interpolateColor(initialColor, firstSectionColor, progress);
        } else {
            // We're past the hero - use section-based color transitions
            const viewCenter = scrollY + windowHeight / 2;

            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const header = section.querySelector('.content-section-header');
                const headerRect = header ? header.getBoundingClientRect() : section.getBoundingClientRect();
                const sectionTop = headerRect.top + scrollY;
                const sectionColor = section.getAttribute('data-color') || initialColor;

                // If we're between two sections
                if (i < sections.length - 1) {
                    const nextSection = sections[i + 1];
                    const nextHeader = nextSection.querySelector('.content-section-header');
                    const nextHeaderRect = nextHeader ? nextHeader.getBoundingClientRect() : nextSection.getBoundingClientRect();
                    const nextSectionTop = nextHeaderRect.top + scrollY;
                    const nextColor = nextSection.getAttribute('data-color') || initialColor;

                    // If view center is between current and next section
                    if (viewCenter >= sectionTop && viewCenter < nextSectionTop) {
                        const sectionProgress = (viewCenter - sectionTop) / (nextSectionTop - sectionTop);

                        // Start transitioning when we're past 50% of current section
                        if (sectionProgress > 0.5) {
                            const transitionProgress = (sectionProgress - 0.5) * 2; // 0 to 1
                            currentBgColor = interpolateColor(sectionColor, nextColor, transitionProgress);
                        } else {
                            currentBgColor = sectionColor;
                        }
                        break;
                    }
                }

                // If we're in the last section
                if (i === sections.length - 1 && viewCenter >= sectionTop) {
                    currentBgColor = sectionColor;
                    break;
                }
            }
        }

        // Apply the color
        document.body.style.backgroundColor = currentBgColor;

        // Update header colors to match
        updateHeaderColorForBackground(currentBgColor);
    }

    // Horizontal parallax effect on hero image (changes crop position)
    function updateParallax() {
        const heroImage = document.querySelector('.hero-image');
        if (!heroImage) return;

        const scrollY = window.scrollY;

        // Calculate when hero image leaves viewport
        const heroRect = heroImage.getBoundingClientRect();
        const heroBottom = heroRect.bottom;
        const maxScroll = heroRect.height + heroRect.top + scrollY; // Full scroll until image is out of view

        // Calculate parallax offset (0% to 100% horizontal position)
        // Starts at 50% (center), moves towards 70% (more right) as you scroll
        const progress = Math.min(scrollY / maxScroll, 1);
        const objectPosX = 50 + (progress * 20); // 50% -> 70%

        heroImage.style.objectPosition = `${objectPosX}% center`;
    }

    // Listen for scroll events with throttling
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateBackgroundColor();
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Initial update
    updateBackgroundColor();
    updateParallax();

    // Add scroll listener
    window.addEventListener('scroll', requestTick);
}

// Initialize click handlers for contact boxes
function initializeContactBoxClicks() {
    const contactBoxes = document.querySelectorAll('.contact-box');
    contactBoxes.forEach(box => {
        box.addEventListener('click', function() {
            this.classList.add('clicked');
        });
    });
}
