// Info page - dynamic content loading and scroll-based color transitions
(function() {
    const HERO_BG = '#7D245B';           // Initial body background (darker magenta)
    const HERO_TRANSITION = '#9D3B78';   // Color transition start (matches --info-bg-color)

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        try {
            const response = await fetch('database/info-sections.json');
            const data = await response.json();

            generateInfoBoxes(data.sections);
            generateInfoSections(data.sections);

            // Wait for SectionComponent rendering before initializing scroll features
            setTimeout(() => {
                initColorTransitions();
                document.body.style.backgroundColor = HERO_BG;
                initContactHovers();
            }, 100);
        } catch (error) {
            console.error('Could not load info data:', error);
        }
    }

    function generateInfoBoxes(sections) {
        const grid = document.getElementById('info-boxes-grid');
        if (!grid) return;

        sections.forEach(section => {
            const box = document.createElement('div');
            box.className = 'info-box';
            box.setAttribute('data-section', section.id);
            box.style.backgroundColor = section.color;
            box.textContent = section.title;

            box.addEventListener('click', () => {
                const target = document.getElementById(section.id);
                if (target) {
                    const offset = 100;
                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            });

            grid.appendChild(box);
        });
    }

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

    // Parse "#RRGGBB" to [r, g, b]
    function parseHex(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
    }

    function interpolateColor(color1, color2, t) {
        const c1 = parseHex(color1);
        const c2 = parseHex(color2);
        if (!c1 || !c2) return color1;

        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function initColorTransitions() {
        let sections = [];

        // Header and page elements follow the current background color
        function updateElementColors(bgColor) {
            document.documentElement.style.setProperty('--current-bg', bgColor);

            document.querySelectorAll('.contact-item').forEach(item => {
                item.style.setProperty('--item-color', bgColor);
            });

            SectionComponent.updateButtonStyles(bgColor);
        }

        function updateBackgroundColor() {
            if (sections.length === 0) {
                sections = document.querySelectorAll('.content-section');
                if (sections.length === 0) return;
            }

            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            let currentBgColor = HERO_TRANSITION;

            // Determine where content starts for hero-to-section transition
            const firstSection = sections[0];
            const firstHeader = firstSection.querySelector('.content-section-header');
            const firstSectionColor = firstSection.getAttribute('data-color') || HERO_TRANSITION;
            const headerRect = firstHeader ? firstHeader.getBoundingClientRect() : firstSection.getBoundingClientRect();
            const contentStart = headerRect.top + scrollY;
            const transitionEnd = contentStart - windowHeight * 0.5;

            if (scrollY < transitionEnd && transitionEnd > 0) {
                // Hero area — interpolate from hero color to first section
                const progress = scrollY / transitionEnd;
                currentBgColor = interpolateColor(HERO_TRANSITION, firstSectionColor, progress);
            } else {
                // Past hero — section-based color transitions
                const viewCenter = scrollY + windowHeight / 2;

                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i];
                    const header = section.querySelector('.content-section-header');
                    const rect = header ? header.getBoundingClientRect() : section.getBoundingClientRect();
                    const sectionTop = rect.top + scrollY;
                    const sectionColor = section.getAttribute('data-color') || HERO_TRANSITION;

                    if (i < sections.length - 1) {
                        const nextSection = sections[i + 1];
                        const nextHeader = nextSection.querySelector('.content-section-header');
                        const nextRect = nextHeader ? nextHeader.getBoundingClientRect() : nextSection.getBoundingClientRect();
                        const nextSectionTop = nextRect.top + scrollY;
                        const nextColor = nextSection.getAttribute('data-color') || HERO_TRANSITION;

                        if (viewCenter >= sectionTop && viewCenter < nextSectionTop) {
                            const progress = (viewCenter - sectionTop) / (nextSectionTop - sectionTop);
                            // Start transitioning in the second half of the current section
                            if (progress > 0.5) {
                                currentBgColor = interpolateColor(sectionColor, nextColor, (progress - 0.5) * 2);
                            } else {
                                currentBgColor = sectionColor;
                            }
                            break;
                        }
                    }

                    if (i === sections.length - 1 && viewCenter >= sectionTop) {
                        currentBgColor = sectionColor;
                        break;
                    }
                }
            }

            document.body.style.backgroundColor = currentBgColor;
            updateElementColors(currentBgColor);
        }

        function updateParallax() {
            const heroImage = document.querySelector('.hero-image');
            if (!heroImage) return;

            const scrollY = window.scrollY;
            const heroRect = heroImage.getBoundingClientRect();
            const maxScroll = heroRect.height + heroRect.top + scrollY;

            // Shift from 50% (center) to 70% (right) as user scrolls
            const progress = Math.min(scrollY / maxScroll, 1);
            heroImage.style.objectPosition = `${50 + progress * 20}% center`;
        }

        // RAF-throttled scroll listener
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

        updateBackgroundColor();
        updateParallax();
        window.addEventListener('scroll', requestTick);
    }

    function initContactHovers() {
        document.querySelectorAll('.contact-box span').forEach(span => {
            span.addEventListener('mouseenter', function() {
                const newBgColor = ButtonHover.getRandomColor();
                const newTextColor = ButtonHover.getRandomColor(newBgColor);
                this.style.backgroundColor = newBgColor;
                this.style.color = newTextColor;
            });
        });
    }
})();
