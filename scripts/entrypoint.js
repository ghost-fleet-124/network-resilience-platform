const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('   BLACKSHIELD V2 — CRITICAL INFRASTRUCTURE DEFENSE PLATFORM   ');
console.log('================================================================');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';
console.log(`[BLACKSHIELD] Launching server on ${hostname}:${port}...`);

// Sync database if prepare-database exists
try {
  const prep = path.join(__dirname, 'prepare-database.js');
  if (fs.existsSync(prep)) {
    require(prep);
  }
} catch (e) {
  console.warn('[BLACKSHIELD DB] Initializer notice:', e.message);
}

// Locate server.js
const candidates = [
  path.join(__dirname, '../server.js'),
  path.join(__dirname, '../.next/standalone/server.js'),
  path.join(process.cwd(), 'server.js'),
  path.join(process.cwd(), '.next/standalone/server.js'),
];

let serverPath = null;
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    serverPath = cand;
    break;
  }
}

if (!serverPath) {
  console.error('[BLACKSHIELD Fatal] Could not locate standalone server.js. Checked:', candidates);
  process.exit(1);
}

console.log(`[BLACKSHIELD] Executing standalone entry: ${serverPath}`);
require(serverPath);
