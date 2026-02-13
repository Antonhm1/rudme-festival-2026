/**
 * Transform Billetter sheet data to tickets.json format
 *
 * Expected columns:
 * - billetsalg-igang: "ja" or "nej"
 * - Ikke til salg text: Text shown when tickets are not for sale
 * - til salg text: Text shown when tickets are for sale
 * - billet link: URL for the buy ticket button
 */

function transformTickets(data) {
  if (!data || data.length === 0) {
    return {
      'billetsalg-igang': 'nej',
      'Ikke til salg text': '',
      'til salg text': '',
      'billet link': ''
    };
  }

  const row = data[0];

  return {
    'billetsalg-igang': row['billetsalg-igang'] || 'nej',
    'Ikke til salg text': row['Ikke til salg text'] || '',
    'til salg text': row['til salg text'] || '',
    'billet link': row['billet link'] || ''
  };
}

module.exports = transformTickets;
