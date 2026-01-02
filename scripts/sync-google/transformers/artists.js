/**
 * Transform artists sheet data to artists.json format
 *
 * Expected columns:
 * - id: Unique identifier (e.g., "artist-a")
 * - name: Artist name (e.g., "ANIMAUX ANIMÉ")
 * - color: Hex color (e.g., "#676767")
 * - image_path: Full path or just filename (e.g., "animauxAnime.png" or "pictures/artists/animauxAnime.png")
 * - crop: Crop position ("top", "mid", "bottom")
 * - spotify: Full iframe HTML for Spotify embed
 */

function transformArtists(rows) {
  const artists = rows.map(row => {
    // Handle image path - add prefix if it's just a filename
    let imagePath = row.image_path || row.image || '';
    if (imagePath && !imagePath.includes('/')) {
      imagePath = `pictures/artists/${imagePath}`;
    }

    return {
      id: row.id || '',
      name: row.name || '',
      color: row.color || '#000000',
      image: imagePath,
      crop: row.crop || 'mid',
      spotify: row.spotify || ''
    };
  }).filter(artist => artist.id && artist.name);

  return { artists };
}

module.exports = transformArtists;
