const { syncSheets } = require('./sheets-sync');
const { syncDriveImages } = require('./drive-sync');

async function main() {
  const args = process.argv.slice(2);
  const sheetsOnly = args.includes('--sheets-only');
  const imagesOnly = args.includes('--images-only');

  console.log('Starting Google sync...\n');

  try {
    if (!imagesOnly) {
      console.log('=== Syncing Sheets Data ===');
      await syncSheets();
      console.log('');
    }

    if (!sheetsOnly) {
      console.log('=== Syncing Drive Images ===');
      await syncDriveImages();
      console.log('');
    }

    console.log('Sync complete!');
  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

main();
