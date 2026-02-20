const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  });
  return auth.getClient();
}

async function findFolder(drive, parentFolderId, folderName) {
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)'
  });
  return response.data.files[0] || null;
}

async function listDocuments(drive, folderId) {
  const files = [];
  let pageToken = null;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink)',
      pageSize: 100,
      pageToken: pageToken
    });

    files.push(...response.data.files);
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return files;
}

async function syncDocuments() {
  const authClient = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth: authClient });

  console.log('Syncing documents from Drive...');

  // Find the "Dokumenter" folder inside the root Drive folder
  const dokumenterFolder = await findFolder(drive, config.rootDriveFolderId, 'Dokumenter');

  if (!dokumenterFolder) {
    console.error('  "Dokumenter" folder not found in Google Drive root folder.');
    return;
  }

  console.log(`  Found "Dokumenter" folder (ID: ${dokumenterFolder.id})`);

  // List all files in the Dokumenter folder
  const files = await listDocuments(drive, dokumenterFolder.id);

  // Filter out subfolders and map to document metadata
  const documents = files
    .filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
    .map(f => {
      // Remove file extension from display name
      const name = f.name.replace(/\.[^/.]+$/, '');
      return {
        name: name,
        fileName: f.name,
        viewLink: f.webViewLink,
        downloadLink: f.webContentLink || f.webViewLink
      };
    });

  console.log(`  Found ${documents.length} document(s)`);

  // Write to database/documents.json
  const outputPath = path.join(config.projectRoot, 'database/documents.json');
  await fs.writeFile(outputPath, JSON.stringify(documents, null, 2));
  console.log('  Wrote database/documents.json');
}

module.exports = { syncDocuments };

// Run directly if called as script
if (require.main === module) {
  syncDocuments().catch(console.error);
}
