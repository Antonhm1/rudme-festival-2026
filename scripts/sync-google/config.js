const path = require('path');
const fs = require('fs');

// Load configuration
const configPath = path.join(__dirname, '../../config/sheets-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Find service account file (check multiple locations and patterns)
const possiblePaths = [
  path.join(__dirname, '../../service-account.json'),
  path.join(__dirname, '../../config/service-account.json')
];

// Also look for files matching Google's default naming pattern
const projectRoot = path.join(__dirname, '../..');
const rootFiles = fs.readdirSync(projectRoot);
const googleServiceAccountFile = rootFiles.find(f =>
  f.endsWith('.json') &&
  (f.includes('service-account') || f.match(/^[a-z-]+-[a-f0-9]+\.json$/))
);
if (googleServiceAccountFile) {
  possiblePaths.unshift(path.join(projectRoot, googleServiceAccountFile));
}

let serviceAccountPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    break;
  }
}

if (!serviceAccountPath) {
  console.error('Error: service-account.json not found!');
  console.error('Please place it in the project root or config/ folder.');
  process.exit(1);
}

module.exports = {
  ...config,
  serviceAccountPath,
  projectRoot: path.join(__dirname, '../..')
};
