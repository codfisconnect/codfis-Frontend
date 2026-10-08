const path = require('path');
const { db, query, get, run } = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Helper to generate human-readable Application Reference Number (e.g. COD-APP-20261008-0001)
async function generateApplicationReference() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const row = await get("SELECT COUNT(*) as count FROM job_applications WHERE applicationId LIKE ?", [`COD-APP-${dateStr}-%`]);
  const nextNum = String((row ? row.count : 0) + 1).padStart(4, '0');
  return `COD-APP-${dateStr}-${nextNum}`;
}

// Helper to log application events
async function logApplicationEvent(applicationId, eventType, metadata = null) {
  try {
    const metaStr = typeof metadata === 'object' && metadata !== null ? JSON.stringify(metadata) : (metadata ? String(metadata) : null);
    await run(
      'INSERT INTO application_events (application_id, event_type, metadata) VALUES (?, ?, ?)',
      [applicationId, eventType, metaStr]
    );
  } catch (err) {
    console.error('Failed to log application event:', err.message);
  }
}

// GET /api/jobs (public, active only with search, filters, and newest/oldest sorting)
exports.getActiveJobs = async (req, res) => {
  try {
    const {
      department,
      experience,
      location,
      workMode,
      employmentType,
      postedDate,
      sort,
      search
    } = req.query;

    let sql = 'SELECT * FROM jobs WHERE active = 1';
    const params = [];

    if (department && department !== 'All') {
      sql += ' AND department = ?';
      params.push(department);
    }

    if (experience && experience !== 'All') {
      sql += ' AND experience LIKE ?';
      params.push(`%${experience}%`);
    }

    if (location && location !== 'All') {
      sql += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    if (workMode && workMode !== 'All') {
      sql += ' AND workMode = ?';
      params.push(workMode);
    }

    if (employmentType && employmentType !== 'All') {
      sql += ' AND employmentType = ?';
      params.push(employmentType);
    }

    // Filter by postedDate freshness (Today, 7 days, 30 days)
    if (postedDate && postedDate !== 'All') {
      const now = new Date();
      if (postedDate.toLowerCase() === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        sql += ' AND posted_at >= ?';
        params.push(startOfToday);
      } else if (postedDate.toLowerCase() === '7days' || postedDate.toLowerCase() === '7_days' || postedDate === '7') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        sql += ' AND posted_at >= ?';
        params.push(sevenDaysAgo);
      } else if (postedDate.toLowerCase() === '30days' || postedDate.toLowerCase() === '30_days' || postedDate === '30') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        sql += ' AND posted_at >= ?';
        params.push(thirtyDaysAgo);
      }
    }

    // Keyword Search across title, department, skills, location, description
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ' AND (title LIKE ? OR department LIKE ? OR skills LIKE ? OR required_skills LIKE ? OR location LIKE ? OR description LIKE ?)';
      params.push(q, q, q, q, q, q);
    }

    // Sorting by posted_at (Newest / Oldest) - Requirement: Sort strictly based on posted_at, not id
    if (sort === 'oldest') {
      sql += ' ORDER BY datetime(posted_at) ASC, id ASC';
    } else {
      sql += ' ORDER BY datetime(posted_at) DESC, id DESC';
    }

    const jobs = await query(sql, params);
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ success: false, error: 'Internal server error while fetching jobs' });
  }
};

// GET /api/jobs/:id (public)
exports.getJobById = async (req, res) => {
  try {
    const job = await get('SELECT * FROM jobs WHERE id = ? OR job_code = ?', [req.params.id, req.params.id]);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job opening not found' });
    }

    // Log JOB_VIEWED event if viewed via detail
    logApplicationEvent(job.job_code || `JOB-${job.id}`, 'JOB_VIEWED', { jobId: job.id, title: job.title });

    res.json({ success: true, data: job });
  } catch (err) {
    console.error('Error fetching job details:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// POST /api/jobs/:id/apply (public with multi-workflow handling)
exports.applyForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await get('SELECT * FROM jobs WHERE id = ? OR job_code = ?', [jobId, jobId]);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job opening not found' });
    }

    if (!job.active) {
      return res.status(400).json({ success: false, error: 'This job opening is no longer active' });
    }

    const {
      fullName,
      email,
      phone,
      location,
      experience,
      currentCompany,
      noticePeriod,
      expectedSalary,
      linkedIn,
      github,
      portfolio,
      coverLetter,
      answersJson,
      workflowType,
      currentStep,
      disqualified,
      disqualificationReason,
      score,
      codeSubmission,
      codeLanguage,
      interviewSlotId,
      candidateAccountId
    } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Full name, email, and phone number are required.' });
    }

    // Disqualification logic for knockout questions
    const isDisqualified = Number(disqualified) === 1 || Boolean(disqualified === 'true' || disqualified === true);

    // Identify files from req.files or req.file
    let resumePath = null;
    let resumeOriginalName = null;
    const uploadedFiles = [];

    if (req.file) {
      resumePath = req.file.filename;
      resumeOriginalName = req.file.originalname;
      uploadedFiles.push({
        type: 'resume',
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        for (const f of req.files) {
          if (!resumePath && (f.fieldname === 'resume' || f.fieldname === 'file')) {
            resumePath = f.filename;
            resumeOriginalName = f.originalname;
          }
          uploadedFiles.push({
            type: f.fieldname,
            filename: f.filename,
            originalName: f.originalname,
            size: f.size,
            mimetype: f.mimetype,
            path: f.path
          });
        }
      } else {
        // req.files is object of field arrays
        for (const [fieldname, filesArr] of Object.entries(req.files)) {
          for (const f of filesArr) {
            if (!resumePath && fieldname === 'resume') {
              resumePath = f.filename;
              resumeOriginalName = f.originalname;
            }
            uploadedFiles.push({
              type: fieldname,
              filename: f.filename,
              originalName: f.originalname,
              size: f.size,
              mimetype: f.mimetype,
              path: f.path
            });
          }
        }
      }
    }

    // Some workflows might submit without file initially or external/registration
    // But if simple/mcq/etc require resume unless specified
    const appWorkflow = workflowType || job.workflow_type || 'simple';

    // Generate readable application reference number
    const applicationId = await generateApplicationReference();

    // Check interview slot if provided
    if (interviewSlotId) {
      const slot = await get('SELECT * FROM interview_slots WHERE id = ?', [interviewSlotId]);
      if (!slot) {
        return res.status(400).json({ success: false, error: 'Selected interview slot does not exist.' });
      }
      if (slot.is_booked) {
        return res.status(400).json({ success: false, error: 'This interview slot has already been booked. Please choose another slot.' });
      }
    }

    const appStatus = isDisqualified ? 'Disqualified' : 'Applied';

    // Insert into job_applications
    const result = await run(`
      INSERT INTO job_applications (
        applicationId, jobId, jobTitle, fullName, email, phone, location,
        experience, currentCompany, noticePeriod, expectedSalary,
        linkedIn, github, portfolio, resumePath, resumeOriginalName,
        coverLetter, answersJson, status, workflow_type, current_step,
        submitted_at, disqualified, disqualification_reason, score,
        code_submission, code_language, interview_slot_id, candidate_account_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
    `, [
      applicationId, job.id, job.title, fullName, email, phone, location || '',
      experience || '', currentCompany || '', noticePeriod || '', expectedSalary || '',
      linkedIn || '', github || '', portfolio || '', resumePath, resumeOriginalName,
      coverLetter || '', answersJson || '{}', appStatus, appWorkflow, currentStep || 'submitted',
      isDisqualified ? 1 : 0, isDisqualified ? (disqualificationReason || 'Did not meet minimum requirements') : null,
      score !== undefined && score !== null && score !== '' ? Number(score) : null,
      codeSubmission || null, codeLanguage || null, interviewSlotId || null, candidateAccountId || null
    ]);

    // Save auxiliary uploaded files
    for (const f of uploadedFiles) {
      await run(`
        INSERT INTO application_files (
          application_id, file_type, file_name, original_name, file_path, file_size, mime_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        applicationId, f.type, f.filename, f.originalName, f.filename, f.size, f.mimetype
      ]);
    }

    // Mark interview slot as booked
    if (interviewSlotId) {
      await run('UPDATE interview_slots SET is_booked = 1, booked_by_application_id = ? WHERE id = ?', [
        applicationId, interviewSlotId
      ]);
      await logApplicationEvent(applicationId, 'INTERVIEW_SLOT_SELECTED', { slotId: interviewSlotId });
    }

    // Log Workflow Specific Events
    await logApplicationEvent(applicationId, 'APPLICATION_STARTED', { jobCode: job.job_code, workflow: appWorkflow });

    if (resumePath) {
      await logApplicationEvent(applicationId, 'RESUME_UPLOADED', { filename: resumeOriginalName });
    }

    if (coverLetter) {
      await logApplicationEvent(applicationId, 'COVER_LETTER_SUBMITTED');
    }

    if (appWorkflow === 'mcq' || appWorkflow === 'technical') {
      await logApplicationEvent(applicationId, 'ASSESSMENT_COMPLETED', { score });
    }

    if (appWorkflow === 'coding') {
      await logApplicationEvent(applicationId, 'CODING_CHALLENGE_SUBMITTED', { language: codeLanguage });
    }

    if (appWorkflow === 'video') {
      await logApplicationEvent(applicationId, 'VIDEO_UPLOADED');
    }

    if (portfolio) {
      await logApplicationEvent(applicationId, 'PORTFOLIO_SUBMITTED', { portfolioUrl: portfolio });
    }

    if (isDisqualified) {
      await logApplicationEvent(applicationId, 'APPLICATION_DISQUALIFIED', { reason: disqualificationReason });
    } else {
      await logApplicationEvent(applicationId, 'APPLICATION_SUBMITTED', { status: appStatus });
    }

    if (appWorkflow === 'external' || appWorkflow === 'external_portal') {
      await logApplicationEvent(applicationId, 'EXTERNAL_APPLICATION_COMPLETED');
    }

    res.status(201).json({
      success: true,
      message: isDisqualified
        ? 'Thank you for your interest. Based on the information provided, you do not currently meet the minimum requirements for this position.'
        : 'Application submitted successfully',
      data: {
        applicationId,
        referenceNumber: applicationId,
        jobTitle: job.title,
        jobCode: job.job_code,
        candidate: fullName,
        status: appStatus,
        disqualified: isDisqualified,
        submittedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error processing job application:', err);
    res.status(500).json({ success: false, error: 'Failed to submit application. Please try again.' });
  }
};

// POST /api/candidate/register (for QA Lead registration workflow)
exports.registerCandidate = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
    }

    const existing = await get('SELECT id FROM candidate_accounts WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await run(`
      INSERT INTO candidate_accounts (full_name, email, password_hash, phone)
      VALUES (?, ?, ?, ?)
    `, [fullName, email, passwordHash, phone || '']);

    const token = jwt.sign(
      { id: result.lastID, email, name: fullName, role: 'candidate' },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        id: result.lastID,
        fullName,
        email,
        token
      }
    });
  } catch (err) {
    console.error('Candidate registration error:', err);
    res.status(500).json({ success: false, error: 'Failed to register account.' });
  }
};

// POST /api/candidate/login (for QA Lead registration workflow)
exports.loginCandidate = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const account = await get('SELECT * FROM candidate_accounts WHERE email = ?', [email]);
    if (!account) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, account.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: account.id, email: account.email, name: account.full_name, role: 'candidate' },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: account.id,
        fullName: account.full_name,
        email: account.email,
        phone: account.phone,
        token
      }
    });
  } catch (err) {
    console.error('Candidate login error:', err);
    res.status(500).json({ success: false, error: 'Failed to log in.' });
  }
};

// GET /api/interview-slots (public list of available slots)
exports.getInterviewSlots = async (req, res) => {
  try {
    const slots = await query('SELECT id, slot_date, slot_time, is_booked FROM interview_slots ORDER BY slot_date ASC, slot_time ASC');
    res.json({ success: true, data: slots });
  } catch (err) {
    console.error('Error fetching interview slots:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch interview slots.' });
  }
};

// POST /api/application-events (public client tracking endpoint for real audit trail)
exports.logClientEvent = async (req, res) => {
  try {
    const { applicationId, eventType, metadata } = req.body;
    if (!applicationId || !eventType) {
      return res.status(400).json({ success: false, error: 'applicationId and eventType are required' });
    }

    await logApplicationEvent(applicationId, eventType, metadata);
    res.json({ success: true, message: 'Event logged' });
  } catch (err) {
    console.error('Error logging client event:', err);
    res.status(500).json({ success: false, error: 'Failed to log event' });
  }
};


// POST /api/trainer-applications (public with optional resume)
exports.applyTrainer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      primaryTech,
      experience,
      currentRole,
      linkedIn,
      portfolio,
      preferredTopics,
      availability,
      expectedCompensation,
      additionalInfo
    } = req.body;

    if (!name || !email || !phone || !primaryTech || !experience) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, phone, primary technology, and experience are required.'
      });
    }

    const applicationId = 'TRN-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    const resumePath = req.file ? req.file.filename : null;
    const resumeOriginalName = req.file ? req.file.originalname : null;

    await run(`
      INSERT INTO trainer_applications (
        applicationId, name, email, phone, location, primaryTech, experience,
        currentRole, linkedIn, portfolio, preferredTopics, availability,
        expectedCompensation, resumePath, resumeOriginalName, additionalInfo, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
    `, [
      applicationId, name, email, phone, location || '', primaryTech, experience,
      currentRole || '', linkedIn || '', portfolio || '', preferredTopics || '',
      availability || '', expectedCompensation || '', resumePath, resumeOriginalName,
      additionalInfo || ''
    ]);

    res.status(201).json({
      success: true,
      message: 'Trainer application submitted successfully',
      data: {
        applicationId,
        name
      }
    });
  } catch (err) {
    console.error('Error applying as trainer:', err);
    res.status(500).json({ success: false, error: 'Failed to submit trainer application.' });
  }
};
