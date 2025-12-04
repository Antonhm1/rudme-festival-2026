// Volunteer page functionality - dynamic content loading and color management

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await loadVolunteerData();
    initializeRoleNavigation();
    initializeColorTransitions();
    setInitialHeaderColor();
    initializeStickyMenu();
});

// Load volunteer data from JSON and generate page content
async function loadVolunteerData() {
    try {
        const response = await fetch('assets/volunteers.json');
        const data = await response.json();

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

// Generate role sections with content
function generateRoleSections(roles) {
    const container = document.getElementById('role-sections-container');

    roles.forEach(role => {
        const section = document.createElement('section');
        section.id = role.id;
        section.className = 'role-section';
        section.setAttribute('data-color', role.color);

        const contentBox = document.createElement('div');
        contentBox.className = 'role-content-box';

        // Header - initially without color, will be set dynamically
        const header = document.createElement('h2');
        header.className = 'role-header';
        header.textContent = role.name;
        contentBox.appendChild(header);

        // Image
        const img = document.createElement('img');
        img.src = role.image;
        img.alt = role.name;
        img.className = 'role-image';
        contentBox.appendChild(img);

        // Description
        const descDiv = document.createElement('div');
        descDiv.className = 'role-description';

        role.description.forEach(paragraph => {
            const p = document.createElement('p');
            p.innerHTML = paragraph; // Using innerHTML to preserve <strong> tags
            descDiv.appendChild(p);
        });

        contentBox.appendChild(descDiv);

        // Button
        const button = document.createElement('button');
        button.className = 'role-button';
        button.textContent = role.buttonText;
        contentBox.appendChild(button);

        section.appendChild(contentBox);
        container.appendChild(section);
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

// Set initial header color to match first role section (frivillig - green)
function setInitialHeaderColor() {
    const initialColor = '#90EE90'; // Green color from frivillig role

    // Wait for header to be injected
    setTimeout(() => {
        const logo = document.querySelector('#logo-inner');
        const dateText = document.querySelector('#date-text');
        const selectDisplay = document.querySelector('.select-display');
        const selectBg = document.querySelector('.select-bg');
        const menuContainer = document.querySelector('.menu-container');

        if (logo) logo.style.color = initialColor;
        if (dateText) dateText.style.color = initialColor;
        if (selectDisplay) {
            selectDisplay.style.color = '#111';
            selectDisplay.style.backgroundColor = initialColor;
        }
        if (selectBg) {
            selectBg.style.backgroundColor = initialColor;
        }
        if (menuContainer) {
            menuContainer.style.backgroundColor = initialColor;
        }

        // Update page background to green
        document.body.style.backgroundColor = initialColor;
    }, 100);
}

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

    // Update header colors based on background
    function updateHeaderColorForBackground(bgColor) {
        const logo = document.querySelector('#logo-inner');
        const dateText = document.querySelector('#date-text');
        const selectBg = document.querySelector('.select-bg');
        const selectDisplay = document.querySelector('.select-display');
        const menuContainer = document.querySelector('.menu-container');

        if (logo) logo.style.color = bgColor;
        if (dateText) dateText.style.color = bgColor;
        if (selectBg) selectBg.style.backgroundColor = bgColor;

        // Update select display background to match current page background
        if (selectDisplay) {
            selectDisplay.style.backgroundColor = bgColor;
        }

        // Update menu container background to match current page background
        if (menuContainer) {
            menuContainer.style.backgroundColor = bgColor;
        }

        // Update all role headers with darker version of background
        const roleHeaders = document.querySelectorAll('.role-header');
        const darkerColor = darkenColor(bgColor, 0.4); // 40% darker
        roleHeaders.forEach(header => {
            header.style.color = darkerColor;
        });

        // Update all role buttons with darker version of background
        const roleButtons = document.querySelectorAll('.role-button');
        const buttonBgColor = darkenColor(bgColor, 0.35); // 35% darker for buttons
        const buttonHoverColor = lightenColor(bgColor, 0.2); // 20% lighter for hover

        roleButtons.forEach(button => {
            button.style.backgroundColor = buttonBgColor;

            // Remove existing hover listeners to avoid duplicates
            button.onmouseenter = function() {
                this.style.backgroundColor = buttonHoverColor;
            };
            button.onmouseleave = function() {
                this.style.backgroundColor = buttonBgColor;
            };
        });
    }

    // Update colors on scroll
    function updateBackgroundColor() {
        // Get current sections
        if (sections.length === 0) {
            sections = document.querySelectorAll('.role-section');
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
        sections = document.querySelectorAll('.role-section');
        console.log('Found sections:', sections.length);

        // Initial update
        updateBackgroundColor();

        // Add scroll listener
        window.addEventListener('scroll', requestTick);
    }, 500); // Increased timeout to ensure sections are fully loaded
}

// Initialize sticky menu behavior
function initializeStickyMenu() {
    const menu = document.querySelector('.menu-container');
    if (!menu) return;

    // Calculate when menu should stick (when it would scroll past 20px from top)
    const stickyPoint = 55; // 75px initial position - 20px final position

    function handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > stickyPoint) {
            // Add fixed class when scrolled past sticky point
            menu.classList.add('menu-fixed');
        } else {
            // Remove fixed class when scrolled back up
            menu.classList.remove('menu-fixed');
        }
    }

    // Listen for scroll with throttling
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

    window.addEventListener('scroll', requestTick);

    // Check initial state
    handleScroll();
}