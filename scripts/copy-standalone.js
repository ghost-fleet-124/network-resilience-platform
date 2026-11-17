const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const fromPath = path.join(from, entry.name);
    const toPath = path.join(to, entry.name);
    try {
      if (entry.isDirectory()) {
        copyFolderSync(fromPath, toPath);
      } else {
        fs.copyFileSync(fromPath, toPath);
      }
    } catch (e) {
      // Ignore copy errors for locked files
    }
  }
}

try {
  const rootDir = path.resolve(__dirname, '..');
  const standaloneDir = path.join(rootDir, '.next', 'standalone');

  if (fs.existsSync(standaloneDir)) {
    // Copy public into .next/standalone/public
    copyFolderSync(path.join(rootDir, 'public'), path.join(standaloneDir, 'public'));
    // Copy .next/static into .next/standalone/.next/static
    copyFolderSync(path.join(rootDir, '.next', 'static'), path.join(standaloneDir, '.next', 'static'));
    console.log('✔ [Standalone] Static assets successfully synchronized into .next/standalone');
  }
} catch (err) {
  console.warn('[Standalone Warning] Asset copy failed:', err.message);
}
