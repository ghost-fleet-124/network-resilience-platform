const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[DB Sync] Verifying database configuration...');

const rootDir = path.resolve(__dirname, '..');
const prismaDir = path.join(rootDir, 'prisma');
const schemaSqlite = path.join(prismaDir, 'schema.prisma');
const schemaPostgres = path.join(prismaDir, 'schema.postgresql.prisma');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

try {
  if (isPostgres && fs.existsSync(schemaPostgres)) {
    console.log('[DB Sync] PostgreSQL detected. Using PostgreSQL schema...');
    fs.copyFileSync(schemaPostgres, schemaSqlite);
  } else {
    console.log('[DB Sync] SQLite / In-Memory mode active.');
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'file:./dev.db';
    }
  }

  // Always generate Prisma Client
  console.log('[DB Sync] Generating Prisma client...');
  execSync('npx prisma generate', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.warn('[DB Sync Warning] Database preparation notice:', err.message);
}
