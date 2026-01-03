// Association page functionality - history roller and stats graph

// Store history roller instance
let historyRollerInstance = null;

// Store stats data and state
let statsData = null;
let showAttendees = true;
let showBudget = true;
let showRevenue = true;
let showVolunteers = true;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadAboutContent();
    loadHistoryRoller();
    initStatsGraph();
});

// Load about content from om.json
async function loadAboutContent() {
    try {
        const response = await fetch('database/om.json');
        if (!response.ok) {
            throw new Error('Failed to load om.json');
        }
        const data = await response.json();

        // Set hero text
        const heroTextEl = document.getElementById('hero-text');
        if (heroTextEl && data.heroText) {
            heroTextEl.textContent = data.heroText;
        }

        // Set section title
        const sectionTitleEl = document.getElementById('section-title');
        if (sectionTitleEl && data.sectionTitle) {
            sectionTitleEl.textContent = data.sectionTitle;
        }

        // Set description (HTML with <br> tags)
        const beskrivelseEl = document.getElementById('beskrivelse');
        if (beskrivelseEl && data.beskrivelse) {
            beskrivelseEl.innerHTML = data.beskrivelse;
        }

    } catch (error) {
        console.error('Error loading about content:', error);
    }
}

// Load history data from JSON and create roller
async function loadHistoryRoller() {
    try {
        const response = await fetch('database/history.json');
        const data = await response.json();

        // Transform year data to RollerComponent format
        const items = data.years.map(year => {
            // Build description with optional links
            let description = `<p>${year.description}</p>`;

            // Add links section if any links are available
            const links = [];
            if (year.afterMovieUrl) {
                links.push(`<a href="${year.afterMovieUrl}" target="_blank" class="history-link">Se aftermovie</a>`);
            }
            if (year.picturesUrl) {
                links.push(`<a href="${year.picturesUrl}" target="_blank" class="history-link">Se billeder</a>`);
            }

            if (links.length > 0) {
                description += `<div class="history-links">${links.join('')}</div>`;
            }

            return {
                id: `year-${year.year}`,
                title: year.year.toString(),
                image: year.image,
                description: description,
                color: year.color
            };
        });

        // Create roller using the component
        historyRollerInstance = RollerComponent.create({
            containerId: 'history-roller',
            title: 'HISTORIE',
            titleAlign: 'right',
            items: items,
            buttonTextExpand: 'LÆS MERE',
            buttonTextCollapse: 'LUK',
            scrollSpeed: 0.5,
            touchResumeDelay: 2000,
            infiniteScroll: true,
            parentElement: document.getElementById('history-roller-container')
        });

        // Set scrollbar thumb color
        RollerComponent.updateScrollbarColor(historyRollerInstance, '#90EE90');

    } catch (error) {
        console.error('Error loading history data:', error);
    }
}

// Initialize stats graph
async function initStatsGraph() {
    try {
        const response = await fetch('database/history.json');
        statsData = await response.json();

        // Setup toggle buttons
        setupToggleButtons();

        // Draw the graph
        drawStatsGraph();

        // Handle window resize
        window.addEventListener('resize', debounce(drawStatsGraph, 200));

    } catch (error) {
        console.error('Error loading stats data:', error);
    }
}

// Setup toggle button functionality
function setupToggleButtons() {
    const toggleButtons = document.querySelectorAll('.stats-toggle');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const series = this.dataset.series;

            if (series === 'attendees') {
                showAttendees = !showAttendees;
            } else if (series === 'budget') {
                showBudget = !showBudget;
            } else if (series === 'revenue') {
                showRevenue = !showRevenue;
            } else if (series === 'volunteers') {
                showVolunteers = !showVolunteers;
            }

            this.classList.toggle('active');
            drawStatsGraph();
        });
    });
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Draw the stats graph on canvas
function drawStatsGraph() {
    if (!statsData) return;

    const canvas = document.getElementById('stats-graph');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Padding for labels
    const padding = { top: 50, right: 60, bottom: 50, left: 40 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const years = statsData.years;
    const numPoints = years.length;

    // Calculate x positions for each year
    const xStep = graphWidth / (numPoints - 1);

    // Colors
    const attendeesColor = '#FFE693';    // Gul
    const budgetColor = '#87CEEB';       // Pastel blue
    const revenueColor = '#98D8AA';      // Pastel green
    const volunteersColor = '#DDA0DD';   // Lilla

    // Calculate shared scales
    // People scale - all people metrics relative to max attendees
    const maxPeople = Math.max(...years.map(y => y.attendees));

    // Money scale - revenue and budget on same scale
    const revenueValues = years.map(y => y.revenue);
    const budgetValues = years.map(y => y.budgetResult);
    const maxMoney = Math.max(...revenueValues);
    const minMoney = Math.min(...budgetValues, 0);

    // Helper function to calculate Y position for people (lifted up from x-axis)
    const bottomPadding = 80; // Extra space from x-axis
    const getPeopleY = (value) => {
        return padding.top + (graphHeight - bottomPadding) - (value / maxPeople * (graphHeight - bottomPadding) * 0.9);
    };

    // Helper function to calculate Y position for money (offset down slightly)
    const getMoneyY = (value) => {
        const range = maxMoney - minMoney;
        const normalized = (value - minMoney) / range;
        const offset = 40; // Offset money graphs down a bit
        return padding.top + offset + (graphHeight - bottomPadding) - (normalized * (graphHeight - bottomPadding) * 0.85);
    };

    // Draw year labels on x-axis
    ctx.fillStyle = '#111';
    ctx.font = '16px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';

    years.forEach((year, i) => {
        const x = padding.left + (i * xStep);
        ctx.fillText(year.year.toString(), x, height - padding.bottom + 30);
    });

    // Draw volunteers line
    if (showVolunteers) {
        ctx.strokeStyle = volunteersColor;
        ctx.lineWidth = 6;

        ctx.beginPath();
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getPeopleY(year.volunteers);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        ctx.fillStyle = volunteersColor;
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getPeopleY(year.volunteers);

            ctx.font = '13px Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(year.volunteers.toString(), x, y - 14);
        });
    }

    // Draw budget line (money scale)
    if (showBudget) {
        ctx.strokeStyle = budgetColor;
        ctx.lineWidth = 6;

        ctx.beginPath();
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getMoneyY(year.budgetResult);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        ctx.fillStyle = budgetColor;
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getMoneyY(year.budgetResult);

            ctx.font = '13px Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            const formattedValue = (year.budgetResult >= 0 ? '+' : '') + year.budgetResult.toLocaleString('da-DK') + ' kr';
            ctx.fillText(formattedValue, x, y - 14);
        });
    }

    // Draw revenue line (money scale)
    if (showRevenue) {
        ctx.strokeStyle = revenueColor;
        ctx.lineWidth = 6;

        ctx.beginPath();
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getMoneyY(year.revenue);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        ctx.fillStyle = revenueColor;
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getMoneyY(year.revenue);

            ctx.font = '13px Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            const formattedValue = year.revenue.toLocaleString('da-DK') + ' kr';
            ctx.fillText(formattedValue, x, y - 14);
        });
    }

    // Draw attendees line (people scale - highest)
    if (showAttendees) {
        ctx.strokeStyle = attendeesColor;
        ctx.lineWidth = 6;

        ctx.beginPath();
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getPeopleY(year.attendees);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        ctx.fillStyle = attendeesColor;
        years.forEach((year, i) => {
            const x = padding.left + (i * xStep);
            const y = getPeopleY(year.attendees);

            ctx.font = '13px Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(year.attendees.toLocaleString('da-DK'), x, y - 14);
        });
    }
}
