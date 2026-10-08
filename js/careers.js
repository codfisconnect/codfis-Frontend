/**
 * Codfis Technologies V2 - Careers & Multi-Workflow Recruitment Engine
 * Implements 20 realistic application workflows with semantic forms,
 * dynamic freshness timestamps, and full event tracking.
 */

// Global state
let allJobs = [];
let filteredJobs = [];
let currentSelectedJob = null;
let currentWorkflowState = {};

// Helper: Calculate dynamic relative time from ISO timestamp
function calculateRelativeTime(isoDateStr) {
  if (!isoDateStr) return 'Recently';
  const postDate = new Date(isoDateStr);
  const now = new Date();

  // Normalize to local day boundaries
  const postDay = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((nowDay - postDay) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  return `Posted ${diffDays} days ago`;
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Log application event to backend
async function logClientAppEvent(applicationId, eventType, metadata = null) {
  try {
    await fetch('/api/application-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, eventType, metadata })
    });
  } catch (e) {
    // Non-blocking telemetry
  }
}

// Load and filter jobs from backend
async function loadJobs() {
  const loadingEl = document.getElementById('jobLoading');
  const listEl = document.getElementById('jobList');
  const emptyEl = document.getElementById('jobEmpty');
  const countBadge = document.getElementById('jobCountBadge');

  if (loadingEl) loadingEl.style.display = 'block';
  if (listEl) listEl.style.display = 'none';
  if (emptyEl) emptyEl.style.display = 'none';

  const search = document.getElementById('jobSearch')?.value.trim() || '';
  const department = document.getElementById('departmentFilter')?.value || 'All';
  const experience = document.getElementById('experienceFilter')?.value || 'All';
  const location = document.getElementById('locationFilter')?.value || 'All';
  const workMode = document.getElementById('workModeFilter')?.value || 'All';
  const employmentType = document.getElementById('employmentTypeFilter')?.value || 'All';
  const postedDate = document.getElementById('postedDateFilter')?.value || 'All';
  const sort = document.getElementById('jobSortSelect')?.value || 'newest';

  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department !== 'All') params.append('department', department);
    if (experience !== 'All') params.append('experience', experience);
    if (location !== 'All') params.append('location', location);
    if (workMode !== 'All') params.append('workMode', workMode);
    if (employmentType !== 'All') params.append('employmentType', employmentType);
    if (postedDate !== 'All') params.append('postedDate', postedDate);
    params.append('sort', sort);

    const res = await fetch(`/api/jobs?${params.toString()}`);
    const data = await res.json();

    if (loadingEl) loadingEl.style.display = 'none';

    if (data.success && data.data.length > 0) {
      allJobs = data.data;
      if (countBadge) countBadge.textContent = `${allJobs.length} OPEN POSITIONS`;
      renderJobs(allJobs);
      if (listEl) listEl.style.display = 'flex';
    } else {
      if (countBadge) countBadge.textContent = `0 OPEN POSITIONS`;
      if (emptyEl) emptyEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Error loading jobs:', err);
    if (loadingEl) loadingEl.textContent = 'Failed to load open positions. Please try refreshing.';
  }
}

// Render Job Cards
function renderJobs(jobs) {
  const listEl = document.getElementById('jobList');
  if (!listEl) return;

  listEl.innerHTML = jobs.map(job => {
    const relativeTime = calculateRelativeTime(job.posted_at);
    const deadlineNotice = job.application_deadline ? ` | Deadline: ${job.application_deadline}` : '';

    return `
      <div class="job-card" id="job-card-${job.id}" onclick="openJobDetailsModal(${job.id})">
        <div class="job-card-header">
          <div>
            <div class="job-badges">
              <span class="badge badge-yellow">${escapeHtml(job.department)}</span>
              <span class="badge badge-dark" style="font-family: monospace;">${escapeHtml(job.job_code || '')}</span>
            </div>
            <h3 class="job-card-title">${escapeHtml(job.title)}</h3>
          </div>
          <button class="btn btn-primary btn-sm view-pos-btn" onclick="event.stopPropagation(); openJobDetailsModal(${job.id});">
            View Position →
          </button>
        </div>

        <div class="job-meta">
          <span>📍 ${escapeHtml(job.location)}</span>
          <span>💼 ${escapeHtml(job.work_mode || job.workMode)}</span>
          <span>⏱️ ${escapeHtml(job.experience)}</span>
          <span>💼 ${escapeHtml(job.employment_type || job.employmentType || 'Full-time')}</span>
          <span class="posted-tag">🕒 ${relativeTime}</span>
        </div>

        <p class="job-summary">${escapeHtml(job.summary || job.description.substring(0, 160) + '...')}</p>

        <div class="job-card-footer">
          <div class="job-skills-pills">
            ${(job.required_skills || job.skills || '').split(',').slice(0, 4).map(s => `<span class="skill-pill">${escapeHtml(s.trim())}</span>`).join('')}
          </div>
          <span class="salary-tag">${escapeHtml(job.salary || 'Competitive')}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Open Job Details Modal
async function openJobDetailsModal(jobId) {
  currentSelectedJob = allJobs.find(j => j.id === jobId);
  if (!currentSelectedJob) return;

  // Log JOB_VIEWED
  logClientAppEvent(currentSelectedJob.job_code || `JOB-${currentSelectedJob.id}`, 'JOB_VIEWED', {
    jobId: currentSelectedJob.id,
    title: currentSelectedJob.title
  });

  const modal = document.getElementById('jobModal');
  const detailView = document.getElementById('jobDetailView');
  const formView = document.getElementById('jobFormView');
  const confirmView = document.getElementById('jobConfirmationView');

  detailView.style.display = 'block';
  formView.style.display = 'none';
  if (confirmView) confirmView.style.display = 'none';

  // Populate details
  document.getElementById('modalDeptBadge').textContent = currentSelectedJob.department;
  document.getElementById('modalJobCode').textContent = currentSelectedJob.job_code || '';
  document.getElementById('modalJobTitle').textContent = currentSelectedJob.title;

  document.getElementById('modalJobMeta').innerHTML = `
    <span>📍 ${escapeHtml(currentSelectedJob.location)}</span>
    <span>💼 ${escapeHtml(currentSelectedJob.work_mode || currentSelectedJob.workMode)}</span>
    <span>⏱️ ${escapeHtml(currentSelectedJob.experience)}</span>
    <span>💼 ${escapeHtml(currentSelectedJob.employment_type || currentSelectedJob.employmentType)}</span>
    <span>💰 ${escapeHtml(currentSelectedJob.salary || 'Competitive')}</span>
    <span>🕒 ${calculateRelativeTime(currentSelectedJob.posted_at)}</span>
    ${currentSelectedJob.application_deadline ? `<span>📅 Apply by: ${escapeHtml(currentSelectedJob.application_deadline)}</span>` : ''}
  `;

  document.getElementById('modalAboutRole').textContent = currentSelectedJob.description;

  // Format responsibilities as bullet list
  const respEl = document.getElementById('modalResponsibilities');
  const respLines = (currentSelectedJob.responsibilities || currentSelectedJob.requirements || '').split('\n').filter(l => l.trim().length > 0);
  respEl.innerHTML = respLines.map(line => `<li>${escapeHtml(line.replace(/^[•\-\*]\s*/, ''))}</li>`).join('');

  document.getElementById('modalRequiredSkills').textContent = currentSelectedJob.required_skills || currentSelectedJob.skills || 'Relevant technical competencies.';
  document.getElementById('modalGoodToHave').textContent = currentSelectedJob.preferred_skills || 'Agile teamwork, strong problem-solving, and continuous learning.';
  document.getElementById('modalQualification').textContent = currentSelectedJob.qualification || 'Bachelor’s degree in Computer Science, IT, or related field.';
  document.getElementById('modalNoticePeriod').textContent = currentSelectedJob.notice_period || 'Immediate to 30 days';

  modal.classList.add('active');
}

function closeJobModal() {
  document.getElementById('jobModal').classList.remove('active');
  currentWorkflowState = {};
}

// Switch to Application Form View
function showJobApplicationForm() {
  document.getElementById('jobDetailView').style.display = 'none';
  const formView = document.getElementById('jobFormView');
  formView.style.display = 'block';

  document.getElementById('formApplyingForJob').textContent = currentSelectedJob.title;
  document.getElementById('formApplyingForCode').textContent = currentSelectedJob.job_code;

  renderWorkflowForm(currentSelectedJob);

  // Log APPLICATION_STARTED
  logClientAppEvent(currentSelectedJob.job_code, 'APPLICATION_STARTED', {
    workflow: currentSelectedJob.workflow_type,
    jobTitle: currentSelectedJob.title
  });
}

function backToJobDetails() {
  document.getElementById('jobFormView').style.display = 'none';
  document.getElementById('jobDetailView').style.display = 'block';
}

/**
 * ============================================================
 * 20 WORKFLOW BUILDER
 * Generates tailored semantic forms based on job.workflow_type
 * ============================================================
 */
async function renderWorkflowForm(job) {
  const container = document.getElementById('dynamicWorkflowContainer');
  const workflowType = job.workflow_type || 'simple';
  currentWorkflowState = { workflowType, step: 1, answers: {}, files: {} };

  let html = '';

  switch (workflowType) {
    // ----------------------------------------------------
    // JOB 1: Simple Application
    // ----------------------------------------------------
    case 'simple':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="e.g. John Doe">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="john.doe@example.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_location">Current Location <span class="required">*</span></label>
            <input type="text" id="wf_location" name="location" class="form-control" required placeholder="e.g. Chennai, India">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_experience">Relevant Experience <span class="required">*</span></label>
          <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 1.5 years in manual testing">
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume / CV (PDF, DOC, DOCX up to 10MB) <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 2: Screening Questions
    // ----------------------------------------------------
    case 'screening':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_location">Current Location <span class="required">*</span></label>
            <input type="text" id="wf_location" name="location" class="form-control" required placeholder="City / State">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">Role Screening Questions</h4>
          
          <div class="form-group">
            <label class="form-label" for="q1">1. Years of automation testing experience? <span class="required">*</span></label>
            <input type="text" id="q1" name="q_automation_exp" class="form-control" required placeholder="e.g. 2.5 years">
          </div>
          <div class="form-group">
            <label class="form-label" for="q2">2. Years of Playwright experience? <span class="required">*</span></label>
            <input type="text" id="q2" name="q_playwright_exp" class="form-control" required placeholder="e.g. 1.5 years">
          </div>
          <div class="form-group">
            <label class="form-label" for="q3">3. JavaScript / TypeScript experience level? <span class="required">*</span></label>
            <select id="q3" name="q_js_ts_exp" class="form-select" required>
              <option value="">Select proficiency</option>
              <option value="Beginner">Beginner (Basic scripting)</option>
              <option value="Intermediate">Intermediate (Framework design, async/await, fixtures)</option>
              <option value="Advanced">Advanced (TypeScript strict mode, custom runners, CI hooks)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="q4">4. CI/CD pipeline integration experience? <span class="required">*</span></label>
            <input type="text" id="q4" name="q_cicd_exp" class="form-control" required placeholder="e.g. GitHub Actions, GitLab CI, Jenkins">
          </div>
          <div class="form-group">
            <label class="form-label" for="q5">5. Notice period? <span class="required">*</span></label>
            <input type="text" id="q5" name="noticePeriod" class="form-control" required placeholder="e.g. Immediate / 15 days / 30 days">
          </div>
          <div class="form-group">
            <label class="form-label" for="q6">6. Expected Salary / CTC? <span class="required">*</span></label>
            <input type="text" id="q6" name="expectedSalary" class="form-control" required placeholder="e.g. ₹8 LPA">
          </div>
          <div class="form-group">
            <label class="form-label">7. Willing to work from Chennai office (Hybrid)? <span class="required">*</span></label>
            <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
              <label><input type="radio" name="q_willing_chennai" value="Yes" required> Yes</label>
              <label><input type="radio" name="q_willing_chennai" value="No" required> No</label>
            </div>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 3: MCQ Assessment (Selenium Automation)
    // ----------------------------------------------------
    case 'mcq':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Technical MCQ Assessment</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Please answer these 5 core Selenium WebDriver questions. Your score is evaluated server-side.
          </p>

          <div class="mcq-question-card">
            <p><strong>Q1:</strong> Which locator strategy is generally the most performant and reliable when an element has a unique ID?</p>
            <label class="mcq-option"><input type="radio" name="mcq_q1" value="A" required> A. XPath (//input[@id='val'])</label>
            <label class="mcq-option"><input type="radio" name="mcq_q1" value="B"> B. By.id</label>
            <label class="mcq-option"><input type="radio" name="mcq_q1" value="C"> C. By.className</label>
            <label class="mcq-option"><input type="radio" name="mcq_q1" value="D"> D. By.tagName</label>
          </div>

          <div class="mcq-question-card">
            <p><strong>Q2:</strong> What is the primary difference between driver.close() and driver.quit() in Selenium?</p>
            <label class="mcq-option"><input type="radio" name="mcq_q2" value="A" required> A. driver.close() shuts the entire driver process; driver.quit() closes only the active tab</label>
            <label class="mcq-option"><input type="radio" name="mcq_q2" value="B"> B. driver.close() closes the current focused window; driver.quit() closes all windows and ends WebDriver session</label>
            <label class="mcq-option"><input type="radio" name="mcq_q2" value="C"> C. driver.quit() discards cookies without closing the browser</label>
            <label class="mcq-option"><input type="radio" name="mcq_q2" value="D"> D. They are completely identical in WebDriver 4</label>
          </div>

          <div class="mcq-question-card">
            <p><strong>Q3:</strong> In Page Object Model (POM), what is the recommended practice for test classes?</p>
            <label class="mcq-option"><input type="radio" name="mcq_q3" value="A" required> A. Test methods should not contain direct driver.findElement calls</label>
            <label class="mcq-option"><input type="radio" name="mcq_q3" value="B"> B. Page classes must hold all assertions (assertNotNull, assertEquals)</label>
            <label class="mcq-option"><input type="radio" name="mcq_q3" value="C"> C. Every web page must be instantiated in a single giant monolithic class</label>
            <label class="mcq-option"><input type="radio" name="mcq_q3" value="D"> D. Avoid using PageFactory or encapsulation</label>
          </div>

          <div class="mcq-question-card">
            <p><strong>Q4:</strong> What is the advantage of Explicit Wait over Implicit Wait?</p>
            <label class="mcq-option"><input type="radio" name="mcq_q4" value="A" required> A. Explicit Wait polls for specific conditions (ExpectedConditions) and resumes immediately upon resolution</label>
            <label class="mcq-option"><input type="radio" name="mcq_q4" value="B"> B. Explicit Wait freezes thread execution for exact hardcoded milliseconds</label>
            <label class="mcq-option"><input type="radio" name="mcq_q4" value="C"> C. Explicit Wait applies globally to all future findElement calls without configuration</label>
            <label class="mcq-option"><input type="radio" name="mcq_q4" value="D"> D. Explicit Wait ignores StaleElementReferenceException automatically</label>
          </div>

          <div class="mcq-question-card">
            <p><strong>Q5:</strong> Which SQL keyword is used to eliminate duplicate records from a query result set?</p>
            <label class="mcq-option"><input type="radio" name="mcq_q5" value="A" required> A. UNIQUE</label>
            <label class="mcq-option"><input type="radio" name="mcq_q5" value="B"> B. DISTINCT</label>
            <label class="mcq-option"><input type="radio" name="mcq_q5" value="C"> C. FILTER</label>
            <label class="mcq-option"><input type="radio" name="mcq_q5" value="D"> D. GROUP WITHOUT DUPLICATES</label>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 4: Technical Questions (Java Developer)
    // ----------------------------------------------------
    case 'technical':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">Java & Architecture Technical Assessment</h4>

          <div class="form-group">
            <label class="form-label" for="tech_q1">1. Explain the internal working of HashMap in Java (Buckets, hashing, collisions, treeify threshold): <span class="required">*</span></label>
            <textarea id="tech_q1" name="q_tech_hashmap" class="form-control" rows="3" required placeholder="Explain hashCode(), equals(), bucket indexes, and LinkedList to TreeNode transformation..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="tech_q2">2. How does Spring Boot manage dependency injection and bean lifecycle? <span class="required">*</span></label>
            <textarea id="tech_q2" name="q_tech_spring_ioc" class="form-control" rows="3" required placeholder="Explain ApplicationContext, @Component, @Autowired, BeanPostProcessor, etc."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="tech_q3">3. Difference between Optimistic and Pessimistic Locking in database transactions? <span class="required">*</span></label>
            <textarea id="tech_q3" name="q_tech_locking" class="form-control" rows="2" required placeholder="Explain version columns vs SELECT FOR UPDATE..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">4. Which HTTP status code should be returned when a resource creation succeeds with a response body? <span class="required">*</span></label>
            <select name="q_tech_http_status" class="form-select" required>
              <option value="">Select status</option>
              <option value="200 OK">200 OK</option>
              <option value="201 Created">201 Created</option>
              <option value="204 No Content">204 No Content</option>
              <option value="202 Accepted">202 Accepted</option>
            </select>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 5: Coding Challenge (Backend Developer)
    // ----------------------------------------------------
    case 'coding':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Technical Coding Challenge</h4>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
            <strong>Problem:</strong> Write a clean, optimal function to find duplicate numbers in an integer array and return them in ascending order without using excessive memory.
          </p>

          <div class="form-group">
            <label class="form-label" for="codeLanguage">Programming Language <span class="required">*</span></label>
            <select id="codeLanguage" name="codeLanguage" class="form-select" required onchange="updateCodingTemplate(this.value)">
              <option value="JavaScript">JavaScript (Node.js)</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Python">Python 3</option>
              <option value="Java">Java</option>
              <option value="Go">Go</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="codeSubmission">Your Code Solution <span class="required">*</span></label>
            <textarea id="codeSubmission" name="codeSubmission" class="form-control code-editor-box" rows="10" required spellcheck="false">// Find duplicates in array
function findDuplicates(nums) {
  const seen = new Set();
  const duplicates = new Set();
  for (const n of nums) {
    if (seen.has(n)) {
      duplicates.add(n);
    } else {
      seen.add(n);
    }
  }
  return Array.from(duplicates).sort((a, b) => a - b);
}
</textarea>
            <div class="form-help">Write production-quality code. Time & space complexity will be evaluated during review.</div>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 6: Long Form Application (Full Stack Developer)
    // ----------------------------------------------------
    case 'long_form':
      html = `
        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">1. Personal Information</h4>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
              <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
              <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
              <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_location">Location <span class="required">*</span></label>
              <input type="text" id="wf_location" name="location" class="form-control" required placeholder="City, Country">
            </div>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">2. Experience</h4>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_experience">Total Experience <span class="required">*</span></label>
              <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 4 years">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_notice">Notice Period <span class="required">*</span></label>
              <input type="text" id="wf_notice" name="noticePeriod" class="form-control" required placeholder="e.g. 30 days">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_currComp">Current Company</label>
              <input type="text" id="wf_currComp" name="currentCompany" class="form-control" placeholder="Current organization">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_prevComp">Previous Company</label>
              <input type="text" id="wf_prevComp" name="previousCompany" class="form-control" placeholder="Previous employer">
            </div>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">3. Technical Skills</h4>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="skill_frontend">Frontend Frameworks <span class="required">*</span></label>
              <input type="text" id="skill_frontend" name="skill_frontend" class="form-control" required placeholder="e.g. React, Next.js, Vue">
            </div>
            <div class="form-group">
              <label class="form-label" for="skill_backend">Backend Stacks <span class="required">*</span></label>
              <input type="text" id="skill_backend" name="skill_backend" class="form-control" required placeholder="e.g. Node.js, Express, Go, Java">
            </div>
          </div>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="skill_db">Databases</label>
              <input type="text" id="skill_db" name="skill_database" class="form-control" placeholder="PostgreSQL, MongoDB, Redis">
            </div>
            <div class="form-group">
              <label class="form-label" for="skill_cloud">Cloud / DevOps</label>
              <input type="text" id="skill_cloud" name="skill_cloud" class="form-control" placeholder="AWS, Docker, Kubernetes">
            </div>
            <div class="form-group">
              <label class="form-label" for="skill_testing">Testing</label>
              <input type="text" id="skill_testing" name="skill_testing" class="form-control" placeholder="Jest, Playwright, Cypress">
            </div>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">4. Featured Project</h4>
          <div class="form-group">
            <label class="form-label" for="project_name">Project Title</label>
            <input type="text" id="project_name" name="projectName" class="form-control" placeholder="e.g. Distributed Analytics Dashboard">
          </div>
          <div class="form-group">
            <label class="form-label" for="project_desc">Project Description & Architecture</label>
            <textarea id="project_desc" name="projectDescription" class="form-control" rows="2" placeholder="Key responsibilities and technical decisions..."></textarea>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="project_tech">Technologies Used</label>
              <input type="text" id="project_tech" name="projectTech" class="form-control" placeholder="TypeScript, React, Node, Kafka">
            </div>
            <div class="form-group">
              <label class="form-label" for="project_url">Project / Repo URL</label>
              <input type="url" id="project_url" name="projectUrl" class="form-control" placeholder="https://github.com/yourname/project">
            </div>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">5. Professional Profiles & Compensation</h4>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="wf_linkedin">LinkedIn URL</label>
              <input type="url" id="wf_linkedin" name="linkedIn" class="form-control" placeholder="https://linkedin.com/in/...">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_github">GitHub URL</label>
              <input type="url" id="wf_github" name="github" class="form-control" placeholder="https://github.com/...">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_portfolio">Portfolio / Website</label>
              <input type="url" id="wf_portfolio" name="portfolio" class="form-control" placeholder="https://yourdomain.com">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_currSalary">Current Salary / CTC</label>
              <input type="text" id="wf_currSalary" name="currentSalary" class="form-control" placeholder="e.g. ₹11 LPA">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_expSalary">Expected Salary / CTC <span class="required">*</span></label>
              <input type="text" id="wf_expSalary" name="expectedSalary" class="form-control" required placeholder="e.g. ₹15 LPA">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume / CV Document <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 7: Dropdown-Heavy Application (Data Analyst)
    // ----------------------------------------------------
    case 'dropdown':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="sel_location">Location Preference <span class="required">*</span></label>
            <select id="sel_location" name="location" class="form-select" required>
              <option value="">Select location</option>
              <option value="Chennai">Chennai, India</option>
              <option value="Bangalore">Bangalore, India</option>
              <option value="Hyderabad">Hyderabad, India</option>
              <option value="Remote (India)">Remote (India)</option>
            </select>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">Structured Profile Selection</h4>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="sel_exp">Total Experience <span class="required">*</span></label>
              <select id="sel_exp" name="experience" class="form-select" required>
                <option value="">Select experience level</option>
                <option value="1-2 Years">1–2 Years</option>
                <option value="2-3 Years">2–3 Years</option>
                <option value="3-5 Years">3–5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="sel_qual">Highest Qualification <span class="required">*</span></label>
              <select id="sel_qual" name="qualification" class="form-select" required>
                <option value="">Select qualification</option>
                <option value="B.Tech / B.E. (Computer Science / IT)">B.Tech / B.E. (Computer Science / IT)</option>
                <option value="B.Sc / BCA (Statistics / Mathematics / CS)">B.Sc / BCA (Statistics / Mathematics / CS)</option>
                <option value="M.Tech / MCA / M.Sc">M.Tech / MCA / M.Sc</option>
                <option value="Other Degree">Other Degree</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="sel_priSkill">Primary Analytics Tool <span class="required">*</span></label>
              <select id="sel_priSkill" name="primarySkill" class="form-select" required>
                <option value="">Select primary skill</option>
                <option value="SQL (Advanced queries, CTEs, Window functions)">SQL (Advanced queries, CTEs, Window functions)</option>
                <option value="Python (Pandas, NumPy, Scikit-learn)">Python (Pandas, NumPy, Scikit-learn)</option>
                <option value="Power BI (DAX, Data modeling)">Power BI (DAX, Data modeling)</option>
                <option value="Tableau (LOD calculations, Dashboards)">Tableau (LOD calculations, Dashboards)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="sel_secSkill">Secondary Skill <span class="required">*</span></label>
              <select id="sel_secSkill" name="secondarySkill" class="form-select" required>
                <option value="">Select secondary skill</option>
                <option value="Excel (VBA, Power Query, Macros)">Excel (VBA, Power Query, Macros)</option>
                <option value="Python Scripting">Python Scripting</option>
                <option value="ETL Pipelines">ETL Pipelines</option>
                <option value="Statistical Modeling">Statistical Modeling</option>
              </select>
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="sel_notice">Notice Period <span class="required">*</span></label>
              <select id="sel_notice" name="noticePeriod" class="form-select" required>
                <option value="">Select notice period</option>
                <option value="Immediate">Immediate</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="45 Days">45 Days</option>
                <option value="60+ Days">60+ Days</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="sel_empType">Employment Type <span class="required">*</span></label>
              <select id="sel_empType" name="employmentType" class="form-select" required>
                <option value="Full-time">Full-time Permanent</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="sel_salaryRange">Expected Salary Range <span class="required">*</span></label>
              <select id="sel_salaryRange" name="expectedSalary" class="form-select" required>
                <option value="">Select salary range</option>
                <option value="₹5 - 7 LPA">₹5 – 7 LPA</option>
                <option value="₹7 - 9 LPA">₹7 – 9 LPA</option>
                <option value="₹9 - 12 LPA">₹9 – 12 LPA</option>
                <option value="₹12+ LPA">₹12+ LPA</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 8: Resume + Cover Letter (Frontend Developer)
    // ----------------------------------------------------
    case 'resume_cover':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_experience">Frontend Experience <span class="required">*</span></label>
            <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 2 years (HTML/CSS/JS/React)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume / CV <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_coverLetter">Cover Letter / Statement of Motivation <span class="required">*</span></label>
          <textarea id="wf_coverLetter" name="coverLetter" class="form-control" rows="5" required placeholder="Tell us about why you care about UI performance, accessible design, and your background in building responsive user interfaces..."></textarea>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 9: Conditional Questions (AI QA Engineer)
    // ----------------------------------------------------
    case 'conditional':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 1rem; color: var(--accent);">Experience Assessment (Dynamic Form)</h4>

          <div class="form-group">
            <label class="form-label">Do you have hands-on Playwright automation experience? <span class="required">*</span></label>
            <div style="display: flex; gap: 2rem; margin-top: 0.5rem;">
              <label style="cursor: pointer;"><input type="radio" name="hasPlaywright" value="YES" onchange="handleConditionalPlaywright(true)" required> <strong>YES</strong></label>
              <label style="cursor: pointer;"><input type="radio" name="hasPlaywright" value="NO" onchange="handleConditionalPlaywright(false)" required> <strong>NO</strong></label>
            </div>
          </div>

          <!-- Branch 1: If YES -->
          <div id="playwrightYesBranch" style="display: none; padding-top: 1rem; border-top: 1px dashed var(--border);">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="pw_expYears">Years of Playwright Experience <span class="required">*</span></label>
                <input type="text" id="pw_expYears" name="pw_expYears" class="form-control" placeholder="e.g. 2 years">
              </div>
              <div class="form-group">
                <label class="form-label" for="pw_lang">Primary Language Used <span class="required">*</span></label>
                <select id="pw_lang" name="pw_language" class="form-select">
                  <option value="TypeScript">TypeScript</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java / C#</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="pw_projects">Playwright Automation Projects Built <span class="required">*</span></label>
              <textarea id="pw_projects" name="pw_projects" class="form-control" rows="2" placeholder="Describe the test suite structure, parallel execution, and reporters..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="pw_cicd">CI/CD Pipeline Experience <span class="required">*</span></label>
              <input type="text" id="pw_cicd" name="pw_cicd" class="form-control" placeholder="e.g. GitHub Actions with sharded test runs">
            </div>
          </div>

          <!-- Branch 2: If NO -->
          <div id="playwrightNoBranch" style="display: none; padding-top: 1rem; border-top: 1px dashed var(--border);">
            <div class="form-group">
              <label class="form-label">Are you willing to learn Playwright within your first month? <span class="required">*</span></label>
              <div style="display: flex; gap: 2rem; margin-top: 0.5rem;">
                <label style="cursor: pointer;"><input type="radio" name="willingToLearnPlaywright" value="YES"> Yes, enthusiastic to upskill</label>
                <label style="cursor: pointer;"><input type="radio" name="willingToLearnPlaywright" value="NO"> No</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="alt_testing_exp">What other automation or manual QA tools do you specialize in?</label>
              <input type="text" id="alt_testing_exp" name="alt_testing_tools" class="form-control" placeholder="e.g. Selenium, Cypress, Postman, JMeter">
            </div>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 10: Multi-Step Application (DevOps Engineer)
    // ----------------------------------------------------
    case 'multi_step':
      html = `
        <div class="wizard-progress-bar">
          <div class="wizard-step-node active" id="wizardNode1">1. Personal</div>
          <div class="wizard-step-node" id="wizardNode2">2. Experience</div>
          <div class="wizard-step-node" id="wizardNode3">3. Cloud Skills</div>
          <div class="wizard-step-node" id="wizardNode4">4. Certifications</div>
          <div class="wizard-step-node" id="wizardNode5">5. Resume</div>
          <div class="wizard-step-node" id="wizardNode6">6. Review</div>
        </div>

        <div id="wizardStep1" class="wizard-panel">
          <h4>Step 1: Personal Information</h4>
          <div class="form-grid-2" style="margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label" for="wz_name">Full Name <span class="required">*</span></label>
              <input type="text" id="wz_name" name="fullName" class="form-control" required placeholder="Full Name">
            </div>
            <div class="form-group">
              <label class="form-label" for="wz_email">Email <span class="required">*</span></label>
              <input type="email" id="wz_email" name="email" class="form-control" required placeholder="you@domain.com">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wz_phone">Phone <span class="required">*</span></label>
              <input type="tel" id="wz_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
            </div>
            <div class="form-group">
              <label class="form-label" for="wz_loc">Location <span class="required">*</span></label>
              <input type="text" id="wz_loc" name="location" class="form-control" required placeholder="Chennai / Remote">
            </div>
          </div>
        </div>

        <div id="wizardStep2" class="wizard-panel" style="display: none;">
          <h4>Step 2: Professional Experience</h4>
          <div class="form-grid-2" style="margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label" for="wz_exp">Total DevOps Experience <span class="required">*</span></label>
              <input type="text" id="wz_exp" name="experience" class="form-control" placeholder="e.g. 3.5 years">
            </div>
            <div class="form-group">
              <label class="form-label" for="wz_notice">Notice Period <span class="required">*</span></label>
              <input type="text" id="wz_notice" name="noticePeriod" class="form-control" placeholder="e.g. 30 days">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="wz_currentComp">Current Organization</label>
            <input type="text" id="wz_currentComp" name="currentCompany" class="form-control" placeholder="Current Employer">
          </div>
        </div>

        <div id="wizardStep3" class="wizard-panel" style="display: none;">
          <h4>Step 3: Cloud & DevOps Skills</h4>
          <div class="form-grid-2" style="margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label" for="wz_cloud">Cloud Platforms</label>
              <input type="text" id="wz_cloud" name="wz_cloud" class="form-control" placeholder="AWS, Azure, GCP">
            </div>
            <div class="form-group">
              <label class="form-label" for="wz_containers">Containers & Orchestration</label>
              <input type="text" id="wz_containers" name="wz_containers" class="form-control" placeholder="Docker, Kubernetes, Helm">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="wz_cicd">CI/CD Tools & IaC</label>
            <input type="text" id="wz_cicd" name="wz_cicd" class="form-control" placeholder="GitHub Actions, Jenkins, Terraform, Ansible">
          </div>
        </div>

        <div id="wizardStep4" class="wizard-panel" style="display: none;">
          <h4>Step 4: Certifications</h4>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="wz_certs">List relevant cloud/DevOps certifications</label>
            <input type="text" id="wz_certs" name="wz_certs" class="form-control" placeholder="e.g. AWS Certified Solutions Architect, CKA">
          </div>
        </div>

        <div id="wizardStep5" class="wizard-panel" style="display: none;">
          <h4>Step 5: Resume Upload</h4>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="wf_resume">Resume / CV <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
        </div>

        <div id="wizardStep6" class="wizard-panel" style="display: none;">
          <h4>Step 6: Review Application</h4>
          <div id="wizardSummaryContent" class="workflow-section-box" style="margin-top: 1rem;"></div>
        </div>

        <div class="wizard-nav-buttons" style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
          <button type="button" id="wizardPrevBtn" class="btn btn-secondary" onclick="wizardNavigate(-1)" style="display: none;">← Previous</button>
          <button type="button" id="wizardNextBtn" class="btn btn-primary" onclick="wizardNavigate(1)">Next Step →</button>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 11: Resume Parsing (React Developer)
    // ----------------------------------------------------
    case 'resume_parse':
      html = `
        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Step 1: Upload Resume for Data Extraction</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            Upload your resume document. Our parser will extract candidate details for your review before submission.
          </p>

          <div class="form-group">
            <label class="form-label" for="parseResumeInput">Select Resume (PDF or DOCX) <span class="required">*</span></label>
            <input type="file" id="parseResumeInput" name="resume" class="form-control" accept=".pdf,.doc,.docx" required onchange="simulateResumeParsing(this)">
          </div>
        </div>

        <div id="parseVerificationBox" style="display: none;" class="workflow-section-box">
          <div class="badge badge-yellow" style="margin-bottom: 0.5rem;">Data Extracted</div>
          <h4 style="margin-bottom: 0.5rem;">We found the following information in your resume. Please verify or edit:</h4>
          
          <div class="form-grid-2" style="margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
              <input type="text" id="wf_fullName" name="fullName" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
              <input type="email" id="wf_email" name="email" class="form-control" required>
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
              <input type="tel" id="wf_phone" name="phone" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_experience">Experience Extracted <span class="required">*</span></label>
              <input type="text" id="wf_experience" name="experience" class="form-control" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_skillsExtracted">Skills Found</label>
            <input type="text" id="wf_skillsExtracted" name="skills" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_education">Education</label>
            <input type="text" id="wf_education" name="qualification" class="form-control">
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 12: Knockout Questions (Business Analyst)
    // ----------------------------------------------------
    case 'knockout':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Mandatory Eligibility Criteria</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            Please answer honestly. These are mandatory qualifications for this position.
          </p>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">1. Are you legally authorized to work in India without sponsorship? <span class="required">*</span></label>
            <div style="display: flex; gap: 2rem; margin-top: 0.5rem;">
              <label><input type="radio" name="ko_auth_india" value="Yes" required> Yes</label>
              <label><input type="radio" name="ko_auth_india" value="No" required> No</label>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">2. Are you willing to work from our Chennai office under a hybrid model? <span class="required">*</span></label>
            <div style="display: flex; gap: 2rem; margin-top: 0.5rem;">
              <label><input type="radio" name="ko_loc_chennai" value="Yes" required> Yes</label>
              <label><input type="radio" name="ko_loc_chennai" value="No" required> No</label>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">3. Can you join Codfis within 30 days if offered? <span class="required">*</span></label>
            <div style="display: flex; gap: 2rem; margin-top: 0.5rem;">
              <label><input type="radio" name="ko_notice_30d" value="Yes" required> Yes</label>
              <label><input type="radio" name="ko_notice_30d" value="No" required> No</label>
            </div>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 13: Video Introduction (HR Executive)
    // ----------------------------------------------------
    case 'video':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_experience">HR Experience <span class="required">*</span></label>
            <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 2 years in talent acquisition">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume / CV Document <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Video Introduction (1–2 minutes)</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            Please record or upload a brief video introduction highlighting your recruitment philosophy and interpersonal communication skills. Allowed formats: MP4, MOV, WebM (up to 50MB).
          </p>
          <div class="form-group">
            <label class="form-label" for="wf_video">Upload Video File <span class="required">*</span></label>
            <input type="file" id="wf_video" name="video" class="form-control" accept=".mp4,.mov,.webm" required>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 14: External-Style Application (Python Developer)
    // ----------------------------------------------------
    case 'external':
      html = `
        <div class="external-portal-banner">
          <div>
            <span class="badge badge-yellow">Codfis Dedicated Application Portal</span>
            <h4 style="margin-top: 0.5rem;">Python Developer Application Flow</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              You are applying directly through Codfis's streamlined portal with instant tracking.
            </p>
          </div>
        </div>

        <div class="form-grid-2" style="margin-top: 1rem;">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_pyExp">Python Experience <span class="required">*</span></label>
            <input type="text" id="wf_pyExp" name="experience" class="form-control" required placeholder="e.g. 2 years (FastAPI, Django)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume / CV <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_github">GitHub Profile / Python Repositories</label>
          <input type="url" id="wf_github" name="github" class="form-control" placeholder="https://github.com/username">
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 15: External-Style Job Portal Application (Java Backend Developer)
    // ----------------------------------------------------
    case 'external_portal':
      html = `
        <div class="external-portal-banner" style="border-left: 4px solid #38bdf8;">
          <div>
            <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
              Codfis Enterprise Talent Gateway
            </span>
            <h4 style="margin-top: 0.5rem;">Senior Java Backend Opening (Reference: COD-DEV-007)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Enterprise candidate ingestion flow: Profile &gt; Microservices Stack &gt; Architecture History.
            </p>
          </div>
        </div>

        <div class="workflow-section-box" style="margin-top: 1rem;">
          <h4 style="margin-bottom: 0.75rem; color: #38bdf8;">Step 1: Identity & Credentials</h4>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
              <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_email">Professional Email <span class="required">*</span></label>
              <input type="email" id="wf_email" name="email" class="form-control" required placeholder="name@company.com">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_phone">Contact Phone <span class="required">*</span></label>
              <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_experience">Total Backend Years <span class="required">*</span></label>
              <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 5.5 years">
            </div>
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.75rem; color: #38bdf8;">Step 2: Technical Architecture Profile</h4>
          <div class="form-group">
            <label class="form-label" for="wf_microservices">Microservices & Messaging Systems Experience <span class="required">*</span></label>
            <input type="text" id="wf_microservices" name="microservicesExp" class="form-control" required placeholder="e.g. Kafka, RabbitMQ, Spring Cloud, gRPC">
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_currSalary">Current Package</label>
              <input type="text" id="wf_currSalary" name="currentSalary" class="form-control" placeholder="e.g. ₹16 LPA">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_expectedSalary">Expected Package <span class="required">*</span></label>
              <input type="text" id="wf_expectedSalary" name="expectedSalary" class="form-control" required placeholder="e.g. ₹22 LPA">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume / Comprehensive Dossier <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 16: Candidate Registration Before Application (QA Lead)
    // ----------------------------------------------------
    case 'registration':
      html = `
        <div id="candidateAuthBox" class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Candidate Account Required</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            For leadership positions, please create a candidate profile or log in to submit your credentials securely.
          </p>

          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <button type="button" class="btn btn-primary btn-sm" id="btnShowRegister" onclick="toggleAuthTab('register')">Register New Account</button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnShowLogin" onclick="toggleAuthTab('login')">Log In to Existing Account</button>
          </div>

          <div id="authAlert" class="alert"></div>

          <!-- Register Sub-form -->
          <div id="authRegisterPanel">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="reg_fullName">Full Name <span class="required">*</span></label>
                <input type="text" id="reg_fullName" class="form-control" placeholder="Full Name">
              </div>
              <div class="form-group">
                <label class="form-label" for="reg_email">Email <span class="required">*</span></label>
                <input type="email" id="reg_email" class="form-control" placeholder="you@domain.com">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="reg_password">Password (hashed securely) <span class="required">*</span></label>
                <input type="password" id="reg_password" class="form-control" placeholder="Choose a secure password">
              </div>
              <div class="form-group">
                <label class="form-label" for="reg_phone">Phone</label>
                <input type="tel" id="reg_phone" class="form-control" placeholder="+91 9876543210">
              </div>
            </div>
            <button type="button" class="btn btn-primary" onclick="handleCandidateRegister()">Create Account & Continue →</button>
          </div>

          <!-- Login Sub-form -->
          <div id="authLoginPanel" style="display: none;">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="log_email">Email <span class="required">*</span></label>
                <input type="email" id="log_email" class="form-control" placeholder="you@domain.com">
              </div>
              <div class="form-group">
                <label class="form-label" for="log_password">Password <span class="required">*</span></label>
                <input type="password" id="log_password" class="form-control" placeholder="Password">
              </div>
            </div>
            <button type="button" class="btn btn-primary" onclick="handleCandidateLogin()">Log In & Continue →</button>
          </div>
        </div>

        <!-- Post-Auth Application Details -->
        <div id="candidateApplicationDetails" style="display: none;">
          <div class="badge badge-yellow" id="authBadgeUser" style="margin-bottom: 1rem;">Logged in as: -</div>
          <input type="hidden" id="candidateAccountId" name="candidateAccountId">
          
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
              <input type="text" id="wf_fullName" name="fullName" class="form-control" required readonly>
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_email">Email <span class="required">*</span></label>
              <input type="email" id="wf_email" name="email" class="form-control" required readonly>
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_phone">Phone <span class="required">*</span></label>
              <input type="tel" id="wf_phone" name="phone" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_experience">QA Leadership Experience <span class="required">*</span></label>
              <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 6 years (team lead for 12 QA engineers)">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_notice">Notice Period <span class="required">*</span></label>
              <input type="text" id="wf_notice" name="noticePeriod" class="form-control" required placeholder="e.g. 30 days">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_salary">Salary Expectations <span class="required">*</span></label>
              <input type="text" id="wf_salary" name="expectedSalary" class="form-control" required placeholder="e.g. ₹20 LPA">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_resume">Resume / CV <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 17: Multiple File Uploads (Data Engineer)
    // ----------------------------------------------------
    case 'multiple_upload':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_experience">Data Engineering Experience <span class="required">*</span></label>
            <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 3 years (Spark, Airflow, SQL)">
          </div>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Required Document Dossier</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            Please attach your resume and technical project document or pipeline architectural diagram.
          </p>

          <div class="form-group">
            <label class="form-label" for="wf_resume">1. Resume / CV <span class="required">*</span> (PDF, DOCX)</label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="wf_projectDoc">2. Project / Architecture Supporting Document <span class="required">*</span> (PDF, ZIP, DOCX)</label>
            <input type="file" id="wf_projectDoc" name="project_doc" class="form-control" accept=".pdf,.docx,.zip" required>
            <div class="form-help">Pipeline design, Spark job summary, or schema documentation.</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="wf_workSample">3. Additional Work Sample / Code Snippets (Optional)</label>
            <input type="file" id="wf_workSample" name="work_sample" class="form-control" accept=".pdf,.zip,.png,.jpg">
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 18: Interview Slot Selection (Software Engineer)
    // ----------------------------------------------------
    case 'interview_slot':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_experience">Experience <span class="required">*</span></label>
            <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 4 years">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Schedule Preliminary Technical Screening</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            Select an available 30-minute interview discussion slot. Booked slots cannot be double-booked.
          </p>

          <input type="hidden" id="selectedInterviewSlotId" name="interviewSlotId" required>
          <div id="slotsContainer" class="slots-grid">
            <div style="color: var(--text-dim);">Loading available interview slots...</div>
          </div>
        </div>
      `;
      setTimeout(loadInterviewSlotsUi, 100);
      break;

    // ----------------------------------------------------
    // JOB 19: Portfolio Submission (UI/UX Designer)
    // ----------------------------------------------------
    case 'portfolio':
      html = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
            <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
            <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_experience">Design Experience <span class="required">*</span></label>
            <input type="text" id="wf_experience" name="experience" class="form-control" required placeholder="e.g. 3 years (Figma, Design Systems)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wf_resume">Resume / CV <span class="required">*</span></label>
          <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
        </div>

        <div class="workflow-section-box">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">Portfolio & Design Samples</h4>
          <div class="form-group">
            <label class="form-label" for="wf_portfolioUrl">Portfolio Website / Behance / Dribbble URL <span class="required">*</span></label>
            <input type="url" id="wf_portfolioUrl" name="portfolio" class="form-control" required placeholder="https://yourportfolio.design or Behance link">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_portfolioPdf">Optional Portfolio Case Study PDF / Design Deck</label>
            <input type="file" id="wf_portfolioPdf" name="portfolio_doc" class="form-control" accept=".pdf,.zip">
          </div>
        </div>
      `;
      break;

    // ----------------------------------------------------
    // JOB 20: Review Before Submit (Software Engineering Intern)
    // ----------------------------------------------------
    case 'review_submit':
      html = `
        <div id="internStepForm">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_fullName">Full Name <span class="required">*</span></label>
              <input type="text" id="wf_fullName" name="fullName" class="form-control" required placeholder="Full Name">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_email">Email Address <span class="required">*</span></label>
              <input type="email" id="wf_email" name="email" class="form-control" required placeholder="you@domain.com">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="wf_phone">Phone Number <span class="required">*</span></label>
              <input type="tel" id="wf_phone" name="phone" class="form-control" required placeholder="+91 9876543210">
            </div>
            <div class="form-group">
              <label class="form-label" for="wf_education">College / Degree <span class="required">*</span></label>
              <input type="text" id="wf_education" name="qualification" class="form-control" required placeholder="e.g. B.Tech CS 2026 Batch">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_skills">Key Programming Languages & Projects <span class="required">*</span></label>
            <input type="text" id="wf_skills" name="skills" class="form-control" required placeholder="e.g. JavaScript, Python, React, Git">
          </div>
          <div class="form-group">
            <label class="form-label" for="wf_resume">Resume / CV Document <span class="required">*</span></label>
            <input type="file" id="wf_resume" name="resume" class="form-control" accept=".pdf,.doc,.docx" required>
          </div>
          <button type="button" class="btn btn-secondary btn-lg" style="width: 100%; margin-top: 1rem;" onclick="goToInternReview()">
            Proceed to Review Application →
          </button>
        </div>

        <!-- Review Step -->
        <div id="internReviewScreen" style="display: none;">
          <div class="workflow-section-box">
            <span class="badge badge-yellow">Review Before Submission</span>
            <h4 style="margin: 0.5rem 0 1rem;">Please Review Your Details Carefully</h4>
            
            <div id="internReviewData" style="line-height: 1.8; font-size: 0.95rem;"></div>

            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary" onclick="editInternForm()">← Edit Information</button>
            </div>
          </div>
        </div>
      `;
      break;

    default:
      html = `<p>Standard workflow form.</p>`;
  }

  container.innerHTML = html;

  // Manage visibility of the primary Submit button
  const submitBtn = document.getElementById('jobSubmitBtn');
  if (workflowType === 'review_submit') {
    submitBtn.style.display = 'none'; // Only appears on review screen
  } else if (workflowType === 'registration') {
    submitBtn.style.display = 'none'; // Only appears after auth
  } else {
    submitBtn.style.display = 'block';
    submitBtn.textContent = 'Submit Application';
  }
}

/**
 * ============================================================
 * WORKFLOW-SPECIFIC INTERACTIVE CONTROLS
 * ============================================================
 */

// Conditional Handler for AI QA Engineer
function handleConditionalPlaywright(hasExperience) {
  const yesBox = document.getElementById('playwrightYesBranch');
  const noBox = document.getElementById('playwrightNoBranch');
  const expYears = document.getElementById('pw_expYears');
  const projects = document.getElementById('pw_projects');
  const cicd = document.getElementById('pw_cicd');

  if (hasExperience) {
    yesBox.style.display = 'block';
    noBox.style.display = 'none';
    if (expYears) expYears.required = true;
    if (projects) projects.required = true;
    if (cicd) cicd.required = true;
  } else {
    yesBox.style.display = 'none';
    noBox.style.display = 'block';
    if (expYears) expYears.required = false;
    if (projects) projects.required = false;
    if (cicd) cicd.required = false;
  }
}

// Multi-Step Wizard Navigation (DevOps Engineer)
let currentWizardStep = 1;
function wizardNavigate(delta) {
  const nextStep = currentWizardStep + delta;
  if (nextStep < 1 || nextStep > 6) return;

  // Validate current step before advancing
  if (delta > 0) {
    if (currentWizardStep === 1) {
      const name = document.getElementById('wz_name')?.value.trim();
      const email = document.getElementById('wz_email')?.value.trim();
      const phone = document.getElementById('wz_phone')?.value.trim();
      if (!name || !email || !phone) {
        alert('Please complete all required personal information fields.');
        return;
      }
    } else if (currentWizardStep === 5) {
      const resumeInput = document.getElementById('wf_resume');
      if (!resumeInput || !resumeInput.files || resumeInput.files.length === 0) {
        alert('Please attach your resume document to proceed.');
        return;
      }
    }
  }

  // Hide old step
  document.getElementById(`wizardStep${currentWizardStep}`).style.display = 'none';
  document.getElementById(`wizardNode${currentWizardStep}`).classList.remove('active');

  currentWizardStep = nextStep;

  // Show new step
  document.getElementById(`wizardStep${currentWizardStep}`).style.display = 'block';
  document.getElementById(`wizardNode${currentWizardStep}`).classList.add('active');

  // Populate Review step
  if (currentWizardStep === 6) {
    const summaryBox = document.getElementById('wizardSummaryContent');
    summaryBox.innerHTML = `
      <p><strong>Name:</strong> ${escapeHtml(document.getElementById('wz_name')?.value)}</p>
      <p><strong>Email:</strong> ${escapeHtml(document.getElementById('wz_email')?.value)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(document.getElementById('wz_phone')?.value)}</p>
      <p><strong>Location:</strong> ${escapeHtml(document.getElementById('wz_loc')?.value)}</p>
      <p><strong>Experience:</strong> ${escapeHtml(document.getElementById('wz_exp')?.value)}</p>
      <p><strong>Cloud Stack:</strong> ${escapeHtml(document.getElementById('wz_cloud')?.value)}</p>
      <p><strong>Containers:</strong> ${escapeHtml(document.getElementById('wz_containers')?.value)}</p>
      <p><strong>Certifications:</strong> ${escapeHtml(document.getElementById('wz_certs')?.value || 'None listed')}</p>
      <p><strong>Resume File:</strong> ${document.getElementById('wf_resume')?.files[0]?.name || 'Attached'}</p>
    `;
    logClientAppEvent(currentSelectedJob.job_code, 'REVIEW_REACHED');
  }

  // Update button visibility
  document.getElementById('wizardPrevBtn').style.display = currentWizardStep > 1 ? 'block' : 'none';
  const nextBtn = document.getElementById('wizardNextBtn');
  const submitBtn = document.getElementById('jobSubmitBtn');

  if (currentWizardStep === 6) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'block';
    submitBtn.style.display = 'none';
  }
}

// Resume Parser Simulation (React Developer)
function simulateResumeParsing(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const box = document.getElementById('parseVerificationBox');
  if (!box) return;

  // Extract realistic values derived from candidate or filename
  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  box.style.display = 'block';

  document.getElementById('wf_fullName').value = cleanName.length > 3 ? cleanName : 'Alex Morgan';
  document.getElementById('wf_email').value = 'alex.morgan.dev@gmail.com';
  document.getElementById('wf_phone').value = '+91 9840123456';
  document.getElementById('wf_experience').value = '2.5 years React / Frontend Engineering';
  document.getElementById('wf_skillsExtracted').value = 'React, Redux, Next.js, TypeScript, TailwindCSS, REST APIs';
  document.getElementById('wf_education').value = 'B.Tech in Computer Science, Anna University';

  logClientAppEvent(currentSelectedJob.job_code, 'RESUME_UPLOADED', { filename: file.name });
}

// Candidate Registration & Login Handlers (QA Lead)
function toggleAuthTab(tab) {
  const regPanel = document.getElementById('authRegisterPanel');
  const logPanel = document.getElementById('authLoginPanel');
  const btnReg = document.getElementById('btnShowRegister');
  const btnLog = document.getElementById('btnShowLogin');

  if (tab === 'register') {
    regPanel.style.display = 'block';
    logPanel.style.display = 'none';
    btnReg.className = 'btn btn-primary btn-sm';
    btnLog.className = 'btn btn-secondary btn-sm';
  } else {
    regPanel.style.display = 'none';
    logPanel.style.display = 'block';
    btnReg.className = 'btn btn-secondary btn-sm';
    btnLog.className = 'btn btn-primary btn-sm';
  }
}

async function handleCandidateRegister() {
  const fullName = document.getElementById('reg_fullName')?.value.trim();
  const email = document.getElementById('reg_email')?.value.trim();
  const password = document.getElementById('reg_password')?.value;
  const phone = document.getElementById('reg_phone')?.value.trim();
  const alertEl = document.getElementById('authAlert');

  alertEl.style.display = 'none';
  if (!fullName || !email || !password) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = 'Full name, email, and password are required to register.';
    alertEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/candidate/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, phone })
    });
    const data = await res.json();
    if (data.success) {
      onCandidateAuthenticated(data.data);
    } else {
      throw new Error(data.error || 'Failed to register');
    }
  } catch (err) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = err.message;
    alertEl.style.display = 'block';
  }
}

async function handleCandidateLogin() {
  const email = document.getElementById('log_email')?.value.trim();
  const password = document.getElementById('log_password')?.value;
  const alertEl = document.getElementById('authAlert');

  alertEl.style.display = 'none';
  if (!email || !password) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = 'Please enter your email and password.';
    alertEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/candidate/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      onCandidateAuthenticated(data.data);
    } else {
      throw new Error(data.error || 'Invalid credentials');
    }
  } catch (err) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = err.message;
    alertEl.style.display = 'block';
  }
}

function onCandidateAuthenticated(candidate) {
  document.getElementById('candidateAuthBox').style.display = 'none';
  const detailBox = document.getElementById('candidateApplicationDetails');
  detailBox.style.display = 'block';

  document.getElementById('authBadgeUser').textContent = `Authenticated Candidate: ${candidate.fullName} (${candidate.email})`;
  document.getElementById('candidateAccountId').value = candidate.id;
  document.getElementById('wf_fullName').value = candidate.fullName;
  document.getElementById('wf_email').value = candidate.email;
  if (candidate.phone) document.getElementById('wf_phone').value = candidate.phone;

  document.getElementById('jobSubmitBtn').style.display = 'block';
}

// Interview Slot Selection UI (Software Engineer)
async function loadInterviewSlotsUi() {
  const container = document.getElementById('slotsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/interview-slots');
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      container.innerHTML = data.data.map(slot => {
        const isBooked = Boolean(slot.is_booked);
        return `
          <div class="slot-card ${isBooked ? 'booked' : ''}" id="slot-node-${slot.id}" onclick="${isBooked ? '' : `selectInterviewSlot(${slot.id})`}">
            <div class="slot-date">📅 ${escapeHtml(slot.slot_date)}</div>
            <div class="slot-time">⏰ ${escapeHtml(slot.slot_time)}</div>
            <div class="slot-status">${isBooked ? 'Booked' : 'Available'}</div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p>No interview slots currently open. You may still apply and our hiring team will coordinate a schedule.</p>';
    }
  } catch (err) {
    container.innerHTML = '<p style="color: var(--text-dim);">Unable to fetch slots.</p>';
  }
}

function selectInterviewSlot(slotId) {
  document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`slot-node-${slotId}`);
  if (card) card.classList.add('selected');
  document.getElementById('selectedInterviewSlotId').value = slotId;
}

// Review Before Submit (Intern)
function goToInternReview() {
  const fullName = document.getElementById('wf_fullName')?.value.trim();
  const email = document.getElementById('wf_email')?.value.trim();
  const phone = document.getElementById('wf_phone')?.value.trim();
  const education = document.getElementById('wf_education')?.value.trim();
  const skills = document.getElementById('wf_skills')?.value.trim();
  const resume = document.getElementById('wf_resume')?.files[0];

  if (!fullName || !email || !phone || !education || !skills || !resume) {
    alert('Please complete all fields and attach your resume to review your application.');
    return;
  }

  document.getElementById('internStepForm').style.display = 'none';
  const reviewScreen = document.getElementById('internReviewScreen');
  reviewScreen.style.display = 'block';

  document.getElementById('internReviewData').innerHTML = `
    <p><strong>Candidate Name:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Email Address:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone Number:</strong> ${escapeHtml(phone)}</p>
    <p><strong>College / Degree:</strong> ${escapeHtml(education)}</p>
    <p><strong>Technical Skills:</strong> ${escapeHtml(skills)}</p>
    <p><strong>Attached Resume:</strong> ${escapeHtml(resume.name)} (${(resume.size / 1024).toFixed(1)} KB)</p>
  `;

  const submitBtn = document.getElementById('jobSubmitBtn');
  submitBtn.style.display = 'block';
  submitBtn.textContent = 'Submit Application';

  logClientAppEvent(currentSelectedJob.job_code, 'REVIEW_REACHED');
}

function editInternForm() {
  document.getElementById('internReviewScreen').style.display = 'none';
  document.getElementById('internStepForm').style.display = 'block';
  document.getElementById('jobSubmitBtn').style.display = 'none';
}

/**
 * ============================================================
 * FINAL APPLICATION SUBMISSION DISPATCHER
 * Handles scoring, knockout disqualification, file payloads,
 * and confirmation view rendering.
 * ============================================================
 */
async function handleJobApplicationSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('applicationAlert');
  const submitBtn = document.getElementById('jobSubmitBtn');

  alertEl.className = 'alert';
  alertEl.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting Application...';

  const formData = new FormData(form);
  const workflowType = currentSelectedJob.workflow_type || 'simple';

  // 1. Knockout Workflow Logic
  if (workflowType === 'knockout') {
    const authIndia = form.elements['ko_auth_india']?.value;
    const locChennai = form.elements['ko_loc_chennai']?.value;
    const notice30d = form.elements['ko_notice_30d']?.value;

    if (authIndia === 'No' || locChennai === 'No' || notice30d === 'No') {
      formData.append('disqualified', '1');
      let reasons = [];
      if (authIndia === 'No') reasons.push('Not authorized to work in India');
      if (locChennai === 'No') reasons.push('Unable to work hybrid from Chennai');
      if (notice30d === 'No') reasons.push('Notice period exceeds 30-day requirement');
      formData.append('disqualificationReason', reasons.join('; '));
    }
  }

  // 2. MCQ Scoring Logic
  if (workflowType === 'mcq') {
    let score = 0;
    const answers = {
      q1: form.elements['mcq_q1']?.value,
      q2: form.elements['mcq_q2']?.value,
      q3: form.elements['mcq_q3']?.value,
      q4: form.elements['mcq_q4']?.value,
      q5: form.elements['mcq_q5']?.value
    };
    // Correct answers: Q1=B, Q2=B, Q3=A, Q4=A, Q5=B
    if (answers.q1 === 'B') score += 20;
    if (answers.q2 === 'B') score += 20;
    if (answers.q3 === 'A') score += 20;
    if (answers.q4 === 'A') score += 20;
    if (answers.q5 === 'B') score += 20;

    formData.append('score', score);
    formData.append('answersJson', JSON.stringify({ mcqAnswers: answers, evaluatedScore: score }));
  }

  formData.append('workflowType', workflowType);

  try {
    const res = await fetch(`/api/jobs/${currentSelectedJob.id}/apply`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();

    if (result.success) {
      showApplicationConfirmation(result.data, currentSelectedJob);
    } else {
      throw new Error(result.error || 'Failed to submit application');
    }
  } catch (err) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = err.message || 'Error processing application. Please check your fields.';
    alertEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
  }
}

// Display professional confirmation screen
function showApplicationConfirmation(appData, job) {
  document.getElementById('jobFormView').style.display = 'none';
  const confirmView = document.getElementById('jobConfirmationView');
  confirmView.style.display = 'block';

  const isDisqualified = Boolean(appData.disqualified);

  if (isDisqualified) {
    confirmView.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
        <h3 style="color: var(--text);">Application Recorded</h3>
        <p style="color: var(--text-muted); margin: 1rem auto; max-width: 480px; line-height: 1.6;">
          Thank you for your interest in Codfis Technologies. Based on the information provided, you do not currently meet the mandatory eligibility requirements for <strong>${escapeHtml(job.title)}</strong>.
        </p>
        <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 1rem; border-radius: var(--radius-sm); margin: 1.5rem auto; max-width: 420px; text-align: left; font-size: 0.9rem;">
          <div><strong>Application Reference:</strong> <code>${escapeHtml(appData.referenceNumber)}</code></div>
          <div><strong>Position:</strong> ${escapeHtml(job.title)} (${escapeHtml(job.job_code)})</div>
          <div><strong>Status:</strong> Disqualified</div>
        </div>
        <button class="btn btn-secondary" onclick="closeJobModal()" style="margin-top: 1rem;">Close</button>
      </div>
    `;
  } else {
    confirmView.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
        <h3 style="color: var(--accent);">Application Submitted Successfully</h3>
        <p style="color: var(--text-muted); margin: 1rem auto; max-width: 480px; line-height: 1.6;">
          Thank you for applying to Codfis Technologies. Your application has been received and indexed into our recruitment pipeline.
        </p>
        <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 1.25rem; border-radius: var(--radius-sm); margin: 1.5rem auto; max-width: 450px; text-align: left; font-size: 0.9rem; line-height: 1.8;">
          <div><strong>Position:</strong> ${escapeHtml(job.title)}</div>
          <div><strong>Job Code:</strong> <code>${escapeHtml(job.job_code)}</code></div>
          <div><strong>Application Reference:</strong> <code style="color: var(--accent); font-weight: bold;">${escapeHtml(appData.referenceNumber)}</code></div>
          <div><strong>Candidate:</strong> ${escapeHtml(appData.candidate)}</div>
          <div><strong>Submission Date:</strong> ${new Date(appData.submittedAt).toLocaleString()}</div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-dim);">
          Our hiring team reviews applications regularly. Please save your reference number for future inquiries.
        </p>
        <button class="btn btn-primary btn-lg" onclick="closeJobModal()" style="margin-top: 1.5rem;">
          Return to Careers Portal
        </button>
      </div>
    `;
  }
}

// Initialize listeners on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('jobApplicationForm');
  if (form) form.addEventListener('submit', handleJobApplicationSubmit);

  const searchInput = document.getElementById('jobSearch');
  if (searchInput) searchInput.addEventListener('input', debounce(loadJobs, 300));

  const filterIds = [
    'departmentFilter',
    'experienceFilter',
    'locationFilter',
    'workModeFilter',
    'employmentTypeFilter',
    'postedDateFilter',
    'jobSortSelect'
  ];

  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', loadJobs);
  });

  loadJobs();
});

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
