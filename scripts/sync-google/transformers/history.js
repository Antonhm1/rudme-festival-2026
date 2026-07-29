/**
 * Transform history sheet data to history.json format
 *
 * Expected columns:
 * - year: Year number (e.g., 2016)
 * - label: Display title for the card (optional, defaults to year — use for spans like "2020 – 2021")
 * - image_path: Full path or just filename
 * - description: Year description
 * - gallery: Extra images shown when the card is expanded (optional).
 *   One image per line (or separated by ";"), format: filename|caption
 *   Bare filenames resolve to pictures/om/historie/museum/
 * - afterMovieUrl: URL to after movie (optional)
 * - picturesUrl: URL to pictures (optional)
 * - attendees: Number of attendees
 * - budgetResult: Budget result (can be negative)
 * - revenue: Total revenue
 * - organizers: Number of organizers
 * - coordinators: Number of coordinators
 * - volunteers: Number of volunteers
 * - color: Hex color
 */

const MUSEUM_PATH = 'pictures/om/historie/museum';

// "filename|caption" entries separated by newlines or semicolons
function parseGallery(value) {
  if (!value) return [];

  return String(value)
    .split(/[\n;]+/)
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const [rawImage, ...captionParts] = entry.split('|');
      let image = rawImage.trim();
      if (image && !image.includes('/')) {
        image = `${MUSEUM_PATH}/${image}`;
      }
      return { image, caption: captionParts.join('|').trim() };
    })
    .filter(item => item.image);
}

function transformHistory(rows) {
  const years = rows.map(row => {
    // Handle image path
    let imagePath = row.image_path || row.image || '';
    if (imagePath && !imagePath.includes('/')) {
      imagePath = `pictures/om/historie/${imagePath}`;
    }

    // Convert newlines to <br> in description
    const description = (row.description || '').replace(/\n/g, '<br>');

    const year = parseInt(row.year, 10) || 0;

    return {
      year: year,
      label: (row.label || '').trim() || String(year),
      image: imagePath,
      description: description,
      gallery: parseGallery(row.gallery),
      afterMovieUrl: row.afterMovieUrl || row.after_movie_url || '',
      picturesUrl: row.picturesUrl || row.pictures_url || '',
      attendees: parseInt(row.attendees, 10) || 0,
      budgetResult: parseInt(row.budgetResult || row.budget_result, 10) || 0,
      revenue: parseInt(row.revenue, 10) || 0,
      organizers: parseInt(row.organizers, 10) || 0,
      coordinators: parseInt(row.coordinators, 10) || 0,
      volunteers: parseInt(row.volunteers, 10) || 0,
      color: row.color || '#FFFFFF'
    };
  }).filter(year => year.year > 0);

  // Sort by year
  years.sort((a, b) => a.year - b.year);

  return { years };
}

module.exports = transformHistory;
