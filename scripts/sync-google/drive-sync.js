const { google } = require('googleapis');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const config = require('./config');

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  });
  return auth.getClient();
}

async function listFilesInFolder(drive, folderId) {
  const files = [];
  let pageToken = null;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: 1000,
      pageToken: pageToken
    });

    files.push(...response.data.files);
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return files;
}

async function downloadFile(drive, fileId, destPath) {
  const dest = fs.createWriteStream(destPath);

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return new Promise((resolve, reject) => {
    response.data
      .on('end', () => resolve())
      .on('error', err => reject(err))
      .pipe(dest);
  });
}

async function syncFolder(drive, folderId, localPath, relativePath = '') {
  const fullLocalPath = path.join(config.projectRoot, localPath);

  // Ensure directory exists
  await fsPromises.mkdir(fullLocalPath, { recursive: true });

  // Get existing local files
  let localFiles;
  try {
    localFiles = await fsPromises.readdir(fullLocalPath);
  } catch {
    localFiles = [];
  }
  const localFilesSet = new Set(localFiles);

  // List files in Drive folder
  const driveFiles = await listFilesInFolder(drive, folderId);

  let downloadCount = 0;
  let skipCount = 0;

  for (const file of driveFiles) {
    // Handle subfolders recursively
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const subPath = path.join(localPath, file.name);
      console.log(`  Entering folder: ${relativePath}/${file.name}`);
      await syncFolder(drive, file.id, subPath, `${relativePath}/${file.name}`);
      continue;
    }

    // Skip non-image files (but allow SVG)
    const isImage = file.mimeType.startsWith('image/') ||
                    file.mimeType === 'image/svg+xml' ||
                    file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

    if (!isImage) continue;

    const destPath = path.join(fullLocalPath, file.name);

    // Check if file needs downloading
    if (localFilesSet.has(file.name)) {
      // File exists - check if it's newer on Drive
      try {
        const stats = await fsPromises.stat(destPath);
        const driveModified = new Date(file.modifiedTime);
        if (stats.mtime >= driveModified) {
          skipCount++;
          continue;
        }
      } catch {
        // File doesn't exist, will download
      }
    }

    // Download the file
    const displayPath = relativePath ? `${relativePath}/${file.name}` : file.name;
    console.log(`  Downloading: ${displayPath}`);

    try {
      await downloadFile(drive, file.id, destPath);
      downloadCount++;
    } catch (error) {
      console.error(`  Error downloading ${file.name}:`, error.message);
    }
  }

  if (downloadCount > 0 || skipCount > 0) {
    const pathDisplay = relativePath || localPath;
    console.log(`  ${pathDisplay}: ${downloadCount} downloaded, ${skipCount} up-to-date`);
  }
}

async function syncDriveImages() {
  const authClient = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth: authClient });

  console.log(`Syncing images from Drive folder...`);
  console.log(`Local destination: ${config.localPicturesPath}/\n`);

  await syncFolder(
    drive,
    config.rootDriveFolderId,
    config.localPicturesPath
  );
}

module.exports = { syncDriveImages };

// Run directly if called as script
if (require.main === module) {
  syncDriveImages().catch(console.error);
}
