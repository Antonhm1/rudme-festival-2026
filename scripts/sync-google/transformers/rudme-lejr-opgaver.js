/**
 * Transform rudme-lejr-opgaver sheet data to rudme-lejr-opgaver.json format
 *
 * Expected columns:
 * - titel: Task title
 * - beskrivelse: Task description
 * - image: Image path
 */

function transformRudmeLejrOpgaver(data) {
  const opgaver = data.map(row => {
    // Convert newlines to <br> in beskrivelse
    const beskrivelse = (row.beskrivelse || '').replace(/\n/g, '<br>');

    return {
      titel: row.titel || '',
      beskrivelse: beskrivelse,
      image: row.image || ''
    };
  }).filter(item => item.titel);

  return { opgaver };
}

module.exports = transformRudmeLejrOpgaver;
