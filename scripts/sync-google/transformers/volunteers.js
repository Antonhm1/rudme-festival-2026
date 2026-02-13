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
 * - button link: URL for the button
 * - Mailbeskrivelse: Email body template (if present, generates a mailto: link instead of using button link)
 */

const MAILTO_ADDRESS = 'frivillig@rudmefestival.dk';

function buildMailtoLink(roleName, mailBody) {
  const subject = `Ansøgning om at blive ${roleName.toLowerCase()}`;
  return `mailto:${MAILTO_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
}

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

    // Build button link: use Mailbeskrivelse to create mailto if present, otherwise use button link
    const mailDescription = (row['Mail beskrivelse'] || row.Mailbeskrivelse || row.mailbeskrivelse || '').trim();
    let buttonLink;
    if (mailDescription) {
      buttonLink = buildMailtoLink(row.name || '', mailDescription);
    } else {
      buttonLink = row['button link'] || row.buttonLink || row.button_link || '';
    }

    return {
      id: row.id || '',
      name: row.name || '',
      image: imagePath,
      crop: parseInt(row.crop, 10) || 50,
      color: row.color || '#FFFFFF',
      description: description,
      buttonText: row.buttonText || row.button_text || '',
      buttonLink: buttonLink
    };
  }).filter(role => role.id && role.name);

  return { roles };
}

module.exports = transformVolunteers;
