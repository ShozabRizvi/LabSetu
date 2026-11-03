import 'dotenv/config';
import { Pool } from 'pg';
import { createPgStore, createSyntheticState } from '../src/assistant/store.js';

// This command never runs on server startup. It only adds explicitly labelled synthetic records.
if (!process.argv.includes('--demo-seed') || process.env.NODE_ENV === 'production') {
  console.error('Use node scripts/seed-assistant.js --demo-seed against a local/test database. Production seeding is disabled.');
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. No data was changed.');
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
  try {
    const store = createPgStore(pool);
    const synthetic = createSyntheticState();
    const counts = await store.transaction((state) => {
      if (Object.values(state.tests).some((test) => test.synthetic !== true)) throw new Error('This database contains a real catalogue. Use a separate local/test database.');
      let testsAdded = 0;
      let slotsAdded = 0;
      for (const [id, test] of Object.entries(synthetic.tests)) if (!state.tests[id]) { state.tests[id] = test; testsAdded++; }
      for (const [id, slot] of Object.entries(synthetic.slots)) if (!state.slots[id]) { state.slots[id] = slot; slotsAdded++; }
      return { testsAdded, slotsAdded };
    });
    console.log(`SYNTHETIC DEMO DATA ONLY: added ${counts.testsAdded} catalogue tests and ${counts.slotsAdded} persisted slots. Existing records were preserved. No clinical results or payments were created.`);
  } catch (error) {
    // Never print database connection errors, query parameters, or connection strings.
    console.error(error.message === 'This database contains a real catalogue. Use a separate local/test database.' ? error.message : 'Synthetic seed failed. Apply assistant migrations first and verify your test database connection. No partial seed was saved.');
    process.exitCode = 1;
  } finally { await pool.end(); }
}
