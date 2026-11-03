// server/scripts/start-db.js
import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dbDir,
  user: 'postgres',
  password: 'password',
  port: 5432,
  persistent: true,
  autoRehydrateSymlinks: true,
  initdbFlags: ['-E', 'UTF8', '--locale=C']
});

async function main() {
  console.log(`[DB] Initializing embedded Postgres in ${dbDir}...`);
  try {
    await pg.initialise();
  } catch (err) {
    console.log('[DB] Note during initialise:', err.message);
  }
  
  console.log('[DB] Starting embedded Postgres on port 5432...');
  await pg.start();
  console.log('[DB] Postgres is running and ready on port 5432!');

  try {
    console.log('[DB] Ensuring database lab_portal exists...');
    await pg.createDatabase('lab_portal');
    console.log('[DB] Database lab_portal is ready!');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('[DB] Database lab_portal already exists.');
    } else {
      console.log('[DB] Note during createDatabase:', err.message);
    }
  }

  // Keep process alive if run directly
  process.on('SIGINT', async () => {
    console.log('\n[DB] Stopping Postgres...');
    await pg.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n[DB] Stopping Postgres...');
    await pg.stop();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[DB] Failed to start embedded Postgres:', err);
  process.exit(1);
});
