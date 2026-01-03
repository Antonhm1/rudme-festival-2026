/**
 * Transform info-sections sheet data to info-sections.json format
 *
 * Expected info-sections columns:
 * - id: Unique identifier (e.g., "kontakt")
 * - title: Section title
 * - color: Hex color
 * - image_path: Full path or just filename (optional for sections with subsections)
 * - content: HTML content (for sections without subsections)
 *
 * Expected info-subsections columns (optional sheet):
 * - parent_id: ID of parent section (e.g., "regler")
 * - title: Subsection title
 * - image_path: Full path or just filename
 * - content: HTML content
 *
 * Content auto-wrapping:
 * - Plain text without block elements gets wrapped in <p>
 * - Text between block elements (<h3>, <ul>, etc.) gets wrapped in <p>
 * - You only need to write: <h3>Title</h3>Text here
 *   Instead of: <h3>Title</h3><p>Text here</p>
 */

// Wrap text segments between block elements in <p> tags
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

  // Block elements that we handle (h1-h6 for headers)
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
    // If it's a header element, leave it as-is
    if (headerPattern.test(part.trim())) {
      return part;
    }
    // Otherwise convert newlines to <br> and wrap in <p>
    const withBreaks = part.trim().replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  }).join('');
}

function transformInfoSections(sectionsData, subsectionsData) {
  // Group subsections by parent_id
  const subsectionsByParent = {};
  if (subsectionsData && subsectionsData.length > 0) {
    subsectionsData.forEach(row => {
      const parentId = row.parent_id || row.parentId || row['parent-id'];
      if (!parentId) return;

      if (!subsectionsByParent[parentId]) {
        subsectionsByParent[parentId] = [];
      }

      // Handle image path
      let imagePath = row.image_path || row.image || '';
      if (imagePath && !imagePath.includes('/')) {
        imagePath = `pictures/info-pictures/${imagePath}`;
      }

      subsectionsByParent[parentId].push({
        title: row.title || '',
        image: imagePath || undefined,
        content: wrapContentInParagraphs(row.content || '')
      });
    });
  }

  const sections = sectionsData.map(row => {
    const sectionId = row.id || '';

    // Handle image path
    let imagePath = row.image_path || row.image || '';
    if (imagePath && !imagePath.includes('/')) {
      imagePath = `pictures/info-pictures/${imagePath}`;
    }

    const section = {
      id: sectionId,
      title: row.title || '',
      color: row.color || '#FFFFFF'
    };

    // Add image if provided (and no subsections)
    if (imagePath) {
      section.image = imagePath;
    }

    // Check if this section has subsections
    if (subsectionsByParent[sectionId] && subsectionsByParent[sectionId].length > 0) {
      section.subsections = subsectionsByParent[sectionId];
    } else if (row.content) {
      // Only add content if no subsections
      section.content = wrapContentInParagraphs(row.content);
    }

    return section;
  }).filter(section => section.id && section.title);

  return { sections };
}

module.exports = transformInfoSections;
