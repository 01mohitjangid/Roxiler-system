import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy apps/backend/.env.example to apps/backend/.env.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  console.log('Tables are ready. Next: npm run create-admin');
} finally {
  await client.end();
}
