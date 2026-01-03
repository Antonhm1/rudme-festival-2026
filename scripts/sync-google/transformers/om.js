/**
 * Transform om (about) sheet data to om.json format
 *
 * Expected columns:
 * - hero text: The big hero text at the top
 * - section title: The section title
 * - beskrivelse: Description text (newlines become <br>)
 */

function transformOm(data) {
  if (!data || data.length === 0) {
    return {
      heroText: '',
      sectionTitle: '',
      beskrivelse: ''
    };
  }

  const firstRow = data[0];

  // Convert newlines to <br> in beskrivelse
  const rawBeskrivelse = firstRow.beskrivelse || firstRow['beskrivelse'] || '';
  const beskrivelse = rawBeskrivelse.replace(/\n/g, '<br>');

  return {
    heroText: firstRow['hero text'] || firstRow.heroText || firstRow.hero_text || '',
    sectionTitle: firstRow['section title'] || firstRow.sectionTitle || firstRow.section_title || '',
    beskrivelse: beskrivelse
  };
}

module.exports = transformOm;
