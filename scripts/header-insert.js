// Insert shared header partial into the document before the main script runs.
// This script is intended to be included with `defer` before `assets/script.js`
// so that the rest of the behaviour can assume the header is present in the DOM.
(async function() {
    try {
        if (document.getElementById('logo-container')) return; // already present
        const resp = await fetch('assets/header.html', { cache: 'no-cache' });
        if (!resp.ok) return;
        const html = await resp.text();
    // Insert at the top of the body so header markup appears before page content
    document.body.insertAdjacentHTML('afterbegin', html);
    // Add a body class indicating whether we're on the front page or a subpage.
    // This allows CSS to scope different select/menu backgrounds for index vs other pages.
    try {
        const lastSegment = location.pathname.split('/').filter(Boolean).pop() || '';
        if (location.pathname === '/' || lastSegment === 'index.html' || lastSegment === '') {
            document.body.classList.add('is-frontpage');
        } else {
            document.body.classList.add('is-subpage');
        }
    } catch (e) {
        /* noop */
    }
    // Notify other scripts that the header has been inserted
    try { document.dispatchEvent(new Event('header-inserted')); } catch (e) { /* ignore */ }
    } catch (err) {
        // fail silently; page will still work but header won't be shared
        console.error('Could not load shared header:', err);
    }
})();
