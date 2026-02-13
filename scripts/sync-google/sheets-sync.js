const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

// Import transformers
const transformArtists = require('./transformers/artists');
const transformVolunteers = require('./transformers/volunteers');
const transformPosters = require('./transformers/posters');
const transformHistory = require('./transformers/history');
const transformPictures = require('./transformers/pictures');
const transformInfoSections = require('./transformers/info-sections');
const transformRudmeLejrOpgaver = require('./transformers/rudme-lejr-opgaver');
const transformRudmeLejrFeatures = require('./transformers/rudme-lejr-features');
const transformRudmeLejrInfo = require('./transformers/rudme-lejr-info');
const transformSkurvognenOm = require('./transformers/skurvognen-om');
const transformSkurvognenEvents = require('./transformers/skurvognen-events');
const transformOm = require('./transformers/om');
const transformTickets = require('./transformers/tickets');

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  return auth.getClient();
}

async function fetchSheet(sheets, sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${sheetName}!A:ZZ`
    });
    return response.data.values || [];
  } catch (error) {
    if (error.code === 400 || error.message.includes('Unable to parse range')) {
      console.log(`  Sheet "${sheetName}" not found, skipping...`);
      return null;
    }
    throw error;
  }
}

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(row => row.some(cell => cell && cell.trim())) // Skip empty rows
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
}

async function syncSheets() {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Fetch all sheets first
  const sheetData = {};

  for (const [key, sheetConfig] of Object.entries(config.sheets)) {
    console.log(`Fetching sheet: ${sheetConfig.sheetName}...`);
    const rows = await fetchSheet(sheets, sheetConfig.sheetName);
    if (rows) {
      sheetData[key] = rowsToObjects(rows);
      console.log(`  Found ${sheetData[key].length} rows`);
    }
  }

  // Transform and write each JSON file
  const tasks = [
    {
      name: 'artists',
      transformer: transformArtists,
      data: sheetData.artists,
      output: config.sheets.artists.outputFile
    },
    {
      name: 'volunteers',
      transformer: transformVolunteers,
      data: sheetData.volunteers,
      output: config.sheets.volunteers.outputFile
    },
    {
      name: 'posters',
      transformer: transformPosters,
      data: sheetData.posters,
      roleColors: sheetData.roleColors,
      output: config.sheets.posters.outputFile
    },
    {
      name: 'history',
      transformer: transformHistory,
      data: sheetData.history,
      output: config.sheets.history.outputFile
    },
    {
      name: 'pictures',
      transformer: transformPictures,
      data: sheetData.pictures,
      output: config.sheets.pictures.outputFile
    },
    {
      name: 'info-sections',
      transformer: transformInfoSections,
      data: sheetData['info-sections'],
      subsections: sheetData['info-subsections'],
      output: config.sheets['info-sections'].outputFile
    },
    {
      name: 'rudme-lejr-opgaver',
      transformer: transformRudmeLejrOpgaver,
      data: sheetData['rudme-lejr-opgaver'],
      output: config.sheets['rudme-lejr-opgaver'].outputFile
    },
    {
      name: 'rudme-lejr-features',
      transformer: transformRudmeLejrFeatures,
      data: sheetData['rudme-lejr-features'],
      output: config.sheets['rudme-lejr-features'].outputFile
    },
    {
      name: 'rudme-lejr-info',
      transformer: transformRudmeLejrInfo,
      data: sheetData['rudme-lejr-info'],
      output: config.sheets['rudme-lejr-info'].outputFile
    },
    {
      name: 'skurvognen-om',
      transformer: transformSkurvognenOm,
      data: sheetData['skurvognen-om'],
      output: config.sheets['skurvognen-om'].outputFile
    },
    {
      name: 'skurvognen-events',
      transformer: transformSkurvognenEvents,
      data: sheetData['skurvognen-events'],
      output: config.sheets['skurvognen-events'].outputFile
    },
    {
      name: 'om',
      transformer: transformOm,
      data: sheetData['om'],
      output: config.sheets['om'].outputFile
    },
    {
      name: 'tickets',
      transformer: transformTickets,
      data: sheetData['tickets'],
      output: config.sheets['tickets'].outputFile
    }
  ];

  console.log('\nWriting JSON files...');

  for (const task of tasks) {
    if (!task.data) {
      console.log(`  Skipping ${task.name} (no data)`);
      continue;
    }

    try {
      let transformed;
      if (task.name === 'posters') {
        transformed = task.transformer(task.data, task.roleColors);
      } else if (task.name === 'info-sections') {
        transformed = task.transformer(task.data, task.subsections);
      } else {
        transformed = task.transformer(task.data);
      }

      const outputPath = path.join(config.projectRoot, task.output);
      await fs.writeFile(outputPath, JSON.stringify(transformed, null, 2));
      console.log(`  Wrote ${task.output}`);
    } catch (error) {
      console.error(`  Error processing ${task.name}:`, error.message);
    }
  }
}

module.exports = { syncSheets };

// Run directly if called as script
if (require.main === module) {
  syncSheets().catch(console.error);
}
