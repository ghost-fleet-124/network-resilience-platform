// Universal Server Entrypoint for BLACKSHIELD Cyber Defense Platform
const fs = require('fs');
const path = require('path');

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');
const entrypoint = path.join(__dirname, 'scripts', 'entrypoint.js');

if (fs.existsSync(standaloneServer)) {
  require(standaloneServer);
} else if (fs.existsSync(entrypoint)) {
  require(entrypoint);
} else {
  console.error('[BLACKSHIELD Error] Standalone server bundle not found. Please run npm run build.');
  process.exit(1);
}
