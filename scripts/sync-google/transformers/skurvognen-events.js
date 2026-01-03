/**
 * Transform skurvognen-events sheet data to skurvognen-events.json format
 *
 * Expected columns:
 * - id: Unique identifier
 * - title: Event title
 * - image: Image path
 * - description: Event description
 * - color: Hex color
 */

function transformSkurvognenEvents(data) {
  return data.map(row => {
    // Convert newlines to <br> in description
    const description = (row.description || '').replace(/\n/g, '<br>');

    return {
      id: row.id || '',
      title: row.title || '',
      image: row.image || '',
      description: description,
      color: row.color || '#FFFFFF'
    };
  }).filter(item => item.id && item.title);
}

module.exports = transformSkurvognenEvents;
