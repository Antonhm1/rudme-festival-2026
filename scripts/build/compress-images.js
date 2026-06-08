const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MAX_WIDTH = 2000;
const JPEG_QUALITY = 80;
const PNG_COMPRESSION_LEVEL = 9;
const ROOT = path.resolve(__dirname, '..', '..');
const MANIFEST_PATH = path.join(ROOT, '.compressed-manifest.json');
const SCAN_DIRS = ['pictures', 'ArtistPictures'];

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function findImages(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImages(fullPath));
    } else if (/\.(jpe?g|png|tiff?)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const isTiff = ext === '.tif' || ext === '.tiff';
  const originalSize = fs.statSync(filePath).size;
  // Convert TIFF to JPEG with libvips (via sharp), reading straight from the
  // file path with sequential access + shrink-on-load. This keeps memory low
  // even for very large TIFFs — ImageMagick's `convert` gets OOM-killed on
  // 150 MB+ files, and reading the whole file into a Buffer first defeats
  // shrink-on-load.
  if (isTiff) {
    const jpgPath = filePath.replace(/\.tiff?$/i, '.jpg');

    let origWidth;
    try {
      origWidth = (await sharp(filePath, { limitInputPixels: false }).metadata()).width;
      await sharp(filePath, { limitInputPixels: false, sequentialRead: true })
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toFile(jpgPath);
    } catch (err) {
      // Remove the oversized original so it can never block the commit
      // (GitHub rejects files >100 MB). The rest of the sync still lands.
      await fs.promises.unlink(filePath).catch(() => {});
      throw new Error(`TIFF conversion failed, removed original ${path.basename(filePath)}: ${err.message}`);
    }
    await fs.promises.unlink(filePath);

    const newSize = fs.statSync(jpgPath).size;
    return { originalSize, newSize, resized: origWidth > MAX_WIDTH, width: origWidth, convertedTo: jpgPath };
  }

  const image = sharp(await fs.promises.readFile(filePath), { limitInputPixels: false });
  const metadata = await image.metadata();

  let pipeline = image;

  if (metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH);
  }

  let buffer;
  if (ext === '.png') {
    buffer = await pipeline.png({ compressionLevel: PNG_COMPRESSION_LEVEL }).toBuffer();
  } else {
    buffer = await pipeline.jpeg({ quality: JPEG_QUALITY }).toBuffer();
  }

  const newSize = buffer.length;

  if (newSize < originalSize) {
    await fs.promises.writeFile(filePath, buffer);
    return { originalSize, newSize, resized: metadata.width > MAX_WIDTH, width: metadata.width };
  }

  return { originalSize, newSize: originalSize, skipped: true };
}

async function compressImages() {
  const manifest = loadManifest();
  let processed = 0;
  let skipped = 0;
  let totalSaved = 0;

  console.log('Starting image compression...');
  console.log(`Max width: ${MAX_WIDTH}px, JPEG quality: ${JPEG_QUALITY}%\n`);

  const allImages = SCAN_DIRS.flatMap(dir => findImages(path.join(ROOT, dir)));

  for (const filePath of allImages) {
    const relPath = path.relative(ROOT, filePath);
    const stat = fs.statSync(filePath);
    const key = relPath;
    const cached = manifest[key];

    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      skipped++;
      continue;
    }

    try {
      const result = await compressImage(filePath);

      if (result.skipped) {
        console.log(`  Already optimal: ${relPath}`);
        skipped++;
      } else {
        const saved = result.originalSize - result.newSize;
        totalSaved += saved;
        const pct = ((saved / result.originalSize) * 100).toFixed(0);
        const sizeStr = `${(result.originalSize / 1024).toFixed(0)}KB -> ${(result.newSize / 1024).toFixed(0)}KB`;
        const resizeStr = result.resized ? ` (${result.width}px -> ${MAX_WIDTH}px)` : '';
        const convertStr = result.convertedTo ? ` [converted to .jpg]` : '';
        console.log(`  Compressed: ${relPath} ${sizeStr} (-${pct}%)${resizeStr}${convertStr}`);
        processed++;
      }

      const finalPath = result.convertedTo || filePath;
      const finalKey = result.convertedTo ? path.relative(ROOT, result.convertedTo) : key;
      const newStat = fs.statSync(finalPath);
      if (result.convertedTo) delete manifest[key];
      manifest[finalKey] = { mtimeMs: newStat.mtimeMs, size: newStat.size };
    } catch (err) {
      const stderr = err.stderr ? `\n${err.stderr.toString().trim()}` : '';
      console.error(`  Failed: ${relPath} - ${err.message}${stderr}`);
    }
  }

  saveManifest(manifest);

  console.log(`\nDone! ${processed} compressed, ${skipped} skipped, ${(totalSaved / 1024).toFixed(0)}KB saved total.`);
  return { processed, skipped, totalSaved };
}

if (require.main === module) {
  compressImages().catch(err => {
    console.error('Compression failed:', err.message);
    process.exit(1);
  });
}

module.exports = { compressImages };
