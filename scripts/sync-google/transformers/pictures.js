/**
 * Transform pictures sheet data to pictures.json format
 *
 * Expected columns:
 * - id: Unique identifier (e.g., "picture-1")
 * - filename or image: Image filename (e.g., "carlo-jo-boi.jpg")
 * - description: Image description/alt text
 * - location: Where the photo was taken
 * - photographer: Photographer name
 * - color: Hex color for slide background
 * - order: Display order number
 * - mobileCrop: Mobile crop value (1-10)
 */

function transformPictures(rows) {
  const pictures = rows.map(row => {
    // Support both 'filename' and 'image' column names
    const filename = row.filename || row.image || '';

    return {
      id: row.id || '',
      filename: filename,
      description: row.description || '',
      location: row.location || '',
      photographer: row.photographer || '',
      color: row.color || '#FFFFFF',
      order: parseInt(row.order, 10) || 0,
      mobileCrop: parseInt(row.mobileCrop || row.mobile_crop, 10) || 5
    };
  }).filter(pic => pic.id && pic.filename);

  // Sort by order
  pictures.sort((a, b) => a.order - b.order);

  return { pictures };
}

module.exports = transformPictures;
