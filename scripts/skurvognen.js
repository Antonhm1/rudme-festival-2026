/* Skurvognen page JavaScript - handles scroll navigation, event sections, and color transitions */

// Default event data (fallback if JSON not available)
const defaultEvents = [
    {
        id: 'house',
        title: 'HOUSE',
        image: 'pictures/Skurvognen/house.jpg',
        description: 'House-fester i intime omgivelser med fokus på elektronisk musik og fællesskab. Vi skaber rum hvor musikken og stemningen smelter sammen.',
        color: '#FF6B6B'
    },
    {
        id: 'distortion',
        title: 'SCENE PÅ DISTORTION',
        image: 'pictures/Skurvognen/distortion.jpg',
        description: 'Hvert år bygger vi scene og skaber fest på Distortion. En eksplosion af farver, musik og københavnsk gadefest-energi.',
        color: '#4ECDC4'
    },
    {
        id: 'byggefestival',
        title: 'BYGGEFESTIVAL',
        image: 'pictures/Skurvognen/arbejdsfestival.jpg',
        description: 'Arbejdsweekender hvor vi samles om at bygge, male og skabe. Her lærer man nye skills, møder fantastiske mennesker og ser resultatet af fælles indsats.',
        color: '#FFE66D'
    },
    {
        id: 'heartland',
        title: 'HEARTLAND',
        image: 'pictures/Skurvognen/heartland.jpeg',
        description: 'Vi designer og driver frivilligområdet på Heartland Festival. Et sted hvor festivalens hjælpere kan slappe af og genoplade.',
        color: '#95E1D3'
    }
];

// Will be populated from JSON; fallback to defaultEvents
let eventsData = [];

// Load Skurvognen data (about + events) from JSON files
async function loadSkurvognenData() {
    // Load about content
    try {
        const resp = await fetch('database/skurvognen-om.json', { cache: 'no-store' });
        if (resp.ok) {
            const about = await resp.json();
            const sub = document.getElementById('skurvognen-subheading');
            const heading = document.getElementById('skurvognen-om-heading');
            const content = document.getElementById('skurvognen-om-content');

            if (sub && about.underoverskrift) sub.innerText = about.underoverskrift;
            if (heading && about.overskrift) heading.innerText = about.overskrift;
            if (content && about.beskrivelse) {
                // Support array of paragraphs or single string
                if (Array.isArray(about.beskrivelse)) {
                    content.innerHTML = about.beskrivelse.map(p => `<p>${p}</p>`).join('');
                } else {
                    content.innerHTML = about.beskrivelse;
                }
            }
        }
    } catch (err) {
        console.warn('Could not load skurvognen-om.json', err);
    }

    // Load events
    try {
        const resp = await fetch('database/skurvognen-events.json', { cache: 'no-store' });
        if (resp.ok) {
            const events = await resp.json();
            if (Array.isArray(events) && events.length > 0) {
                eventsData = events;
            } else {
                eventsData = defaultEvents;
            }
        } else {
            eventsData = defaultEvents;
        }
    } catch (err) {
        console.warn('Could not load skurvognen-events.json', err);
        eventsData = defaultEvents;
    }

    // Create event sections now that eventsData is available
    createEventSections();
}

document.addEventListener('DOMContentLoaded', function() {
    // Set initial background color
    const initialColor = '#A4C0E0';
    document.body.style.backgroundColor = initialColor;
    document.documentElement.style.setProperty('--current-bg', initialColor);

    // Set up smooth scroll navigation for buttons
    initializeNavigation();

    // Load JSON-driven content (about + events) then init color transitions
    loadSkurvognenData().then(() => {
        setTimeout(() => {
            initializeColorTransitions();
        }, 100);
    });
});

// Set up click handlers for navigation buttons
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');

            // For "events" button, scroll to first event section
            let targetSection;
            if (targetId === 'events') {
                targetSection = document.getElementById('house') || document.querySelector('#events-sections-container .content-section');
            } else {
                targetSection = document.getElementById(targetId);
            }

            if (targetSection) {
                const headerOffset = 100;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Create event sections using SectionComponent
function createEventSections() {
    if (typeof SectionComponent === 'undefined') {
        console.error('SectionComponent not loaded');
        return;
    }

    const container = document.getElementById('events-sections-container');
    if (!container) return;

    eventsData.forEach(event => {
        SectionComponent.create({
            id: event.id,
            title: event.title,
            image: event.image,
            content: event.description,
            color: event.color,
            container: container
        });
    });
}

// Initialize gradual color transitions on scroll
function initializeColorTransitions() {
    const initialColor = '#A4C0E0';
    let sections = [];

    // Function to interpolate between two colors
    function interpolateColor(color1, color2, factor) {
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        // Handle rgb() format
        const rgb2obj = (rgb) => {
            const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            return match ? {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            } : null;
        };

        let c1 = hex2rgb(color1) || rgb2obj(color1);
        let c2 = hex2rgb(color2) || rgb2obj(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    // Update header colors via CSS variable
    function updateHeaderColorForBackground(bgColor) {
        try {
            document.documentElement.style.setProperty('--current-bg', bgColor);
        } catch (err) {}

        // Update button styles
        if (typeof SectionComponent !== 'undefined') {
            SectionComponent.updateButtonStyles(bgColor);
        }
    }

    // Update colors on scroll
    function updateBackgroundColor() {
        if (sections.length === 0) {
            sections = document.querySelectorAll('.content-section');
            if (sections.length === 0) return;
        }

        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const viewCenter = scrollY + windowHeight / 2;

        let currentBgColor = initialColor;

        // Find which sections we're between
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const header = section.querySelector('.content-section-header');
            const headerRect = header ? header.getBoundingClientRect() : section.getBoundingClientRect();
            const sectionTop = headerRect.top + scrollY;
            const sectionColor = section.getAttribute('data-color') || initialColor;

            // If we're before the first section
            if (i === 0 && viewCenter < sectionTop) {
                const distance = sectionTop - viewCenter;
                const transitionDistance = windowHeight;

                if (distance < transitionDistance) {
                    const factor = 1 - (distance / transitionDistance);
                    currentBgColor = interpolateColor(initialColor, sectionColor, factor);
                } else {
                    currentBgColor = initialColor;
                }
                break;
            }

            // If we're between two sections
            if (i < sections.length - 1) {
                const nextSection = sections[i + 1];
                const nextHeader = nextSection.querySelector('.content-section-header');
                const nextHeaderRect = nextHeader ? nextHeader.getBoundingClientRect() : nextSection.getBoundingClientRect();
                const nextSectionTop = nextHeaderRect.top + scrollY;
                const nextColor = nextSection.getAttribute('data-color') || initialColor;

                if (viewCenter >= sectionTop && viewCenter < nextSectionTop) {
                    const sectionProgress = (viewCenter - sectionTop) / (nextSectionTop - sectionTop);

                    if (sectionProgress > 0.5) {
                        const transitionProgress = (sectionProgress - 0.5) * 2;
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

        // Apply the color
        document.body.style.backgroundColor = currentBgColor;
        updateHeaderColorForBackground(currentBgColor);
    }

    // Throttled scroll handler
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

    // Initial update and set up scroll listener
    sections = document.querySelectorAll('.content-section');
    updateBackgroundColor();
    window.addEventListener('scroll', requestTick);
}
