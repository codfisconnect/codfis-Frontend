const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const config = require('../config');
const { JOBS_DATA, getIsoDate, getFutureDeadline } = require('./jobsSeedData');

const db = new sqlite3.Database(config.dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', config.dbPath);
  }
});

// Helper for db promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

async function initDb() {
  // 1. Admins table
  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Jobs table (base schema)
  await run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      location TEXT NOT NULL,
      workMode TEXT NOT NULL,
      employmentType TEXT NOT NULL,
      experience TEXT NOT NULL,
      salary TEXT DEFAULT 'Competitive',
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      skills TEXT NOT NULL,
      applicationType TEXT DEFAULT 'resume',
      active INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Safe schema migration for jobs table (add missing columns without dropping data)
  const existingJobCols = (await query(`PRAGMA table_info(jobs)`)).map(c => c.name);
  
  if (!existingJobCols.includes('job_code')) {
    await run(`ALTER TABLE jobs ADD COLUMN job_code TEXT`);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_job_code ON jobs(job_code)`);
  }
  if (!existingJobCols.includes('workflow_type')) {
    await run(`ALTER TABLE jobs ADD COLUMN workflow_type TEXT DEFAULT 'simple'`);
  }
  if (!existingJobCols.includes('qualification')) {
    await run(`ALTER TABLE jobs ADD COLUMN qualification TEXT`);
  }
  if (!existingJobCols.includes('notice_period')) {
    await run(`ALTER TABLE jobs ADD COLUMN notice_period TEXT`);
  }
  if (!existingJobCols.includes('summary')) {
    await run(`ALTER TABLE jobs ADD COLUMN summary TEXT`);
  }
  if (!existingJobCols.includes('responsibilities')) {
    await run(`ALTER TABLE jobs ADD COLUMN responsibilities TEXT`);
  }
  if (!existingJobCols.includes('required_skills')) {
    await run(`ALTER TABLE jobs ADD COLUMN required_skills TEXT`);
  }
  if (!existingJobCols.includes('preferred_skills')) {
    await run(`ALTER TABLE jobs ADD COLUMN preferred_skills TEXT`);
  }
  if (!existingJobCols.includes('posted_at')) {
    await run(`ALTER TABLE jobs ADD COLUMN posted_at DATETIME`);
  }
  if (!existingJobCols.includes('application_deadline')) {
    await run(`ALTER TABLE jobs ADD COLUMN application_deadline DATETIME`);
  }

  // 3. Job Applications table (base schema)
  await run(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId TEXT UNIQUE NOT NULL,
      jobId INTEGER NOT NULL,
      jobTitle TEXT NOT NULL,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT,
      experience TEXT,
      currentCompany TEXT,
      noticePeriod TEXT,
      expectedSalary TEXT,
      linkedIn TEXT,
      github TEXT,
      portfolio TEXT,
      resumePath TEXT,
      resumeOriginalName TEXT,
      coverLetter TEXT,
      answersJson TEXT,
      status TEXT DEFAULT 'Applied',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobId) REFERENCES jobs (id)
    )
  `);

  // Safe migration for job_applications table
  const existingAppCols = (await query(`PRAGMA table_info(job_applications)`)).map(c => c.name);
  if (!existingAppCols.includes('workflow_type')) {
    await run(`ALTER TABLE job_applications ADD COLUMN workflow_type TEXT DEFAULT 'simple'`);
  }
  if (!existingAppCols.includes('current_step')) {
    await run(`ALTER TABLE job_applications ADD COLUMN current_step TEXT DEFAULT 'submitted'`);
  }
  if (!existingAppCols.includes('submitted_at')) {
    await run(`ALTER TABLE job_applications ADD COLUMN submitted_at DATETIME`);
  }
  if (!existingAppCols.includes('disqualified')) {
    await run(`ALTER TABLE job_applications ADD COLUMN disqualified INTEGER DEFAULT 0`);
  }
  if (!existingAppCols.includes('disqualification_reason')) {
    await run(`ALTER TABLE job_applications ADD COLUMN disqualification_reason TEXT`);
  }
  if (!existingAppCols.includes('score')) {
    await run(`ALTER TABLE job_applications ADD COLUMN score REAL`);
  }
  if (!existingAppCols.includes('code_submission')) {
    await run(`ALTER TABLE job_applications ADD COLUMN code_submission TEXT`);
  }
  if (!existingAppCols.includes('code_language')) {
    await run(`ALTER TABLE job_applications ADD COLUMN code_language TEXT`);
  }
  if (!existingAppCols.includes('interview_slot_id')) {
    await run(`ALTER TABLE job_applications ADD COLUMN interview_slot_id INTEGER`);
  }
  if (!existingAppCols.includes('candidate_account_id')) {
    await run(`ALTER TABLE job_applications ADD COLUMN candidate_account_id INTEGER`);
  }

  // 4. Application Events table
  await run(`
    CREATE TABLE IF NOT EXISTS application_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Application Files table (for multiple uploads, video uploads, portfolios)
  await run(`
    CREATE TABLE IF NOT EXISTS application_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      file_type TEXT NOT NULL, -- 'resume', 'cover_letter', 'project_doc', 'work_sample', 'video', 'portfolio'
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Candidate Accounts table (for Registration before Application workflow)
  await run(`
    CREATE TABLE IF NOT EXISTS candidate_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. Interview Slots table (for Interview Slot Selection workflow)
  await run(`
    CREATE TABLE IF NOT EXISTS interview_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_date TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      is_booked INTEGER DEFAULT 0,
      booked_by_application_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. Trainer Applications table
  await run(`
    CREATE TABLE IF NOT EXISTS trainer_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT,
      primaryTech TEXT NOT NULL,
      experience TEXT NOT NULL,
      currentRole TEXT,
      linkedIn TEXT,
      portfolio TEXT,
      preferredTopics TEXT,
      availability TEXT,
      expectedCompensation TEXT,
      resumePath TEXT,
      resumeOriginalName TEXT,
      additionalInfo TEXT,
      status TEXT DEFAULT 'Applied',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 9. Contact Messages table
  await run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 10. Project Enquiries table
  await run(`
    CREATE TABLE IF NOT EXISTS project_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      projectType TEXT NOT NULL,
      budgetRange TEXT,
      timeline TEXT,
      requirement TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 11. Seed Admin user if none exists
  const existingAdmin = await get('SELECT * FROM admins WHERE username = ?', [config.adminUser]);
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(config.adminPass, salt);
    await run('INSERT INTO admins (username, password, role) VALUES (?, ?, ?)', [
      config.adminUser,
      hashedPassword,
      'admin'
    ]);
    console.log(`[Database] Seeded initial admin account: ${config.adminUser}`);
  }

  // 12. Seed Interview Slots if empty
  const slotCount = await get('SELECT COUNT(*) as count FROM interview_slots');
  if (slotCount && slotCount.count === 0) {
    const initialSlots = [
      { date: '2026-10-12', time: '10:00 AM' },
      { date: '2026-10-12', time: '11:30 AM' },
      { date: '2026-10-12', time: '02:00 PM' },
      { date: '2026-10-12', time: '04:00 PM' },
      { date: '2026-10-13', time: '10:00 AM' },
      { date: '2026-10-13', time: '11:30 AM' },
      { date: '2026-10-13', time: '02:00 PM' },
      { date: '2026-10-13', time: '04:00 PM' },
      { date: '2026-10-14', time: '10:00 AM' },
      { date: '2026-10-14', time: '02:30 PM' }
    ];
    for (const s of initialSlots) {
      await run('INSERT INTO interview_slots (slot_date, slot_time, is_booked) VALUES (?, ?, 0)', [s.date, s.time]);
    }
    console.log('[Database] Seeded initial interview slots');
  }

  // 13. Seed / Synchronize the 20 Genuine Codfis Vacancies
  await syncCodfis20Jobs();
}

/**
 * Synchronize the 20 Real Codfis Vacancies
 * Updates matching roles without breaking existing application foreign keys,
 * deactivates old non-matching placeholder test records,
 * and inserts remaining vacancies so active vacancies equal exactly 20.
 */
async function syncCodfis20Jobs() {
  const existingJobs = await query('SELECT * FROM jobs');
  
  // Mapping of title match patterns to reuse existing IDs (e.g., Senior Full Stack -> Full Stack Developer, QA Automation -> Playwright Automation)
  const titleMapping = {
    'Senior Full Stack Engineer': 'COD-DEV-003', // Full Stack Developer
    'QA Automation Engineer (Playwright / Selenium)': 'COD-QA-002', // Playwright Automation Tester
  };

  const processedCodes = new Set();

  for (const job of JOBS_DATA) {
    const postedAt = getIsoDate(job.days_ago, job.hours_ago);
    const deadline = getFutureDeadline(job.deadline_days);

    // 1. Try finding job by job_code
    let target = existingJobs.find(j => j.job_code === job.job_code);

    // 2. If not found by job_code, check if an existing job matches titleMapping
    if (!target) {
      const matchKey = Object.keys(titleMapping).find(k => titleMapping[k] === job.job_code);
      if (matchKey) {
        target = existingJobs.find(j => j.title === matchKey && !processedCodes.has(j.id));
      }
    }

    // 3. Check exact title match
    if (!target) {
      target = existingJobs.find(j => j.title.toLowerCase() === job.title.toLowerCase() && !processedCodes.has(j.id));
    }

    if (target) {
      processedCodes.add(target.id);
      await run(`
        UPDATE jobs SET
          job_code = ?,
          title = ?,
          department = ?,
          location = ?,
          workMode = ?,
          employmentType = ?,
          experience = ?,
          salary = ?,
          qualification = ?,
          notice_period = ?,
          summary = ?,
          description = ?,
          responsibilities = ?,
          required_skills = ?,
          preferred_skills = ?,
          skills = ?,
          requirements = ?,
          workflow_type = ?,
          applicationType = ?,
          posted_at = ?,
          application_deadline = ?,
          active = 1,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        job.job_code,
        job.title,
        job.department,
        job.location,
        job.work_mode,
        job.employment_type,
        job.experience,
        job.salary,
        job.qualification,
        job.notice_period,
        job.summary,
        job.description,
        job.responsibilities,
        job.required_skills,
        job.preferred_skills,
        job.required_skills,
        job.responsibilities,
        job.workflow_type,
        job.workflow_type,
        postedAt,
        deadline,
        target.id
      ]);
    } else {
      const res = await run(`
        INSERT INTO jobs (
          job_code, title, department, location, workMode, employmentType,
          experience, salary, qualification, notice_period, summary, description,
          responsibilities, required_skills, preferred_skills, skills, requirements,
          workflow_type, applicationType, posted_at, application_deadline, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        job.job_code,
        job.title,
        job.department,
        job.location,
        job.work_mode,
        job.employment_type,
        job.experience,
        job.salary,
        job.qualification,
        job.notice_period,
        job.summary,
        job.description,
        job.responsibilities,
        job.required_skills,
        job.preferred_skills,
        job.required_skills,
        job.responsibilities,
        job.workflow_type,
        job.workflow_type,
        postedAt,
        deadline
      ]);
      processedCodes.add(res.lastID);
    }
  }

  // Deactivate any remaining jobs that are not part of the official 20 vacancies
  // (e.g. old test records from automated tests, like 'DevOps / Cloud Specialist')
  const activeJobs = await query('SELECT id, job_code, title FROM jobs WHERE active = 1');
  const validCodes = new Set(JOBS_DATA.map(j => j.job_code));
  for (const aj of activeJobs) {
    if (!validCodes.has(aj.job_code)) {
      await run('UPDATE jobs SET active = 0 WHERE id = ?', [aj.id]);
    }
  }

  const finalActive = await get('SELECT COUNT(*) as count FROM jobs WHERE active = 1');
  console.log(`[Database] Synchronized Codfis vacancies. Total active jobs: ${finalActive.count}`);
}

module.exports = {
  db,
  query,
  get,
  run,
  initDb
};
