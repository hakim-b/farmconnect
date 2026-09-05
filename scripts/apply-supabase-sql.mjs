import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const password = env.SUPABASE_DB_PASSWORD || env.EXPO_PUBLIC_SUPABASE_DB_PASSWORD;
const url = env.EXPO_PUBLIC_SUPABASE_URL || '';
const projectRef = url.replace('https://', '').split('.')[0];

if (!password || !projectRef) {
  console.error('Missing Supabase URL or database password in .env.local');
  process.exit(1);
}

const sqlFiles = process.argv.slice(2);
if (sqlFiles.length === 0) {
  console.error('Usage: node scripts/apply-supabase-sql.mjs <file.sql> [...]');
  process.exit(1);
}

const candidates = [
  { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres' },
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}` },
  { host: 'aws-0-us-east-2.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}` },
  { host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}` },
  { host: 'aws-0-us-west-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}` },
];

async function connect() {
  let lastError;
  for (const candidate of candidates) {
    const client = new Client({
      host: candidate.host,
      port: candidate.port,
      user: candidate.user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      console.log(`Connected via ${candidate.host}`);
      return client;
    } catch (error) {
      lastError = error;
      console.log(`Could not reach ${candidate.host}: ${error.message}`);
    }
  }
  throw lastError ?? new Error('No database host responded');
}

const client = await connect();
try {
  for (const file of sqlFiles) {
    const sql = fs.readFileSync(path.resolve(file), 'utf8');
    console.log(`Applying ${file}`);
    await client.query(sql);
    console.log(`Applied ${file}`);
  }
} finally {
  await client.end();
}
