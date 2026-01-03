/**
 * Transform rudme-lejr-info sheet data to rudme-lejr-info.json format
 *
 * Expected columns:
 * - sektion: Section number
 * - overskrift: Section heading
 * - beskrivelse: Section description (plain text or minimal HTML)
 * - tilmeldings link: Optional signup link
 *
 * Auto-wrapping: Plain text gets wrapped in <p> tags automatically
 */

// Wrap text in <p> tags if not already wrapped
function wrapContentInParagraphs(content) {
  if (!content || !content.trim()) return '';

  const trimmed = content.trim();

  // If content already has <p> tags, return as-is
  if (/<p[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  // If content starts with <div>, <ul>, <ol>, <table> - it's complex HTML, leave as-is
  if (/^<(div|ul|ol|table)[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  // Header elements that we handle
  const headerTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const headerPattern = new RegExp(`<(${headerTags.join('|')})(\\s|>)`, 'i');

  // If no headers, wrap the whole thing in <p> and convert newlines to <br>
  if (!headerPattern.test(trimmed)) {
    const withBreaks = trimmed.replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  }

  // Split by header elements and wrap text segments between them
  const headerRegex = new RegExp(`(<(?:${headerTags.join('|')})(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:${headerTags.join('|')})>)`, 'gi');
  const parts = trimmed.split(headerRegex);

  return parts.map(part => {
    if (!part || !part.trim()) return '';
    if (headerPattern.test(part.trim())) return part;
    // Convert newlines to <br> and wrap in <p>
    const withBreaks = part.trim().replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  }).join('');
}

function transformRudmeLejrInfo(data) {
  const sektioner = data.map(row => {
    const section = {
      sektion: parseInt(row.sektion, 10) || 0,
      overskrift: row.overskrift || '',
      beskrivelse: wrapContentInParagraphs(row.beskrivelse || '')
    };

    // Add optional signup link if present
    const signupLink = row['tilmeldings link'] || row.tilmeldingslink || row.tilmeldings_link;
    if (signupLink) {
      section['tilmeldings link'] = signupLink;
    }

    return section;
  }).filter(item => item.overskrift);

  return { sektioner };
}

module.exports = transformRudmeLejrInfo;
