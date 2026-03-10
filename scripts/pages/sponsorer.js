// Sponsors page – dynamically loads logos from pictures/Sponsorer/
(function () {
    const FOLDER = 'pictures/Sponsorer/';
    const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];

    async function loadSponsors() {
        const grid = document.getElementById('sponsors-grid');
        if (!grid) return;

        try {
            const resp = await fetch('database/sponsors.json');
            if (!resp.ok) throw new Error('Could not load sponsors.json');
            const sponsors = await resp.json();

            if (!sponsors.length) {
                grid.innerHTML = '<p class="sponsors-empty">Ingen sponsorer endnu.</p>';
                return;
            }

            sponsors.forEach(function (sponsor) {
                const card = document.createElement('div');
                card.className = 'sponsor-card';

                const img = document.createElement('img');
                img.src = FOLDER + sponsor.file;
                img.alt = sponsor.name;
                img.loading = 'lazy';

                card.appendChild(img);
                grid.appendChild(card);
            });
        } catch (e) {
            console.warn('Sponsors: ', e.message);
            grid.innerHTML = '<p class="sponsors-empty">Ingen sponsorer endnu.</p>';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSponsors);
    } else {
        loadSponsors();
    }
})();
