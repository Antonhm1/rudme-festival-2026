const fs = require('fs').promises;
const path = require('path');

async function main() {
  const cwd = process.cwd();
  const picturesJsonPath = path.join(cwd, 'assets', 'pictures.json');
  const indexPath = path.join(cwd, 'index.html');

  // Load pictures data from JSON
  let picturesData;
  try {
    const jsonContent = await fs.readFile(picturesJsonPath, 'utf8');
    picturesData = JSON.parse(jsonContent);
  } catch (err) {
    console.error('Failed to read pictures.json:', picturesJsonPath, err.message);
    process.exit(1);
  }

  // Validate JSON structure
  if (!picturesData.pictures || !Array.isArray(picturesData.pictures)) {
    console.error('Invalid pictures.json structure: missing pictures array');
    process.exit(1);
  }

  const slides = picturesData.pictures.map(picture => {
    return {
      filename: picture.filename,
      name: picture.description || picture.filename,
      bg: picture.color || '#cccccc',
      order: picture.order || 0,
      location: picture.location || '',
      photographer: picture.photographer || ''
    };
  });

  slides.sort((a, b) => a.order - b.order);

  const slideHtml = slides.map(s => {
    // Use encodeURIComponent so reserved characters like # and & are percent-encoded
    const src = `pictures/${encodeURIComponent(s.filename)}`;
    // If name is empty or only punctuation, use filename (safe fallback)
    let alt = (s.name || s.filename).replace(/"/g, '');
    // Trim trailing punctuation
    alt = alt.replace(/[\-_.# ]+$/g, '').trim();
    return `        <div class="slide" style="background-color: ${s.bg};" data-location="${s.location}" data-photographer="${s.photographer}">
            <img src="${src}" alt="${alt}">
        </div>`;
  }).join('\n');

  let index;
  try {
    index = await fs.readFile(indexPath, 'utf8');
  } catch (err) {
    console.error('Failed to read index.html:', err.message);
    process.exit(1);
  }

  const markerRegex = /(<!-- SLIDES-START -->)[\s\S]*?(<!-- SLIDES-END -->)/i;
  if (!markerRegex.test(index)) {
    console.error('Markers <!-- SLIDES-START --> and <!-- SLIDES-END --> not found in index.html');
    process.exit(1);
  }

  const newContent = index.replace(markerRegex, `<!-- SLIDES-START -->\n${slideHtml}\n        <!-- SLIDES-END -->`);

  try {
    await fs.writeFile(indexPath, newContent, 'utf8');
    console.log('index.html updated with', slides.length, 'slides.');
  } catch (err) {
    console.error('Failed to write index.html:', err.message);
    process.exit(1);
  }
}

main();
