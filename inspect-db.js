const { db, query, get } = require('./server/database');

async function inspect() {
  const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tables.map(t => t.name));

  for (const t of ['jobs', 'job_applications', 'trainer_applications', 'admins']) {
    const cols = await query(`PRAGMA table_info(${t})`);
    console.log(`Columns in ${t}:`, cols.map(c => c.name));
  }

  const jobs = await query('SELECT id, title, department, active FROM jobs');
  console.log('Existing jobs count:', jobs.length);
  console.log('Existing jobs:', jobs);

  const apps = await query('SELECT id, applicationId, jobTitle, fullName, status FROM job_applications');
  console.log('Existing job applications count:', apps.length);
  console.log('Existing job applications:', apps);

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
