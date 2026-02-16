// Volunteer page functionality - dynamic content loading and color management

// Store poster roller instance for color updates
let posterRollerInstance = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await loadVolunteerData();
    await loadPosterRoller();
    initializeRoleNavigation();
    initializeColorTransitions();
    // Note: Header color and sticky behavior are now handled by header-universal.js
});

// Load volunteer data from JSON and generate page content
async function loadVolunteerData() {
    try {
        const response = await fetch('database/volunteers.json');
        const data = await response.json();

        // Set initial background color from first role immediately
        if (data.roles && data.roles.length > 0 && data.roles[0].color) {
            document.body.style.backgroundColor = data.roles[0].color;
            document.documentElement.style.setProperty('--current-bg', data.roles[0].color);
        }

        generateRoleBoxes(data.roles);
        generateRoleSections(data.roles);
    } catch (error) {
        console.error('Error loading volunteer data:', error);
    }
}

// Generate role boxes in the top section
function generateRoleBoxes(roles) {
    const rolesGrid = document.getElementById('roles-grid');

    roles.forEach(role => {
        const button = document.createElement('button');
        button.className = 'role-box';
        button.setAttribute('data-role', role.id);
        button.textContent = role.name;
        button.style.backgroundColor = role.color;
        rolesGrid.appendChild(button);
    });
}

// Generate role sections with content using shared SectionComponent
function generateRoleSections(roles) {
    const container = document.getElementById('role-sections-container');

    roles.forEach(role => {
        SectionComponent.create({
            id: role.id,
            title: role.name,
            image: role.image,
            imageCrop: role.crop,
            content: role.description,
            buttonText: role.buttonText,
            buttonLink: role.buttonLink,
            color: role.color,
            container: container
        });
    });
}

// Set up click handlers for role boxes to scroll to sections
function initializeRoleNavigation() {
    // Use event delegation since elements are dynamically created
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('role-box')) {
            const roleId = e.target.getAttribute('data-role');
            scrollToRole(roleId);
        }
    });
}

// Smooth scroll to role section
function scrollToRole(roleId) {
    const targetSection = document.getElementById(roleId);

    if (targetSection) {
        // Calculate offset accounting for fixed header
        const headerHeight = 150;
        const targetPosition = targetSection.offsetTop - headerHeight;

        // Smooth scroll to target
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Initial header color is now set via initializeColorTransitions
// Header sticky behavior is managed by header-universal.js

// Initialize gradual color transitions on scroll
function initializeColorTransitions() {
    // Initial green color for top of page (matches first role section)
    const initialColor = '#90EE90';
    let sections = [];

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

    // Function to darken a color
    function darkenColor(color, factor = 0.3) {
        // Parse RGB color
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = Math.round(parseInt(match[1]) * (1 - factor));
            const g = Math.round(parseInt(match[2]) * (1 - factor));
            const b = Math.round(parseInt(match[3]) * (1 - factor));
            return `rgb(${r}, ${g}, ${b})`;
        }

        // If it's a hex color, convert to RGB first
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                const r = Math.round(parseInt(result[1], 16) * (1 - factor));
                const g = Math.round(parseInt(result[2], 16) * (1 - factor));
                const b = Math.round(parseInt(result[3], 16) * (1 - factor));
                return `rgb(${r}, ${g}, ${b})`;
            }
            return color;
        };

        return hex2rgb(color);
    }

    // Function to lighten a color
    function lightenColor(color, factor = 0.2) {
        // Parse RGB color
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = Math.min(255, parseInt(match[1]) + (255 - parseInt(match[1])) * factor);
            const g = Math.min(255, parseInt(match[2]) + (255 - parseInt(match[2])) * factor);
            const b = Math.min(255, parseInt(match[3]) + (255 - parseInt(match[3])) * factor);
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }

        // If it's a hex color, convert to RGB first
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                const r = Math.min(255, parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * factor);
                const g = Math.min(255, parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * factor);
                const b = Math.min(255, parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * factor);
                return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
            }
            return color;
        };

        return hex2rgb(color);
    }

    // Update page-specific elements based on background color
    // Header elements (logo, date, menu) are handled by header-universal.js via CSS variable
    function updateHeaderColorForBackground(bgColor) {
        // Set CSS variable so header-universal.js can pick it up
        try {
            document.documentElement.style.setProperty('--current-bg', bgColor);
        } catch (err) {}

        // Update all section headers to black (page-specific)
        const sectionHeaders = document.querySelectorAll('.content-section-header');
        sectionHeaders.forEach(header => {
            header.style.color = '#111'; // Always black
        });

        // Update all section buttons with black background and colored text
        SectionComponent.updateButtonStyles(bgColor);
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
        const viewCenter = scrollY + windowHeight / 2;

        let currentBgColor = initialColor;

        // Find which sections we're between
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + scrollY;
            const sectionBottom = sectionTop + rect.height;
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
                const nextRect = nextSection.getBoundingClientRect();
                const nextSectionTop = nextRect.top + scrollY;
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

        // Apply the color
        document.body.style.backgroundColor = currentBgColor;

        // Update header colors to match
        updateHeaderColorForBackground(currentBgColor);
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

    // Wait for sections to be generated then set up scroll listener
    setTimeout(() => {
        sections = document.querySelectorAll('.content-section');
        console.log('Found sections:', sections.length);

        // Initial update
        updateBackgroundColor();

        // Add scroll listener
        window.addEventListener('scroll', requestTick);
    }, 500); // Increased timeout to ensure sections are fully loaded
}

// Sticky menu behavior is now handled by header-universal.js

// Load poster data and create roller using RollerComponent
async function loadPosterRoller() {
    try {
        const response = await fetch('database/posters.json');
        const data = await response.json();

        // Use role colors from JSON, fallback to defaults if not provided
        const roleColors = data.roleColors || {
            'Frivillige': '#90EE90',
            'Afviklere': '#87CEEB',
            'Arrangører': '#FFB6C1'
        };

        // Transform poster data to RollerComponent format
        const items = data.posters.map(poster => ({
            id: poster.id,
            title: poster.title,
            image: poster.image,
            description: poster.description,
            color: poster.color,
            tags: poster.roles ? poster.roles.map(role => ({
                label: role,
                color: roleColors[role] || '#ccc'
            })) : [],
            tagsHeading: poster.roles && poster.roles.length > 0 ? 'MULIGE ROLLER' : null
        }));

        // Create roller using the component
        posterRollerInstance = RollerComponent.create({
            containerId: 'poster-roller',
            title: 'POSTER',
            titleAlign: 'left',
            items: items,
            buttonTextExpand: 'LÆS MERE',
            buttonTextCollapse: 'LUK',
            scrollSpeed: 0.5,
            touchResumeDelay: 2000,
            infiniteScroll: true,
            parentElement: document.getElementById('poster-roller-container')
        });

        // Update scrollbar color based on initial background
        const currentBgColor = window.getComputedStyle(document.body).backgroundColor;
        RollerComponent.updateScrollbarColor(posterRollerInstance, currentBgColor);

        // Update scrollbar color on scroll (as background changes)
        window.addEventListener('scroll', () => {
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            RollerComponent.updateScrollbarColor(posterRollerInstance, bgColor);
        });

    } catch (error) {
        console.error('Error loading poster data:', error);
    }
}