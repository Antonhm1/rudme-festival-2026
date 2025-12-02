/* assets/program.js — program page specific JS: per-box custom scrollbars */

function attachBoxScrollbars() {
    const boxes = Array.from(document.querySelectorAll('.artist-box'));
    if (!boxes.length) return;

    boxes.forEach(box => {
        const scrollEl = box.querySelector('.box-scroll');
        const scrollbar = box.querySelector('.box-scrollbar');
        const thumb = box.querySelector('.custom-scrollbar-thumb');
        if (!scrollEl || !scrollbar || !thumb) return;

        // Color the thumb according to the box color variable (lighter)
        try {
            const c = getComputedStyle(box).getPropertyValue('--box-color').trim() || '#ffffff';
            function parseHex(h) {
                const hex = h.replace('#','');
                const r = parseInt(hex.slice(0,2),16);
                const g = parseInt(hex.slice(2,4),16);
                const b = parseInt(hex.slice(4,6),16);
                return [r,g,b];
            }
            if (c.startsWith('#') && c.length >= 7) {
                const rgb = parseHex(c);
                const lr = Math.round((rgb[0] + 255) / 2);
                const lg = Math.round((rgb[1] + 255) / 2);
                const lb = Math.round((rgb[2] + 255) / 2);
                thumb.style.background = `rgb(${lr}, ${lg}, ${lb})`;
            }
        } catch (err) {}

        function update() {
            const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
            const scrollPercentage = maxScroll === 0 ? 0 : scrollEl.scrollLeft / maxScroll;
            const thumbWidth = (scrollEl.clientWidth / scrollEl.scrollWidth) * scrollbar.clientWidth || scrollbar.clientWidth;
            const available = Math.max(0, scrollbar.clientWidth - thumbWidth);
            const thumbPosition = scrollPercentage * available;
            thumb.style.width = Math.max(24, thumbWidth) + 'px';
            thumb.style.left = thumbPosition + 'px';
        }

        // Sync on scroll and resize
        scrollEl.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        // initial
        setTimeout(update, 50);

        // dragging
        let isDragging = false;
        let dragOffset = 0;

        thumb.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            const rect = thumb.getBoundingClientRect();
            dragOffset = e.clientX - rect.left;
            isDragging = true;
            scrollEl.classList.add('dragging-scrollbar');
            try { thumb.setPointerCapture && thumb.setPointerCapture(e.pointerId); } catch (err) {}
        });

        function onMove(e) {
            if (!isDragging) return;
            const rect = scrollbar.getBoundingClientRect();
            const thumbW = thumb.getBoundingClientRect().width;
            const available = Math.max(0, rect.width - thumbW);
            let left = e.clientX - rect.left - dragOffset;
            left = Math.max(0, Math.min(available, left));
            const scrollPerc = available === 0 ? 0 : left / available;
            scrollEl.scrollLeft = scrollPerc * (scrollEl.scrollWidth - scrollEl.clientWidth);
        }

        function onUp(e) {
            if (!isDragging) return;
            isDragging = false;
            scrollEl.classList.remove('dragging-scrollbar');
            try { thumb.releasePointerCapture && thumb.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);

        // clicking on the track
        scrollbar.addEventListener('click', (e) => {
            if (e.target === thumb) return;
            const rect = scrollbar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const thumbW = thumb.getBoundingClientRect().width;
            const thumbLeft = Math.max(0, Math.min(rect.width - thumbW, clickX - thumbW / 2));
            const available = Math.max(0, rect.width - thumbW);
            const scrollPerc = available === 0 ? 0 : thumbLeft / available;
            scrollEl.scrollLeft = scrollPerc * (scrollEl.scrollWidth - scrollEl.clientWidth);
        });

        // Pointer handlers: set background and manage media embeds on enter/leave.
        // We intentionally do NOT change the horizontal scroll position on hover.
        box.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'touch') return; // ignore touch
            if (scrollEl.classList.contains('dragging-scrollbar')) return; // don't interfere with user drag
            // set the page background to match this artist box color and keep it
            try {
                const bg = getComputedStyle(box).getPropertyValue('--box-color').trim();
                if (bg) {
                    document.documentElement.style.setProperty('--current-bg', bg);
                    try { document.body.style.background = bg; } catch (e) {}
                }
            } catch (err) {}
            // Restore Spotify embeds (if we previously unloaded them on leave)
            try {
                const spIframes = box.querySelectorAll('.spotify-embed iframe');
                spIframes.forEach(ifr => {
                    try {
                        const orig = ifr.dataset.origSrc;
                        if (orig && (!ifr.src || ifr.src === 'about:blank')) {
                            ifr.src = orig;
                        }
                    } catch (err) {}
                });
            } catch (err) {}
        });

        box.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'touch') return;
            if (scrollEl.classList.contains('dragging-scrollbar')) return;
            // Stop YouTube iframes (via postMessage) and unload Spotify embeds to stop playback
            try {
                const ytIframes = box.querySelectorAll('iframe.youtube-embed');
                ytIframes.forEach(yt => {
                    try {
                        yt.contentWindow && yt.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'stopVideo', args: [] }), '*');
                    } catch (err) {}
                });
            } catch (err) {}
            try {
                const spIframes = box.querySelectorAll('.spotify-embed iframe');
                spIframes.forEach(ifr => {
                    try {
                        if (ifr.dataset.origSrc) {
                            ifr.src = 'about:blank';
                        }
                    } catch (err) {}
                });
            } catch (err) {}

            // If the inner horizontal container was manually scrolled, return it to
            // the first item when the pointer leaves the box. Use a small threshold
            // to avoid fighting subtle fractional scroll positions.
            try {
                if ((scrollEl.scrollLeft || 0) > 8) {
                    try {
                        scrollEl.scrollTo({ left: 0, behavior: 'smooth' });
                    } catch (err) {
                        // fallback for older browsers
                        scrollEl.scrollLeft = 0;
                    }
                }
            } catch (err) {}
        });
        
        // also allow keyboard users to set the background by focusing the box
        box.addEventListener('focus', (e) => {
            try {
                const bg = getComputedStyle(box).getPropertyValue('--box-color').trim();
                if (bg) {
                    document.documentElement.style.setProperty('--current-bg', bg);
                    try { document.body.style.background = bg; } catch (e) {}
                }
            } catch (err) {}
        });
    });
}

// Load artists.json and render the artist boxes, then attach scrollbars.
function mapCropToPosition(crop) {
    switch ((crop||'').toLowerCase()) {
        case 'top': return 'center top';
        case 'bottom': return 'center bottom';
        case 'mid':
        case 'middle':
        default: return 'center';
    }
}

function loadArtists() {
    fetch('assets/artists.json')
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch')))
        .then(data => {
            const artists = Array.isArray(data.artists) ? data.artists : [];
            const grid = document.getElementById('artist-grid') || document.querySelector('.artist-grid');
            if (!grid) return;
            grid.innerHTML = '';

            // helper: extract YouTube video id from common URL forms
            function getYouTubeId(url) {
                if (!url) return null;
                try {
                    const u = new URL(url, window.location.href);
                    const host = (u.hostname || '').toLowerCase();
                    if (host.includes('youtu.be')) {
                        return u.pathname.slice(1).split(/[^0-9A-Za-z_-]/)[0] || null;
                    }
                    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
                        if (u.pathname.startsWith('/watch')) return u.searchParams.get('v');
                        const parts = u.pathname.split('/');
                        const embedIndex = parts.indexOf('embed');
                        if (embedIndex !== -1 && parts[embedIndex+1]) return parts[embedIndex+1];
                        // sometimes the id is the last path segment
                        const last = parts.pop();
                        if (last && /^[A-Za-z0-9_-]{6,}$/.test(last)) return last;
                    }
                } catch (err) {
                    // fall through to regex fallback
                }
                // fallback regex (covers many common variants)
                const m = url && url.toString().match(/(?:v=|v\/|embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
                return m ? m[1] : null;
            }

            artists.forEach(a => {
                const box = document.createElement('div');
                box.className = 'artist-box';
                // make boxes keyboard-focusable so keyboard users can also set the bg
                box.tabIndex = 0;
                if (a.color) box.style.setProperty('--box-color', a.color);

                const title = document.createElement('div');
                title.className = 'box-title';
                title.textContent = a.name || '';
                box.appendChild(title);

                const scroll = document.createElement('div');
                scroll.className = 'box-scroll';

                // image tile
                const imgItem = document.createElement('div');
                imgItem.className = 'box-item';
                const img = document.createElement('img');
                img.className = 'artist-photo';
                img.src = a.image || '';
                img.alt = a.name || '';
                img.loading = 'lazy';
                img.style.objectPosition = mapCropToPosition(a.crop);
                imgItem.appendChild(img);
                scroll.appendChild(imgItem);

                // youtube/link tiles — embed YouTube players when possible
                if (Array.isArray(a.youtube)) {
                    a.youtube.forEach(link => {
                        const item = document.createElement('div');
                        item.className = 'box-item';
                        const id = getYouTubeId(link);
                        if (id) {
                            const iframe = document.createElement('iframe');
                            iframe.className = 'youtube-embed';
                            // enable JS API so we can stop the player via postMessage when user leaves
                            iframe.src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&enablejsapi=1`;
                            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
                            iframe.setAttribute('allowfullscreen', '');
                            iframe.loading = 'lazy';
                            item.appendChild(iframe);
                        } else {
                            const anchor = document.createElement('a');
                            anchor.href = link;
                            anchor.target = '_blank';
                            anchor.rel = 'noopener';
                            anchor.textContent = 'Link ›';
                            item.appendChild(anchor);
                        }
                        scroll.appendChild(item);
                    });
                }

                // spotify embed: if provided as an iframe string in the JSON, insert it
                // as its own scroll item after the YouTube items so users can scroll to it.
                if (a.spotify && String(a.spotify).trim()) {
                    try {
                        const spItem = document.createElement('div');
                        spItem.className = 'box-item';
                        const wrapper = document.createElement('div');
                        wrapper.className = 'spotify-embed';
                        // insert raw iframe HTML from JSON; JSON is maintained by site authors
                        wrapper.innerHTML = a.spotify;
                        // make sure any iframe inside gets lazy loading and responsive class
                        const iframe = wrapper.querySelector('iframe');
                        if (iframe) {
                            iframe.loading = 'lazy';
                            iframe.style.width = '100%';
                            // remove any fixed height attribute coming from the JSON embed
                            // so CSS/JS can control sizing; then force it to fill vertically
                            try { iframe.removeAttribute && iframe.removeAttribute('height'); } catch (e) {}
                            iframe.style.width = '100%';
                            iframe.style.height = '100%';
                            iframe.style.display = 'block';
                            iframe.style.minHeight = '0';
                            iframe.style.border = '0';
                            // remember original src so we can unload/reload to stop playback
                            try { iframe.dataset.origSrc = iframe.src || ''; } catch (e) {}
                        }
                        spItem.appendChild(wrapper);
                        scroll.appendChild(spItem);
                    } catch (err) {
                        // fallback: add a simple link if the embed string is invalid
                        const spItem = document.createElement('div');
                        spItem.className = 'box-item';
                        const anchor = document.createElement('a');
                        anchor.href = String(a.spotify).match(/src="([^"]+)"/) ? String(a.spotify).match(/src="([^"]+)"/)[1] : '#';
                        anchor.target = '_blank';
                        anchor.rel = 'noopener';
                        anchor.textContent = 'Spotify ›';
                        spItem.appendChild(anchor);
                        scroll.appendChild(spItem);
                    }
                }

                box.appendChild(scroll);

                const scrollbar = document.createElement('div');
                scrollbar.className = 'box-scrollbar custom-scrollbar';
                const thumb = document.createElement('div');
                thumb.className = 'custom-scrollbar-thumb';
                scrollbar.appendChild(thumb);
                box.appendChild(scrollbar);

                grid.appendChild(box);
            });

            // wait a tick for layout, then wire the scrollbar logic
            setTimeout(attachBoxScrollbars, 50);
        })
        .catch(err => {
            // leave the grid empty on error, but log for debugging
            console.error('Error loading artists.json', err);
        });
}

// Initialize: load when header is inserted or DOM is ready
document.addEventListener('header-inserted', loadArtists);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadArtists, 50));
} else {
    // run shortly after load so layout is stable
    setTimeout(loadArtists, 50);
}

/* Page-level custom vertical scrollbar removed — rely on native vertical scrollbar. */

/*
  Small helper: show a thumb-only native vertical scrollbar while the user is
  scrolling or when the pointer is near the right edge of the window.
  Adds/removes `html.show-vertical-scrollbar` to control visibility (CSS above).
*/
(function pageVScrollbarController() {
    let hideTimer = null;
    const HIDE_DELAY = 900; // ms after last activity to hide

    function show() {
        document.documentElement.classList.add('show-vertical-scrollbar');
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        hideTimer = setTimeout(() => {
            document.documentElement.classList.remove('show-vertical-scrollbar');
            hideTimer = null;
        }, HIDE_DELAY);
    }

    // Show on scroll or touchstart
    window.addEventListener('scroll', show, { passive: true });
    window.addEventListener('touchstart', show, { passive: true });

    // Show when pointer moves near the right edge (within 60px)
    window.addEventListener('mousemove', (e) => {
        try {
            const nearRight = e.clientX >= (window.innerWidth - 60);
            if (nearRight) show();
        } catch (err) { /* ignore */ }
    });

    // Also reveal when pointer enters the window (desktop)
    window.addEventListener('pointerenter', show);
    // Clean up on page hide
    window.addEventListener('pagehide', () => { if (hideTimer) clearTimeout(hideTimer); });
})();
