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
 */

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
        content: row.content || ''
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
      section.content = row.content;
    }

    return section;
  }).filter(section => section.id && section.title);

  return { sections };
}

module.exports = transformInfoSections;
