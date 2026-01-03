/**
 * Transform skurvognen-om sheet data to skurvognen-om.json format
 *
 * Expected columns:
 * - underoverskrift: Subtitle
 * - overskrift: Main heading
 * - beskrivelse: Description text (newlines create separate paragraphs)
 */

function transformSkurvognenOm(data) {
  if (!data || data.length === 0) {
    return {
      underoverskrift: '',
      overskrift: '',
      beskrivelse: []
    };
  }

  const firstRow = data[0];
  const underoverskrift = firstRow.underoverskrift || '';
  const overskrift = firstRow.overskrift || '';

  // Split beskrivelse by newlines to create array of paragraphs
  const rawBeskrivelse = firstRow.beskrivelse || '';
  const beskrivelse = rawBeskrivelse
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return {
    underoverskrift,
    overskrift,
    beskrivelse
  };
}

module.exports = transformSkurvognenOm;
