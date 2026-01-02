// Simple loader: fetch Apps Script data and render basic cards using billedUrl
(function () {
  'use strict';

  const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxtStObTbJAroG-Z2LQLAzih4OCmL8cuPlW_TYHzPI3tdiNtLE8c1KuV7mfRhbN5hklUw/exec';

  // Utility: prefer billedUrl field, fall back to billedfil and try to normalize Drive links
  function chooseImageUrl(item) {
    if (!item) return null;
    const candidates = [item.billedUrl, item.BilledURL, item.billedURL, item.billedfil, item.image];
    for (let c of candidates) {
      if (!c) continue;
      c = String(c).trim();
      if (!c) continue;
      // If it's already a direct URL (starts with http), normalize Drive share links to the
      // embeddable `uc?export=view&id=...` form (and otherwise return the URL).
      if (/^https?:\/\//i.test(c)) {
        const driveMatch = c.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([-\w]{25,})/i);
        if (driveMatch && driveMatch[1]) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
        const idParam = c.match(/[?&]id=([-\w]{25,})/i);
        if (idParam && idParam[1]) return `https://drive.google.com/uc?export=view&id=${idParam[1]}`;
        if (c.indexOf('drive.google.com/uc') !== -1) return c;
        return c;
      }
      if (/[-\w]{25,}/.test(c)) return `https://drive.google.com/uc?export=view&id=${c}`;
      // otherwise assume it's a local path or plain URL fragment
      return c;
    }
    return null;
  }

  function renderSimpleCards(list) {
    // prefer existing program grid if present, otherwise fall back to example container
    const container = document.getElementById('artist-grid') || document.getElementById('content-container');
    if (!container) {
      console.warn('No container found (#artist-grid or #content-container) to render artists');
      return;
    }
    container.innerHTML = '';

    list.forEach(item => {
      try {
        const name = item.navn || item.Name || item.name || '';
        const color = item.farve || item.color || '';
        const imageUrl = chooseImageUrl(item) || '';

        const card = document.createElement('div');
        card.className = 'item-card';
        if (color) card.style.backgroundColor = color;

        if (imageUrl) {
          // detect Drive file id patterns; if found we'll embed the Drive preview iframe
          const idMatch = (imageUrl.match(/[?&]id=([-\w]{25,})/i) || imageUrl.match(/file\/d\/([-\w]{25,})/i) || imageUrl.match(/([-\w]{25,})/));
          const fileId = idMatch && idMatch[1] ? idMatch[1] : null;
          if (fileId) {
            // Use the direct Drive image URL (uc?export=view) instead of the preview iframe
            // to avoid Drive's embedded toolbar/buttons (preview iframe is cross-origin).
            const ucUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            const img = document.createElement('img');
            img.src = ucUrl;
            img.alt = `Cover art for ${name}`;
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.border = '0';
            // add a small class so you can style it in CSS if needed
            img.className = 'drive-preview-image';
            img.addEventListener('error', function () {
              console.error('Drive image load error for', name, ucUrl, this);
              try { const note = document.createElement('div'); note.className = 'img-error'; note.textContent = 'Billede kunne ikke indlæses'; card.appendChild(note); } catch(e){}
              try { this.style.opacity = '0.4'; } catch(e){}
            });
            card.appendChild(img);
            // clicking the image updates bottom bar with the direct image URL
            img.addEventListener('click', function (ev) { ev.stopPropagation(); updateBottomLinkBar(ucUrl, name); });
          } else {
            // fallback to normal <img> for non-Drive sources
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Cover art for ${name}`;
            img.loading = 'lazy';
            img.addEventListener('error', function () {
              console.error('Image load error for', name, imageUrl, this);
              try { const note = document.createElement('div'); note.className = 'img-error'; note.textContent = 'Billede kunne ikke indlæses'; card.appendChild(note); } catch(e){}
              try { this.style.opacity = '0.4'; } catch(e){}
            });
            card.appendChild(img);
            img.addEventListener('click', function (ev) { ev.stopPropagation(); updateBottomLinkBar(imageUrl, name); });
          }
        }

        const title = document.createElement('h3');
        title.textContent = name;
        card.appendChild(title);
        // clicking the card (anywhere) should also update the bottom link bar
        card.addEventListener('click', function () {
          if (imageUrl) updateBottomLinkBar(imageUrl, name);
        });

        container.appendChild(card);
      } catch (e) {
        console.error('Failed to render item', item, e);
      }
    });
  }

  function parsePayloadText(text) {
    let data;
    try { data = JSON.parse(text); }
    catch (err) {
      // strip common XSSI prefix then try again
      const stripped = text.replace(/^\)\]\}'\n/, '');
      data = JSON.parse(stripped);
    }
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.rows)) return data.rows;
    // sheets v4 style values -> map to objects when headers present
    if (data && data.values && Array.isArray(data.values) && data.values.length>0) {
      const headers = data.values[0];
      return data.values.slice(1).map(r => {
        const obj = {};
        headers.forEach((h,i) => obj[h] = r[i]);
        return obj;
      });
    }
    return [];
  }

  function fetchAndRender() {
    fetch(WEBAPP_URL + '?sheetName=database')
      .then(r => {
        if (!r.ok) throw new Error('Network response not ok ' + r.status);
        return r.text();
      })
      .then(text => {
        const items = parsePayloadText(text);
        if (!items || items.length === 0) {
          console.warn('No items returned from webapp', items);
          return;
        }
        // For debugging, print first two items
        console.info('Loaded', items.length, 'items from sheet');
        renderSimpleCards(items);
      })
      .catch(err => {
        console.error('Failed to load artists from sheet:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndRender);
  } else fetchAndRender();

})();

// Bottom link bar: create a simple fixed element that shows the currently-selected image URL
(function createBottomLinkBar(){
  if (document.getElementById('bottom-image-link-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'bottom-image-link-bar';
  bar.style.position = 'fixed';
  bar.style.left = '0';
  bar.style.right = '0';
  bar.style.bottom = '0';
  bar.style.padding = '6px 12px';
  bar.style.background = 'rgba(0,0,0,0.7)';
  bar.style.color = '#fff';
  bar.style.fontSize = '13px';
  bar.style.zIndex = '9999';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.gap = '12px';
  bar.style.minHeight = '36px';
  bar.style.boxSizing = 'border-box';
  // content: label + link + close button
  const label = document.createElement('span');
  label.textContent = 'Billedlink:';
  label.style.opacity = '0.85';
  const link = document.createElement('a');
  link.href = '#';
  link.target = '_blank';
  link.rel = 'noopener';
  link.style.color = '#9fe';
  link.style.wordBreak = 'break-all';
  link.style.flex = '1 1 auto';
  link.textContent = '';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.title = 'Luk';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => { bar.style.display = 'none'; });
  bar.appendChild(label);
  bar.appendChild(link);
  bar.appendChild(closeBtn);
  document.body.appendChild(bar);

  // expose updater
  window.updateBottomLinkBar = function (url, name) {
    if (!url) {
      bar.style.display = 'none';
      return;
    }
    link.href = url;
    link.textContent = url + (name ? (' — ' + name) : '');
    bar.style.display = 'flex';
  };
})();
