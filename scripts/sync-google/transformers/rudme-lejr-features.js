/**
 * Transform rudme-lejr-features sheet data to rudme-lejr-features.json format
 *
 * Expected columns:
 * - titel: Feature title
 * - beskrivelse: Feature description
 * - image: Image path
 */

function transformRudmeLejrFeatures(data) {
  const features = data.map(row => {
    // Convert newlines to <br> in beskrivelse
    const beskrivelse = (row.beskrivelse || '').replace(/\n/g, '<br>');

    return {
      titel: row.titel || '',
      beskrivelse: beskrivelse,
      image: row.image || ''
    };
  }).filter(item => item.titel);

  return { features };
}

module.exports = transformRudmeLejrFeatures;
