const fs = require('fs');
const path = require('path');
const config = require('./config');

const SPONSORS_DIR = path.join(config.projectRoot, 'pictures', 'Sponsorer');
const OUTPUT_FILE = path.join(config.projectRoot, 'database', 'sponsors.json');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];

/**
 * Scans pictures/Sponsorer/ and generates database/sponsors.json
 * from the filenames found there. Sponsor name is derived from
 * the filename (without extension).
 */
function generateSponsorsJson() {
  console.log('Generating sponsors.json from pictures/Sponsorer/...');

  if (!fs.existsSync(SPONSORS_DIR)) {
    console.log('  No Sponsorer folder found – writing empty list.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2) + '\n');
    return;
  }

  const files = fs.readdirSync(SPONSORS_DIR)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    })
    .sort((a, b) => a.localeCompare(b, 'da'));

  const sponsors = files.map(file => {
    const name = path.basename(file, path.extname(file))
      .replace(/[-_]/g, ' ');
    return { name, file };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sponsors, null, 2) + '\n');
  console.log(`  Found ${sponsors.length} sponsor logo(s).`);
}

module.exports = { generateSponsorsJson };

if (require.main === module) {
  generateSponsorsJson();
}
