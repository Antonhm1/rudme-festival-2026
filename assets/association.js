// Association page functionality - history roller

// Store history roller instance
let historyRollerInstance = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadHistoryRoller();
});

// Load history data from JSON and create roller
async function loadHistoryRoller() {
    try {
        const response = await fetch('assets/history.json');
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
