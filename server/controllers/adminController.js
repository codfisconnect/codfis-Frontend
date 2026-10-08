const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { query, get, run } = require('../database');
const config = require('../config');

// POST /api/admin/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const admin = await get('SELECT * FROM admins WHERE username = ?', [username]);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
};

// GET /api/admin/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const projectEnquiriesCount = await get('SELECT COUNT(*) as count FROM project_enquiries');
    const contactMessagesCount = await get('SELECT COUNT(*) as count FROM contacts');
    const jobApplicationsCount = await get('SELECT COUNT(*) as count FROM job_applications');
    const trainerApplicationsCount = await get('SELECT COUNT(*) as count FROM trainer_applications');
    const activeJobsCount = await get('SELECT COUNT(*) as count FROM jobs WHERE active = 1');
    const totalJobsCount = await get('SELECT COUNT(*) as count FROM jobs');

    const recentProjects = await query('SELECT * FROM project_enquiries ORDER BY id DESC LIMIT 5');
    const recentApplications = await query('SELECT id, applicationId, jobTitle, fullName, email, status, createdAt FROM job_applications ORDER BY id DESC LIMIT 5');

    res.json({
      success: true,
      stats: {
        projectEnquiries: projectEnquiriesCount.count,
        contactMessages: contactMessagesCount.count,
        jobApplications: jobApplicationsCount.count,
        trainerApplications: trainerApplicationsCount.count,
        activeJobs: activeJobsCount.count,
        totalJobs: totalJobsCount.count
      },
      recentProjects,
      recentApplications
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
};

// --- JOBS CRUD ---
exports.getAllJobsAdmin = async (req, res) => {
  try {
    const jobs = await query('SELECT * FROM jobs ORDER BY id DESC');
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const {
      title, department, location, workMode, employmentType,
      experience, salary, description, requirements, skills, applicationType,
      job_code, workflow_type, qualification, notice_period, summary,
      responsibilities, required_skills, preferred_skills, posted_at, application_deadline
    } = req.body;

    if (!title || !department || !description) {
      return res.status(400).json({ success: false, error: 'Title, department, and description are required.' });
    }

    const code = job_code || `COD-${(department || 'GEN').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const postDate = posted_at || new Date().toISOString();

    const result = await run(`
      INSERT INTO jobs (
        title, department, location, workMode, employmentType,
        experience, salary, description, requirements, skills, applicationType,
        job_code, workflow_type, qualification, notice_period, summary,
        responsibilities, required_skills, preferred_skills, posted_at, application_deadline, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      title,
      department,
      location || 'Chennai, India',
      workMode || 'Hybrid',
      employmentType || 'Full-time',
      experience || '2+ years',
      salary || 'Competitive',
      description,
      requirements || '',
      skills || required_skills || '',
      applicationType || 'resume',
      code,
      workflow_type || 'simple',
      qualification || 'Bachelor’s degree in Computer Science, IT, or related discipline',
      notice_period || 'Immediate to 30 days',
      summary || description.substring(0, 200),
      responsibilities || requirements || '',
      required_skills || skills || '',
      preferred_skills || '',
      postDate,
      application_deadline || null
    ]);

    const newJob = await get('SELECT * FROM jobs WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Job created successfully', data: newJob });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const {
      title, department, location, workMode, employmentType,
      experience, salary, description, requirements, skills, applicationType, active,
      job_code, workflow_type, qualification, notice_period, summary,
      responsibilities, required_skills, preferred_skills, posted_at, application_deadline
    } = req.body;

    const existing = await get('SELECT * FROM jobs WHERE id = ?', [jobId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await run(`
      UPDATE jobs SET
        title = ?, department = ?, location = ?, workMode = ?,
        employmentType = ?, experience = ?, salary = ?, description = ?,
        requirements = ?, skills = ?, applicationType = ?,
        job_code = ?, workflow_type = ?, qualification = ?, notice_period = ?, summary = ?,
        responsibilities = ?, required_skills = ?, preferred_skills = ?, posted_at = ?, application_deadline = ?,
        active = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title ?? existing.title,
      department ?? existing.department,
      location ?? existing.location,
      workMode ?? existing.workMode,
      employmentType ?? existing.employmentType,
      experience ?? existing.experience,
      salary ?? existing.salary,
      description ?? existing.description,
      requirements ?? existing.requirements,
      skills ?? existing.skills,
      applicationType ?? existing.applicationType,
      job_code ?? existing.job_code,
      workflow_type ?? existing.workflow_type,
      qualification ?? existing.qualification,
      notice_period ?? existing.notice_period,
      summary ?? existing.summary,
      responsibilities ?? existing.responsibilities,
      required_skills ?? existing.required_skills,
      preferred_skills ?? existing.preferred_skills,
      posted_at ?? existing.posted_at,
      application_deadline ?? existing.application_deadline,
      active !== undefined ? (active ? 1 : 0) : existing.active,
      jobId
    ]);

    const updated = await get('SELECT * FROM jobs WHERE id = ?', [jobId]);
    res.json({ success: true, message: 'Job updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    await run('DELETE FROM jobs WHERE id = ?', [jobId]);
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- APPLICATIONS ---
exports.getAllApplications = async (req, res) => {
  try {
    const { search, status, jobCode, workflowType } = req.query;
    let sql = 'SELECT * FROM job_applications WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ' AND (fullName LIKE ? OR email LIKE ? OR applicationId LIKE ? OR jobTitle LIKE ?)';
      params.push(q, q, q, q);
    }

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (workflowType && workflowType !== 'All') {
      sql += ' AND workflow_type = ?';
      params.push(workflowType);
    }

    sql += ' ORDER BY id DESC';
    const applications = await query(sql, params);
    res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/applications/:id (Detailed application view with answers, files, events)
exports.getApplicationById = async (req, res) => {
  try {
    const id = req.params.id;
    const application = await get('SELECT * FROM job_applications WHERE id = ? OR applicationId = ?', [id, id]);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Associated job details
    const job = await get('SELECT * FROM jobs WHERE id = ?', [application.jobId]);

    // Associated files
    const files = await query('SELECT * FROM application_files WHERE application_id = ? ORDER BY id ASC', [application.applicationId]);

    // Associated events
    const events = await query('SELECT * FROM application_events WHERE application_id = ? ORDER BY id ASC', [application.applicationId]);

    // Associated interview slot if any
    let interviewSlot = null;
    if (application.interview_slot_id) {
      interviewSlot = await get('SELECT * FROM interview_slots WHERE id = ?', [application.interview_slot_id]);
    }

    // Associated candidate account if any
    let candidateAccount = null;
    if (application.candidate_account_id) {
      candidateAccount = await get('SELECT id, full_name, email, phone, created_at FROM candidate_accounts WHERE id = ?', [application.candidate_account_id]);
    }

    res.json({
      success: true,
      data: {
        ...application,
        job,
        files,
        events,
        interviewSlot,
        candidateAccount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'Applied', 'Under Review', 'Screening', 'Shortlisted', 'Interview', 'Interview Scheduled', 'Selected', 'Rejected', 'Disqualified'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid application status value' });
    }

    await run('UPDATE job_applications SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? OR applicationId = ?', [
      status,
      req.params.id,
      req.params.id
    ]);

    // Log status change event
    const appRecord = await get('SELECT applicationId FROM job_applications WHERE id = ? OR applicationId = ?', [req.params.id, req.params.id]);
    if (appRecord) {
      await run('INSERT INTO application_events (application_id, event_type, metadata) VALUES (?, ?, ?)', [
        appRecord.applicationId,
        'STATUS_UPDATED',
        JSON.stringify({ newStatus: status })
      ]);
    }

    res.json({ success: true, message: `Application status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Secure Resume / Document / Video Download
exports.downloadResume = async (req, res) => {
  try {
    const id = req.params.id;
    const type = req.query.type || 'job'; // 'job', 'trainer', 'file'

    let record = null;
    let targetDir = path.join(config.uploadDir, 'resumes');
    let filename = null;
    let originalName = null;

    if (type === 'trainer') {
      record = await get('SELECT resumePath, resumeOriginalName FROM trainer_applications WHERE id = ?', [id]);
      if (record) {
        filename = record.resumePath;
        originalName = record.resumeOriginalName;
      }
    } else if (type === 'file') {
      record = await get('SELECT file_name, original_name, mime_type FROM application_files WHERE id = ?', [id]);
      if (record) {
        filename = record.file_name;
        originalName = record.original_name;
        if (record.mime_type && record.mime_type.startsWith('video/')) {
          targetDir = path.join(config.uploadDir, 'videos');
        }
      }
    } else {
      record = await get('SELECT resumePath, resumeOriginalName FROM job_applications WHERE id = ? OR applicationId = ?', [id, id]);
      if (record) {
        filename = record.resumePath;
        originalName = record.resumeOriginalName;
      }
    }

    if (!record || !filename) {
      return res.status(404).json({ success: false, error: 'Requested file record not found' });
    }

    // Path traversal check
    const safeFilename = path.basename(filename);
    let fullPath = path.join(targetDir, safeFilename);

    if (!fs.existsSync(fullPath)) {
      // Check in videos directory as fallback
      const videoPath = path.join(config.uploadDir, 'videos', safeFilename);
      if (fs.existsSync(videoPath)) {
        fullPath = videoPath;
      } else {
        return res.status(404).json({ success: false, error: 'File does not exist on disk' });
      }
    }

    res.download(fullPath, originalName || safeFilename);
  } catch (err) {
    console.error('Download resume error:', err);
    res.status(500).json({ success: false, error: 'Error downloading file' });
  }
};

// --- TRAINER APPLICATIONS ---
exports.getAllTrainerApplications = async (req, res) => {
  try {
    const apps = await query('SELECT * FROM trainer_applications ORDER BY id DESC');
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateTrainerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await run('UPDATE trainer_applications SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [
      status,
      req.params.id
    ]);
    res.json({ success: true, message: 'Trainer application status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- CONTACTS ---
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await query('SELECT * FROM contacts ORDER BY id DESC');
    res.json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await run('UPDATE contacts SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Contact status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- PROJECT ENQUIRIES ---
exports.getAllProjectEnquiries = async (req, res) => {
  try {
    const enquiries = await query('SELECT * FROM project_enquiries ORDER BY id DESC');
    res.json({ success: true, data: enquiries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await run('UPDATE project_enquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Project enquiry status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
