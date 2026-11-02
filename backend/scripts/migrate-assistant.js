import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';

if (!process.argv.includes('--apply')) {
  console.error('Use node scripts/migrate-assistant.js --apply to apply additive assistant migrations to the configured database. Existing baseline tables are required.');
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. No migration was applied.');
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
  try {
    const baseline = await pool.query("SELECT to_regclass('public.appointments') AS appointments, to_regclass('public.bills') AS bills, to_regclass('public.reports') AS reports, to_regclass('public.profiles') AS profiles");
    if (Object.values(baseline.rows[0]).some((value) => !value)) throw new Error('BASELINE_MISSING');
    const directory = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url));
    // Only the new assistant migrations are eligible; baseline migrations are never replayed.
    const files = (await readdir(directory)).filter((name) => /^2026110219\d{4}_[a-z_]+\.sql$/.test(name)).sort();
    if (!files.length) throw new Error('MIGRATION_MISSING');
    for (const name of files) {
      const sql = await readFile(path.join(directory, name), 'utf8');
      await pool.query(sql);
      console.log(`Applied ${name}`);
    }
  } catch (error) {
    console.error(error.message === 'BASELINE_MISSING' ? 'The existing LabSetu baseline schema is missing. Apply its existing migrations in Supabase before the assistant migrations.' : 'Assistant migration failed. Inspect database permissions and migration compatibility locally. No credentials were logged.');
    process.exitCode = 1;
  } finally { await pool.end(); }
}
