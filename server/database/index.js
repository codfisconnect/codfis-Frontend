const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const config = require('../config');
const { JOBS_DATA, getIsoDate, getFutureDeadline } = require('./jobsSeedData');

let isPg = false;
let pgPool = null;
let sqliteDb = null;

// Determine database type
if (config.databaseUrl && (config.databaseUrl.startsWith('postgres://') || config.databaseUrl.startsWith('postgresql://'))) {
  isPg = true;
  pgPool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  console.log('[Database] PostgreSQL provider active (Neon/Cloud).');
} else {
  // If in production without DATABASE_URL, fail explicitly
  if (config.nodeEnv === 'production') {
    throw new Error('[Database] FATAL: DATABASE_URL is required in production (e.g. Neon PostgreSQL). Silent fallback to ephemeral SQLite is disallowed.');
  }
  sqliteDb = new sqlite3.Database(config.dbPath, (err) => {
    if (err) {
      console.error('[Database] Failed to connect to SQLite:', err.message);
    } else {
      console.log('[Database] SQLite connected at', config.dbPath);
    }
  });
}

/**
 * Universal query returning array of rows
 */
const query = async (sql, params = []) => {
  if (isPg) {
    let pgSql = sql;
    // Convert ? parameters to $1, $2, etc.
    let paramIdx = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

/**
 * Universal get returning single row or null
 */
const get = async (sql, params = []) => {
  if (isPg) {
    let pgSql = sql;
    let paramIdx = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
};

/**
 * Universal run returning { lastID, changes }
 */
const run = async (sql, params = []) => {
  if (isPg) {
    let pgSql = sql;
    let paramIdx = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramIdx++}`);

    // If it's an INSERT and doesn't specify RETURNING, append RETURNING id
    const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
    if (isInsert && !/RETURNING/i.test(pgSql)) {
      pgSql += ' RETURNING id';
    }

    const res = await pgPool.query(pgSql, params);
    const lastID = (isInsert && res.rows[0]) ? (res.rows[0].id || null) : null;
    return {
      lastID,
      changes: res.rowCount || 0
    };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

/**
 * Initialize Schema and seed base records
 */
async function initDb() {
  if (isPg) {
    await initPgSchema();
  } else {
    await initSqliteSchema();
  }

  // Common seed operations (safe: only seeds if table is empty or missing admin)
  await seedAdmin();
  await seedInterviewSlots();
  await syncJobs();
}

async function initPgSchema() {
  // 1. Admins
  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Jobs
  await run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      "workMode" VARCHAR(100) NOT NULL,
      "employmentType" VARCHAR(100) NOT NULL,
      experience VARCHAR(100) NOT NULL,
      salary VARCHAR(100) DEFAULT 'Competitive',
      description TEXT NOT NULL,
      requirements TEXT,
      skills TEXT,
      "applicationType" VARCHAR(100) DEFAULT 'resume',
      active INTEGER DEFAULT 1,
      job_code VARCHAR(100) UNIQUE,
      workflow_type VARCHAR(100) DEFAULT 'simple',
      qualification TEXT,
      notice_period VARCHAR(100),
      summary TEXT,
      responsibilities TEXT,
      required_skills TEXT,
      preferred_skills TEXT,
      posted_at TIMESTAMP,
      application_deadline TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Job Applications
  await run(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id SERIAL PRIMARY KEY,
      "applicationId" VARCHAR(100) UNIQUE NOT NULL,
      "jobId" INTEGER NOT NULL,
      "jobTitle" VARCHAR(255) NOT NULL,
      "fullName" VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      location VARCHAR(255),
      experience VARCHAR(100),
      "currentCompany" VARCHAR(255),
      "noticePeriod" VARCHAR(100),
      "expectedSalary" VARCHAR(100),
      "linkedIn" TEXT,
      github TEXT,
      portfolio TEXT,
      "resumePath" TEXT,
      "resumeOriginalName" TEXT,
      "coverLetter" TEXT,
      "answersJson" TEXT,
      status VARCHAR(100) DEFAULT 'Applied',
      workflow_type VARCHAR(100) DEFAULT 'simple',
      current_step VARCHAR(100) DEFAULT 'submitted',
      submitted_at TIMESTAMP,
      disqualified INTEGER DEFAULT 0,
      disqualification_reason TEXT,
      score REAL,
      code_submission TEXT,
      code_language VARCHAR(100),
      interview_slot_id INTEGER,
      candidate_account_id INTEGER,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Application Events
  await run(`
    CREATE TABLE IF NOT EXISTS application_events (
      id SERIAL PRIMARY KEY,
      application_id VARCHAR(100) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Application Files
  await run(`
    CREATE TABLE IF NOT EXISTS application_files (
      id SERIAL PRIMARY KEY,
      application_id VARCHAR(100) NOT NULL,
      file_type VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Candidate Accounts
  await run(`
    CREATE TABLE IF NOT EXISTS candidate_accounts (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. Interview Slots
  await run(`
    CREATE TABLE IF NOT EXISTS interview_slots (
      id SERIAL PRIMARY KEY,
      slot_date VARCHAR(50) NOT NULL,
      slot_time VARCHAR(50) NOT NULL,
      is_booked INTEGER DEFAULT 0,
      booked_by_application_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. Trainer Applications
  await run(`
    CREATE TABLE IF NOT EXISTS trainer_applications (
      id SERIAL PRIMARY KEY,
      "applicationId" VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      location VARCHAR(255),
      "primaryTech" VARCHAR(255) NOT NULL,
      experience VARCHAR(100) NOT NULL,
      "currentRole" VARCHAR(255),
      "linkedIn" TEXT,
      portfolio TEXT,
      "preferredTopics" TEXT,
      availability VARCHAR(255),
      "expectedCompensation" VARCHAR(100),
      "resumePath" TEXT,
      "resumeOriginalName" TEXT,
      "additionalInfo" TEXT,
      status VARCHAR(100) DEFAULT 'Applied',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 9. Contacts
  await run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100),
      message TEXT NOT NULL,
      status VARCHAR(100) DEFAULT 'New',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 10. Project Enquiries
  await run(`
    CREATE TABLE IF NOT EXISTS project_enquiries (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100),
      "projectType" VARCHAR(255) NOT NULL,
      "budgetRange" VARCHAR(100),
      timeline VARCHAR(100),
      requirement TEXT NOT NULL,
      status VARCHAR(100) DEFAULT 'New',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function initSqliteSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      requirements TEXT,
      skills TEXT,
      applicationType TEXT DEFAULT 'resume',
      active INTEGER DEFAULT 1,
      job_code TEXT UNIQUE,
      workflow_type TEXT DEFAULT 'simple',
      qualification TEXT,
      notice_period TEXT,
      summary TEXT,
      responsibilities TEXT,
      required_skills TEXT,
      preferred_skills TEXT,
      posted_at DATETIME,
      application_deadline DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      workflow_type TEXT DEFAULT 'simple',
      current_step TEXT DEFAULT 'submitted',
      submitted_at DATETIME,
      disqualified INTEGER DEFAULT 0,
      disqualification_reason TEXT,
      score REAL,
      code_submission TEXT,
      code_language TEXT,
      interview_slot_id INTEGER,
      candidate_account_id INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS application_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS application_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
}

async function seedAdmin() {
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
}

async function seedInterviewSlots() {
  const slotCount = await get('SELECT COUNT(*) as count FROM interview_slots');
  const count = slotCount ? parseInt(slotCount.count, 10) : 0;
  if (count === 0) {
    const initialSlots = [
      { date: '2026-10-12', time: '10:00 AM' },
      { date: '2026-10-12', time: '11:30 AM' },
      { date: '2026-10-12', time: '02:00 PM' },
      { date: '2026-10-12', time: '04:00 PM' },
      { date: '2026-10-13', time: '10:00 AM' },
      { date: '2026-10-13', time: '11:30 AM' },
      { date: '2026-10-13', time: '02:00 PM' },
      { date: '2026-10-14', time: '11:00 AM' },
      { date: '2026-10-14', time: '03:00 PM' },
      { date: '2026-10-15', time: '10:00 AM' }
    ];
    for (const s of initialSlots) {
      await run('INSERT INTO interview_slots (slot_date, slot_time, is_booked) VALUES (?, ?, 0)', [s.date, s.time]);
    }
  }
}

async function syncJobs() {
  for (const job of JOBS_DATA) {
    const existing = await get('SELECT * FROM jobs WHERE job_code = ?', [job.job_code]);
    const postedAt = getIsoDate(job.days_ago || 0, job.hours_ago || 0);
    const deadline = getFutureDeadline(job.deadline_days || 30);
    const workMode = job.work_mode || job.workMode || 'Hybrid';
    const employmentType = job.employment_type || job.employmentType || 'Full-time';

    const reqs = job.requirements || job.responsibilities || '';
    const skls = job.skills || job.required_skills || '';

    if (existing) {
      await run(`
        UPDATE jobs SET
          title = ?, department = ?, location = ?, "workMode" = ?,
          "employmentType" = ?, experience = ?, salary = ?, description = ?,
          requirements = ?, skills = ?, active = 1, workflow_type = ?,
          qualification = ?, notice_period = ?, summary = ?,
          responsibilities = ?, required_skills = ?, preferred_skills = ?,
          posted_at = ?, application_deadline = ?
        WHERE job_code = ?
      `, [
        job.title, job.department, job.location, workMode,
        employmentType, job.experience, job.salary, job.description,
        reqs, skls, job.workflow_type,
        job.qualification, job.notice_period, job.summary,
        job.responsibilities, job.required_skills, job.preferred_skills,
        postedAt, deadline, job.job_code
      ]);
    } else {
      await run(`
        INSERT INTO jobs (
          job_code, title, department, location, "workMode", "employmentType",
          experience, salary, description, requirements, skills, active,
          workflow_type, qualification, notice_period, summary,
          responsibilities, required_skills, preferred_skills,
          posted_at, application_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        job.job_code, job.title, job.department, job.location, workMode, employmentType,
        job.experience, job.salary, job.description, reqs, skls,
        job.workflow_type, job.qualification, job.notice_period, job.summary,
        job.responsibilities, job.required_skills, job.preferred_skills,
        postedAt, deadline
      ]);
    }
  }

  // Deactivate any jobs not in official 20 list
  const activeJobs = await query('SELECT id, job_code, title FROM jobs WHERE active = 1');
  const validCodes = new Set(JOBS_DATA.map(j => j.job_code));
  for (const aj of activeJobs) {
    if (!validCodes.has(aj.job_code)) {
      await run('UPDATE jobs SET active = 0 WHERE id = ?', [aj.id]);
    }
  }
}

module.exports = {
  db: sqliteDb,
  query,
  get,
  run,
  initDb,
  isPg: () => isPg
};
