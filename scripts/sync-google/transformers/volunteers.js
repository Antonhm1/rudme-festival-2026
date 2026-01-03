/**
 * Transform volunteers sheet data to volunteers.json format
 *
 * Expected columns:
 * - id: Unique identifier (e.g., "frivillig")
 * - name: Role name (e.g., "FRIVILLIG")
 * - image_path: Full path or just filename
 * - crop: Numeric crop value (e.g., 30, 50)
 * - color: Hex color (e.g., "#90EE90")
 * - description: Description text (newlines create separate paragraphs)
 * - buttonText: CTA button text (e.g., "BLIV FRIVILLIG")
 */

function transformVolunteers(rows) {
  const roles = rows.map(row => {
    // Split description by newlines to create array of paragraphs
    const rawDescription = row.description || '';
    const description = rawDescription
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Handle image path
    let imagePath = row.image_path || row.image || '';
    if (imagePath && !imagePath.includes('/')) {
      imagePath = `pictures/frivillig-siden/roller/${imagePath}`;
    }

    return {
      id: row.id || '',
      name: row.name || '',
      image: imagePath,
      crop: parseInt(row.crop, 10) || 50,
      color: row.color || '#FFFFFF',
      description: description,
      buttonText: row.buttonText || row.button_text || ''
    };
  }).filter(role => role.id && role.name);

  return { roles };
}

module.exports = transformVolunteers;
