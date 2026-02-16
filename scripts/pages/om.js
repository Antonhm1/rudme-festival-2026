// Association page functionality - history roller and stats graph
(function() {
    let historyData = null;
    const seriesVisible = {
        attendees: true,
        budget: true,
        revenue: true,
        volunteers: true
    };

    document.addEventListener('DOMContentLoaded', function() {
        loadAboutContent();
        loadHistoryData();
    });

    async function loadAboutContent() {
        try {
            const response = await fetch('database/om.json');
            if (!response.ok) throw new Error('Failed to load om.json');
            const data = await response.json();

            const heroTextEl = document.getElementById('hero-text');
            if (heroTextEl && data.heroText) heroTextEl.textContent = data.heroText;

            const sectionTitleEl = document.getElementById('section-title');
            if (sectionTitleEl && data.sectionTitle) sectionTitleEl.textContent = data.sectionTitle;

            const beskrivelseEl = document.getElementById('beskrivelse');
            if (beskrivelseEl && data.beskrivelse) beskrivelseEl.innerHTML = data.beskrivelse;
        } catch (error) {
            console.error('Error loading about content:', error);
        }
    }

    // Single fetch for history.json, used by both roller and stats graph
    async function loadHistoryData() {
        try {
            const response = await fetch('database/history.json');
            historyData = await response.json();

            createHistoryRoller(historyData);
            initStatsGraph();
        } catch (error) {
            console.error('Error loading history data:', error);
        }
    }

    function createHistoryRoller(data) {
        const items = data.years.map(year => {
            let description = `<p>${year.description}</p>`;

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

        const instance = RollerComponent.create({
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

        RollerComponent.updateScrollbarColor(instance, '#90EE90');
    }

    function initStatsGraph() {
        setupToggleButtons();
        drawStatsGraph();

        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(drawStatsGraph, 200);
        });
    }

    function setupToggleButtons() {
        document.querySelectorAll('.stats-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const series = this.dataset.series;
                if (series in seriesVisible) {
                    seriesVisible[series] = !seriesVisible[series];
                }
                this.classList.toggle('active');
                drawStatsGraph();
            });
        });
    }

    // Series configuration for the stats graph
    const seriesConfig = [
        { key: 'volunteers', field: 'volunteers', color: '#DDA0DD', scale: 'people', format: v => v.toString() },
        { key: 'budget', field: 'budgetResult', color: '#87CEEB', scale: 'money', format: v => (v >= 0 ? '+' : '') + v.toLocaleString('da-DK') + ' kr' },
        { key: 'revenue', field: 'revenue', color: '#98D8AA', scale: 'money', format: v => v.toLocaleString('da-DK') + ' kr' },
        { key: 'attendees', field: 'attendees', color: '#FFE693', scale: 'people', format: v => v.toLocaleString('da-DK') }
    ];

    function drawStatsGraph() {
        if (!historyData) return;

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
        ctx.clearRect(0, 0, width, height);

        const padding = { top: 50, right: 60, bottom: 50, left: 40 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;
        const bottomPadding = 80;

        const years = historyData.years;
        const xStep = graphWidth / (years.length - 1);

        // Scale helpers
        const maxPeople = Math.max(...years.map(y => y.attendees));
        const maxMoney = Math.max(...years.map(y => y.revenue));
        const minMoney = Math.min(...years.map(y => y.budgetResult), 0);

        const getY = {
            people: (value) => padding.top + (graphHeight - bottomPadding) - (value / maxPeople * (graphHeight - bottomPadding) * 0.9),
            money: (value) => {
                const normalized = (value - minMoney) / (maxMoney - minMoney);
                return padding.top + 40 + (graphHeight - bottomPadding) - (normalized * (graphHeight - bottomPadding) * 0.85);
            }
        };

        // Draw year labels on x-axis
        ctx.fillStyle = '#111';
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        years.forEach((year, i) => {
            ctx.fillText(year.year.toString(), padding.left + i * xStep, height - padding.bottom + 30);
        });

        // Draw each visible series
        seriesConfig.forEach(series => {
            if (!seriesVisible[series.key]) return;

            const yFn = getY[series.scale];

            // Draw line
            ctx.strokeStyle = series.color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            years.forEach((year, i) => {
                const x = padding.left + i * xStep;
                const y = yFn(year[series.field]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Draw labels
            ctx.fillStyle = series.color;
            ctx.font = '13px Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            years.forEach((year, i) => {
                const x = padding.left + i * xStep;
                const y = yFn(year[series.field]);
                ctx.fillText(series.format(year[series.field]), x, y - 14);
            });
        });
    }
})();
