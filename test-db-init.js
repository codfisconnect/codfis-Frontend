const { initDb, query, get } = require('./server/database');

async function testInit() {
  console.log('Running initDb()...');
  await initDb();
  console.log('initDb() completed successfully.');

  const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tables.map(t => t.name));

  const jobCols = await query('PRAGMA table_info(jobs)');
  console.log('Jobs columns:', jobCols.map(c => c.name));

  const activeJobs = await query('SELECT id, job_code, title, department, workflow_type, posted_at, active FROM jobs WHERE active = 1 ORDER BY posted_at DESC');
  console.log('\n--- ACTIVE JOBS (' + activeJobs.length + ') ---');
  activeJobs.forEach((j, i) => {
    console.log(`${i+1}. [${j.job_code}] ${j.title} (${j.workflow_type}) | Posted: ${j.posted_at}`);
  });

  process.exit(0);
}

testInit().catch(err => {
  console.error('Error in testInit:', err);
  process.exit(1);
});
