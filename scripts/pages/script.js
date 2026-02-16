// Front page – gallery, scrollbar, logo, custom select, auto-advance
(function () {
    // ── Color utilities ─────────────────────────────────────────────
    function parseRGB(s) {
        if (!s) return [0, 0, 0];
        s = s.trim();
        if (s.startsWith('rgb')) return s.match(/[\d.]+/g).slice(0, 3).map(Number);
        if (s.startsWith('#')) {
            const h = s.slice(1);
            if (h.length === 3) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        }
        return [0, 0, 0];
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function lerpColor(ca, cb, t) {
        return `rgb(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(lerp(ca[2], cb[2], t))})`;
    }

    function lightenColor(color, amount) {
        const c = parseRGB(color);
        return `rgb(${Math.round(lerp(c[0], 255, amount))}, ${Math.round(lerp(c[1], 255, amount))}, ${Math.round(lerp(c[2], 255, amount))})`;
    }

    function darkenColor(color, amount) {
        const c = parseRGB(color);
        return `rgb(${Math.round(lerp(c[0], 0, amount))}, ${Math.round(lerp(c[1], 0, amount))}, ${Math.round(lerp(c[2], 0, amount))})`;
    }

    function rootVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // ── Shuffle ─────────────────────────────────────────────────────
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function shuffleGallerySlides() {
        const g = document.getElementById('gallery');
        if (!g) return;
        const els = Array.from(g.querySelectorAll('.slide'));
        if (els.length <= 1) return;
        shuffleArray(els);
        els.forEach(s => g.appendChild(s));
        els.forEach((s, i) => {
            const bg = s.style.backgroundColor;
            if (bg) document.documentElement.style.setProperty(`--bg-color-${i + 1}`, bg);
        });
        g.scrollLeft = 0;
    }

    // ── Scrollbar DOM setup ─────────────────────────────────────────
    function ensureScrollbar() {
        if (!document.getElementById('gallery')) return;

        let sc = Array.from(document.querySelectorAll('.custom-scrollbar'));
        let bar = sc.find(c => c.querySelector('.thumb-label') || c.querySelector('.thumb-icon')) || sc[0];
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'custom-scrollbar';
            document.body.appendChild(bar);
        }

        let thumbEl = bar.querySelector('#scrollbar-thumb');
        if (!thumbEl) {
            thumbEl = document.createElement('div');
            thumbEl.id = 'scrollbar-thumb';
            thumbEl.className = 'custom-scrollbar-thumb';
            bar.appendChild(thumbEl);
        }

        const arrow = `<svg viewBox="0 0 17.2 33.2" aria-hidden="true"><path d="M2.5,31.1l13.2-14.5L2.5,2.1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        thumbEl.innerHTML = `
            <div class="thumb-icon thumb-icon-left">${arrow}</div>
            <div class="thumb-content">
                <div class="thumb-description"></div>
                <div class="thumb-location"></div>
                <div class="thumb-photographer"></div>
            </div>
            <div class="thumb-icon thumb-icon-right">${arrow}</div>
        `;
    }

    // ── Logo loading ────────────────────────────────────────────────
    async function initLogo(logoContainer, dateText, bgColorForIndex) {
        if (!logoContainer) return;
        const target = logoContainer.querySelector('#logo-inner') || logoContainer;
        let svg = target.querySelector('svg');

        if (!svg) {
            try {
                const resp = await fetch('pictures/icons/logo.svg', { cache: 'no-cache' });
                if (resp.ok) {
                    const txt = await resp.text();
                    const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
                    const fetched = doc.querySelector('svg');
                    if (fetched) {
                        target.innerHTML = '';
                        target.appendChild(document.importNode(fetched, true));
                    } else {
                        target.innerHTML = txt;
                    }
                    svg = target.querySelector('svg');
                }
            } catch (err) {
                console.warn('Failed to fetch logo.svg', err);
            }
        }
        if (!svg) return;

        svg.setAttribute('focusable', 'false');
        svg.setAttribute('aria-hidden', 'true');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.querySelectorAll('style').forEach(s => s.remove());
        svg.querySelectorAll('[fill]').forEach(el => el.removeAttribute('fill'));
        svg.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
        svg.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
        svg.style.fill = 'currentColor';
        svg.style.stroke = 'currentColor';

        // Only set initial color on the front page; subpages are handled by header-universal.js
        const filename = window.location.pathname.split('/').pop() || 'index.html';
        const isIndex = filename === '' || filename === 'index.html';
        if (!isIndex) return;

        const initial = bgColorForIndex(0) || '#FEAD47';
        logoContainer.style.color = initial;
        if (dateText) dateText.style.color = initial;
        document.documentElement.style.setProperty('--current-bg', initial);
    }

    // ── Mobile crop positions ───────────────────────────────────────
    function applyMobileCropPositions(gallery) {
        if (!gallery) return;
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 800px)').matches;
        gallery.querySelectorAll('.slide').forEach(slide => {
            const img = slide.querySelector('img');
            if (!img) return;
            const crop = slide.dataset.mobileCrop;
            img.style.objectPosition = (crop !== undefined && isMobile) ? `${crop}% center` : '';
        });
    }

    // ── Main init ───────────────────────────────────────────────────
    function attachBehaviors() {
        ensureScrollbar();

        const gallery = document.getElementById('gallery');
        const thumb = document.getElementById('scrollbar-thumb');
        const scrollbar = document.querySelector('.custom-scrollbar');
        const slides = gallery ? Array.from(gallery.querySelectorAll('.slide')) : [];
        const logoContainer = document.getElementById('logo-container');
        const dateText = document.getElementById('date-text');

        let isDraggingThumb = false;
        let slidePositions = [];
        let lastLogoColor = '';
        let rafId = null;

        function recomputeSlidePositions() {
            slidePositions = slides.map(s => s.offsetLeft);
        }

        function bgColorForIndex(i) {
            const val = rootVar(`--bg-color-${i + 1}`);
            if (val) return val;
            if (slides[i]) return getComputedStyle(slides[i]).backgroundColor || 'rgb(0,0,0)';
            return 'rgb(0,0,0)';
        }

        // ── Logo / thumb color updates ──────────────────────────────
        function setLogoColor(color) {
            if (!logoContainer || color === lastLogoColor) return;
            lastLogoColor = color;
            logoContainer.style.color = color;
            if (dateText) dateText.style.color = color;
            const isMobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
            document.querySelectorAll('.social-btn, .social-link').forEach(el => {
                el.style.color = isMobile ? color : '';
            });
        }

        function setThumbColor(color) {
            if (!thumb) return;
            const dark = darkenColor(color, 0.3);
            thumb.querySelectorAll('.thumb-description, .thumb-location, .thumb-photographer, .thumb-icon-left, .thumb-icon-right')
                .forEach(el => { el.style.color = dark; });
        }

        // ── Thumb available width ───────────────────────────────────
        function getThumbAvailableWidth() {
            const slideEl = slides[0] || (gallery ? gallery.querySelector('.slide') : null);
            if (!slideEl) return scrollbar ? scrollbar.clientWidth : window.innerWidth;
            const galleryLeft = gallery ? gallery.offsetLeft : 30;
            return 2 * galleryLeft + slideEl.offsetWidth;
        }

        // ── Social links z-index on mobile ──────────────────────────
        function manageSocialLinksZIndex() {
            if (!thumb || !scrollbar) return;
            const sc = document.querySelector('.social-container');
            if (!sc) return;
            const isMobile = window.matchMedia && window.matchMedia('(max-width: 800px)').matches;
            sc.style.zIndex = isMobile ? '1300' : '1500';
        }

        // ── Scrollbar position + thumb content ──────────────────────
        function updateScrollbar() {
            if (!gallery || !thumb || !scrollbar || isDraggingThumb) return;

            const maxScroll = gallery.scrollWidth - gallery.clientWidth;
            const pct = maxScroll === 0 ? 0 : gallery.scrollLeft / maxScroll;
            const thumbWidth = thumb.getBoundingClientRect().width;
            const available = Math.max(0, getThumbAvailableWidth() - thumbWidth);
            thumb.style.left = (pct * available) + 'px';

            manageSocialLinksZIndex();

            // Update thumb text to reflect centered slide
            const viewportCenter = (gallery.scrollLeft || 0) + gallery.clientWidth / 2;
            let best = 0, bestDist = Infinity;
            slides.forEach((s, i) => {
                const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - viewportCenter);
                if (d < bestDist) { bestDist = d; best = i; }
            });
            const current = slides[best];
            const img = current ? current.querySelector('img') : null;
            const descEl = thumb.querySelector('.thumb-description');
            const locEl = thumb.querySelector('.thumb-location');
            const photoEl = thumb.querySelector('.thumb-photographer');
            if (descEl) descEl.textContent = (img && img.alt) ? img.alt : '';
            if (locEl) locEl.textContent = current ? (current.dataset.location || '') : '';
            if (photoEl) photoEl.textContent = current && current.dataset.photographer ? `foto: ${current.dataset.photographer}` : '';
        }

        // ── Background color interpolation ──────────────────────────
        function updateBackgroundOnScroll() {
            if (!gallery) return;
            if (slides.length === 0 || slidePositions.length < 2) {
                const col = bgColorForIndex(0);
                document.body.style.background = col;
                setLogoColor(col);
                setThumbColor(col);
                document.documentElement.style.setProperty('--current-bg', col);
                return;
            }

            const viewportCenter = gallery.scrollLeft + gallery.clientWidth / 2;
            const centers = slides.map(s => s.offsetLeft + s.offsetWidth / 2);

            let j = 0;
            for (let i = 0; i < centers.length - 1; i++) {
                if (viewportCenter >= centers[i] && viewportCenter <= centers[i + 1]) { j = i; break; }
                if (viewportCenter > centers[centers.length - 2]) j = centers.length - 2;
            }

            const span = Math.max(1, centers[j + 1] - centers[j]);
            const t = Math.max(0, Math.min(1, (viewportCenter - centers[j]) / span));
            const ca = parseRGB(bgColorForIndex(j));
            const cb = parseRGB(bgColorForIndex(j + 1));
            const blended = lerpColor(ca, cb, t);

            document.body.style.background = blended;
            setLogoColor(blended);
            setThumbColor(blended);
            document.documentElement.style.setProperty('--current-bg', blended);

            const light = lightenColor(blended, 0.5);
            if (thumb) thumb.style.background = light;
            document.documentElement.style.setProperty('--select-hover-bg', light);
        }

        function onGalleryScroll() {
            updateScrollbar();
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    updateBackgroundOnScroll();
                    rafId = null;
                });
            }
        }

        // ── Auto-advance carousel ───────────────────────────────────
        function initAutoAdvance() {
            const INTERVAL = 4000;
            const FIRST_DELAY = 1500;
            const PAUSE_DURATION = 10000;
            let timer = null;
            let pauseTimer = null;
            let isFirst = true;
            let currentIdx = 0;
            let isAutoScrolling = false;

            function currentSlideIndex() {
                if (!gallery || slides.length === 0) return 0;
                const vc = (gallery.scrollLeft || 0) + gallery.clientWidth / 2;
                let best = 0, bestDist = Infinity;
                slides.forEach((s, i) => {
                    const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - vc);
                    if (d < bestDist) { bestDist = d; best = i; }
                });
                return best;
            }

            function goToSlide(i) {
                if (!gallery || slides.length === 0) return;
                const idx = ((i % slides.length) + slides.length) % slides.length;
                currentIdx = idx;
                if (slidePositions.length !== slides.length) recomputeSlidePositions();
                const left = slidePositions[idx] || 0;
                try { gallery.scrollTo({ left, behavior: 'smooth' }); } catch (_) { gallery.scrollLeft = left; }
                setTimeout(() => { isAutoScrolling = false; }, 1000);
            }

            function advance() {
                if (isDraggingThumb) return;
                currentIdx = currentSlideIndex();
                const next = currentIdx === slides.length - 1 ? 0 : currentIdx + 1;
                isAutoScrolling = true;
                goToSlide(next);
            }

            function start() {
                stop();
                if (!gallery || slides.length <= 1) return;
                currentIdx = currentSlideIndex();
                if (isFirst) {
                    timer = setTimeout(() => {
                        advance();
                        isFirst = false;
                        timer = setInterval(advance, INTERVAL);
                    }, FIRST_DELAY);
                } else {
                    timer = setInterval(advance, INTERVAL);
                }
            }

            function stop() {
                if (timer) { clearTimeout(timer); clearInterval(timer); timer = null; }
            }

            function pauseAndResume() {
                stop();
                if (pauseTimer) clearTimeout(pauseTimer);
                pauseTimer = setTimeout(() => { pauseTimer = null; start(); }, PAUSE_DURATION);
            }

            // User scroll pauses auto-advance
            function onUserScroll() {
                if (!isAutoScrolling) pauseAndResume();
            }

            document.addEventListener('scroll', onUserScroll, { passive: true });
            window.addEventListener('scroll', onUserScroll, { passive: true });
            if (gallery) gallery.addEventListener('scroll', onUserScroll, { passive: true });

            // Interaction handlers
            if (gallery) {
                gallery.addEventListener('pointerdown', () => pauseAndResume());
                gallery.addEventListener('touchstart', () => pauseAndResume(), { passive: true });
                gallery.addEventListener('mouseenter', () => stop());
                gallery.addEventListener('mouseleave', () => { if (!pauseTimer) start(); });
            }

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    stop();
                    if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
                } else {
                    start();
                }
            });
            window.addEventListener('focus', () => { if (!pauseTimer) start(); });
            window.addEventListener('blur', () => stop());

            return { start, stop, pauseAndResume, goToSlide, currentSlideIndex };
        }

        // ── Thumb drag ──────────────────────────────────────────────
        function initThumbDrag(auto) {
            if (!thumb) return;

            let isDragging = false;
            let dragOffset = 0;
            let activePointerId = null;

            function pointerX(e) {
                if (e.touches && e.touches.length) return e.touches[0].clientX;
                if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
                return e.clientX;
            }

            function startDrag(e, isTouch) {
                if (!isTouch && e.pointerType === 'mouse' && e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                dragOffset = pointerX(e) - thumb.getBoundingClientRect().left;
                isDragging = true;
                isDraggingThumb = true;
                activePointerId = e.pointerId || null;
                if (gallery) gallery.classList.add('dragging-scrollbar');
                if (!isTouch && e.pointerId && thumb.setPointerCapture) {
                    try { thumb.setPointerCapture(e.pointerId); } catch (_) {}
                }
                thumb.classList.add('dragging');
            }

            function move(px) {
                if (!isDragging || !thumb || !scrollbar || !gallery) return;
                const rect = scrollbar.getBoundingClientRect();
                const tw = thumb.getBoundingClientRect().width;
                const avail = Math.max(0, getThumbAvailableWidth() - tw);
                let left = Math.max(0, Math.min(avail, px - rect.left - dragOffset));
                const pct = avail === 0 ? 0 : left / avail;
                auto.pauseAndResume();
                thumb.style.left = left + 'px';
                gallery.scrollLeft = pct * (gallery.scrollWidth - gallery.clientWidth);
            }

            function endDrag(e) {
                if (!isDragging) return;
                isDragging = false;
                activePointerId = null;
                thumb.classList.remove('dragging');
                if (e && e.pointerId && thumb.releasePointerCapture) {
                    try { thumb.releasePointerCapture(e.pointerId); } catch (_) {}
                }
                if (!gallery || slides.length === 0) { isDraggingThumb = false; return; }

                // Snap to closest slide
                const vc = gallery.scrollLeft + gallery.clientWidth / 2;
                let closestIdx = 0, closestDist = Infinity;
                slides.forEach((s, i) => {
                    const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - vc);
                    if (d < closestDist) { closestDist = d; closestIdx = i; }
                });

                const targetLeft = slidePositions[closestIdx] || 0;
                gallery.classList.remove('dragging-scrollbar');
                isDraggingThumb = false;
                updateScrollbar();
                updateBackgroundOnScroll();
                try { gallery.scrollTo({ left: targetLeft, behavior: 'smooth' }); } catch (_) { gallery.scrollLeft = targetLeft; }
            }

            thumb.addEventListener('pointerdown', e => startDrag(e, false));
            thumb.addEventListener('touchstart', e => startDrag(e, true), { passive: false });
            document.addEventListener('pointermove', e => {
                if (!isDragging) return;
                if (activePointerId !== null && e.pointerId !== activePointerId) return;
                move(pointerX(e));
            });
            document.addEventListener('touchmove', e => {
                if (!isDragging) return;
                e.preventDefault();
                move(pointerX(e));
            }, { passive: false });
            document.addEventListener('pointerup', endDrag);
            document.addEventListener('pointercancel', endDrag);
            document.addEventListener('touchend', endDrag);
            document.addEventListener('touchcancel', endDrag);
        }

        // ── Arrow navigation ────────────────────────────────────────
        function initArrowNav(auto) {
            if (!thumb) return;
            const left = thumb.querySelector('.thumb-icon-left');
            const right = thumb.querySelector('.thumb-icon-right');

            function preventDrag(e) { e.stopPropagation(); e.preventDefault(); }

            [left, right].forEach(arrow => {
                if (!arrow) return;
                arrow.addEventListener('pointerdown', preventDrag);
                arrow.addEventListener('mousedown', preventDrag);
                arrow.addEventListener('touchstart', preventDrag);
            });

            if (left) left.addEventListener('click', e => {
                e.stopPropagation();
                auto.pauseAndResume();
                const cur = auto.currentSlideIndex();
                auto.goToSlide(cur === 0 ? slides.length - 1 : cur - 1);
            });

            if (right) right.addEventListener('click', e => {
                e.stopPropagation();
                auto.pauseAndResume();
                const cur = auto.currentSlideIndex();
                auto.goToSlide(cur === slides.length - 1 ? 0 : cur + 1);
            });
        }

        // ── Scrollbar click ─────────────────────────────────────────
        function initScrollbarClick(auto) {
            if (!scrollbar) return;
            scrollbar.addEventListener('click', e => {
                if (!gallery || !thumb || e.target !== scrollbar) return;
                const rect = scrollbar.getBoundingClientRect();
                const tw = thumb.getBoundingClientRect().width;
                const availW = getThumbAvailableWidth();
                const left = Math.max(0, Math.min(availW - tw, e.clientX - rect.left - tw / 2));
                const avail = Math.max(0, availW - tw);
                const pct = avail === 0 ? 0 : left / avail;
                auto.pauseAndResume();
                gallery.scrollLeft = pct * (gallery.scrollWidth - gallery.clientWidth);
            });
        }

        // ── Custom select dropdown ──────────────────────────────────
        function initCustomSelect() {
            const wrapper = document.getElementById('custom-select');
            if (!wrapper) return;
            const display = document.getElementById('select-display');
            const options = document.getElementById('select-options');
            const fallback = document.getElementById('page-menu');

            // Set display to reflect current page
            const filename = window.location.pathname.split('/').pop() || 'index.html';
            const filenameMap = {
                'index.html': 'home', 'about.html': 'about', 'info.html': 'about',
                'program.html': 'program', 'billet.html': 'tickets', 'frivillig.html': 'volunteer',
                'rudmelejr.html': 'camp', 'om.html': 'association', 'kontakt.html': 'contact',
                'skurvognen.html': 'skurvognen'
            };
            const currentValue = filenameMap[filename] || (filename.replace('.html', '') || 'home');
            const initialLi = options.querySelector(`li[data-value="${currentValue}"]`) || options.querySelector('li.selected') || options.querySelector('li');

            if (initialLi) {
                options.querySelectorAll('li').forEach(i => i.classList.remove('selected'));
                initialLi.classList.add('selected');
                setDisplayText(display, initialLi.textContent);
                if (fallback) fallback.value = currentValue;
            }

            // Background box (subpages only)
            const bg = wrapper.querySelector('.select-bg');
            const isSubpage = document.body.classList.contains('is-subpage');
            let close, open;

            if (bg && isSubpage) {
                function setBgCollapsed() {
                    if (!bg || !display) return;
                    const r = display.getBoundingClientRect();
                    bg.style.width = Math.ceil(r.width) + 'px';
                    bg.style.height = Math.ceil(r.height) + 'px';
                }

                function setBgExpanded() {
                    if (!bg || !display || !options) return;
                    const dr = display.getBoundingClientRect();
                    const or = options.getBoundingClientRect();
                    bg.style.width = Math.ceil(Math.max(dr.width, or.width)) + 'px';
                    bg.style.height = Math.ceil(dr.height + or.height) + 'px';
                }

                setBgCollapsed();
                close = () => { setBgCollapsed(); wrapper.classList.remove('open'); wrapper.setAttribute('aria-expanded', 'false'); };
                open = () => { wrapper.classList.add('open'); wrapper.setAttribute('aria-expanded', 'true'); requestAnimationFrame(setBgExpanded); };
                window.addEventListener('resize', setBgCollapsed);
            } else {
                close = () => { wrapper.classList.remove('open'); wrapper.setAttribute('aria-expanded', 'false'); };
                open = () => { wrapper.classList.add('open'); wrapper.setAttribute('aria-expanded', 'true'); };
            }

            wrapper.addEventListener('click', () => { wrapper.classList.contains('open') ? close() : open(); });

            options.addEventListener('click', e => {
                const li = e.target.closest('li');
                if (!li) return;
                options.querySelectorAll('li').forEach(i => i.classList.remove('selected'));
                li.classList.add('selected');
                setDisplayText(display, li.textContent);
                if (fallback) fallback.value = li.dataset.value;
                close();
                window.navigatePage(li.dataset.value);
            });

            document.addEventListener('click', e => { if (!wrapper.contains(e.target)) close(); });
            wrapper.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wrapper.classList.contains('open') ? close() : open(); }
            });
        }

        // Helper: update display text while preserving the caret span
        function setDisplayText(display, text) {
            const caret = display.querySelector('.select-caret');
            display.textContent = '';
            display.appendChild(document.createTextNode(text));
            if (caret) display.appendChild(caret);
        }

        // ── Navigation ──────────────────────────────────────────────
        function initNavigation() {
            const map = {
                'home': 'index.html', 'about': 'info.html', 'program': 'program.html',
                'tickets': 'billet.html', 'volunteer': 'frivillig.html', 'camp': 'rudmelejr.html',
                'association': 'om.html', 'contact': 'kontakt.html', 'skurvognen': 'skurvognen.html',
                'music': 'program.html', 'musik': 'program.html', 'gallery': 'program.html'
            };

            window.navigatePage = function (page) {
                if (!page || page === 'home') { window.location.href = 'index.html'; return; }
                const target = map[page];
                if (target) { window.location.href = target; return; }
                alert('Navigation to ' + page.charAt(0).toUpperCase() + page.slice(1) + ' page');
                const pm = document.getElementById('page-menu');
                if (pm) pm.value = 'home';
            };
        }

        // ── Wait for images then finalize layout ────────────────────
        function waitForImages() {
            const promises = slides.map(s => {
                const img = s.querySelector('img');
                if (!img || img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                });
            });

            return Promise.all(promises);
        }

        // ── Wire everything up ──────────────────────────────────────
        if (gallery) gallery.addEventListener('scroll', onGalleryScroll);
        window.addEventListener('resize', () => {
            recomputeSlidePositions();
            updateScrollbar();
            updateBackgroundOnScroll();
            applyMobileCropPositions(gallery);
        });

        applyMobileCropPositions(gallery);
        initNavigation();
        initCustomSelect();

        const auto = initAutoAdvance();
        initThumbDrag(auto);
        initArrowNav(auto);
        initScrollbarClick(auto);

        // Kick off autoplay early (positions refresh once images finish)
        auto.start();

        waitForImages().then(() => {
            recomputeSlidePositions();
            updateScrollbar();
            updateBackgroundOnScroll();
            auto.start();
        });

        initLogo(logoContainer, dateText, bgColorForIndex);
    }

    // ── Bootstrap ───────────────────────────────────────────────────
    shuffleGallerySlides();
    if (document.getElementById('custom-select')) {
        attachBehaviors();
    } else {
        document.addEventListener('header-inserted', attachBehaviors);
    }
})();
