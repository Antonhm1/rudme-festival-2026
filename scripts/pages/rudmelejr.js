// Rudme Lejr page - Gallery lightbox, data loading, and scroll animations
(function() {
    const IMAGE_PATH = 'pictures/Rudme-Lejr/';

    function getImagePath(name) {
        if (!name) return '';
        return name.includes('/') ? name : IMAGE_PATH + name;
    }

    document.addEventListener('DOMContentLoaded', async function() {
        await loadRudmeLejrData();
        initLightbox();
        initScrollAnimations();
        initAnchorSmoothing();
        initImageFadeIn();
    });

    async function loadRudmeLejrData() {
        await loadSections();
        await loadGrid('database/rudme-lejr-opgaver.json', 'rudme-lejr-opgaver-grid', 'opgaver', 'activity');
        await loadGrid('database/rudme-lejr-features.json', 'rudme-lejr-features-grid', 'features', 'feature');
    }

    async function loadSections() {
        try {
            const response = await fetch('database/rudme-lejr-info.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('Network response not ok ' + response.status);
            const data = await response.json();

            const sektioner = Array.isArray(data.sektioner) ? data.sektioner : [];

            sektioner.forEach(sektion => {
                const num = sektion.sektion;
                const overskrift = sektion.overskrift || '';
                const beskrivelse = sektion.beskrivelse || '';

                if (num === 1) {
                    const heading = document.getElementById('rudme-lejr-info-heading');
                    const text = document.getElementById('rudme-lejr-info-text');
                    if (heading && overskrift.trim()) heading.textContent = overskrift.trim();
                    if (text) text.innerHTML = beskrivelse;
                } else {
                    const heading = document.getElementById(`section-${num}-heading`);
                    const beskrivelseEl = document.getElementById(`section-${num}-beskrivelse`);

                    if (heading && overskrift.trim()) heading.textContent = overskrift.trim();
                    if (beskrivelseEl) {
                        if (beskrivelse.trim().startsWith('<')) {
                            beskrivelseEl.innerHTML = beskrivelse;
                        } else {
                            beskrivelseEl.textContent = beskrivelse;
                        }
                    }

                    if (num === 5 && sektion['tilmeldings link']) {
                        const button = document.getElementById('tilmeldings-button');
                        if (button) button.href = sektion['tilmeldings link'];
                    }
                }
            });
        } catch (err) {
            console.error('Could not load Rudme Lejr info:', err);
        }
    }

    async function loadGrid(url, gridId, dataKey, cssPrefix) {
        try {
            const grid = document.getElementById(gridId);
            if (!grid) return;

            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error('Network response not ok ' + response.status);
            const data = await response.json();

            const items = Array.isArray(data[dataKey]) ? data[dataKey] : [];
            grid.innerHTML = '';

            items.forEach(item => {
                const box = document.createElement('div');
                box.className = `${cssPrefix}-box`;

                const title = document.createElement('h3');
                title.textContent = item.titel || '';

                const img = document.createElement('img');
                img.className = `${cssPrefix}-image`;
                img.src = getImagePath(item.image || '');
                img.alt = item.titel || cssPrefix;

                const desc = document.createElement('p');
                desc.innerHTML = item.beskrivelse || '';

                box.appendChild(title);
                box.appendChild(img);
                box.appendChild(desc);
                grid.appendChild(box);
            });
        } catch (err) {
            console.error(`Could not load ${dataKey}:`, err);
        }
    }

    function initLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        if (!lightbox) return;

        function closeLightbox() {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }

        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('img');
                lightbox.style.display = 'block';
                lightboxImg.src = img.src;
                lightboxCaption.textContent = img.alt;
                document.body.style.overflow = 'hidden';
            });
        });

        const closeBtn = lightbox.querySelector('.lightbox-close');
        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightbox.style.display === 'block') closeLightbox();
        });
    }

    function initScrollAnimations() {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };

        // Fade-in sections
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.intro-section, .gallery-section, .activities-section, .features-section, .social-section, .cta-section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            sectionObserver.observe(section);
        });

        // Activity and feature boxes with random colors and staggered animation
        const colors = [
            '#FFEB3B', '#FFA726', '#66BB6A', '#42A5F5', '#EF5350', '#AB47BC',
            '#26C6DA', '#EC407A', '#9CCC65', '#FF7043', '#78909C', '#FFCC80'
        ];
        const shuffled = colors.sort(() => Math.random() - 0.5);

        const allBoxes = document.querySelectorAll('.activity-box, .feature-box');
        allBoxes.forEach((box, i) => {
            box.style.backgroundColor = shuffled[i % shuffled.length];
            box.style.opacity = '0';
            box.style.transform = 'translateY(30px)';
            box.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
        });

        const boxObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 100);
                }
            });
        }, observerOptions);

        allBoxes.forEach(box => boxObserver.observe(box));

        // Gallery items staggered load
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item, i) => {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.9)';
            item.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
        });

        const galleryObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'scale(1)';
                    }, 50);
                }
            });
        }, { root: null, rootMargin: '0px', threshold: 0.01 });

        galleryItems.forEach(item => galleryObserver.observe(item));
    }

    function initAnchorSmoothing() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    function initImageFadeIn() {
        document.querySelectorAll('.gallery-item img, .hero-image').forEach(img => {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease';

            if (img.complete) {
                img.style.opacity = '1';
            } else {
                img.addEventListener('load', function() { this.style.opacity = '1'; });
                img.addEventListener('error', function() { this.style.opacity = '1'; });
            }
        });
    }
})();
