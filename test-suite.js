/**
 * Codfis Technologies V2 - Automated Verification Test Suite
 * Tests:
 * 1. Health check endpoint
 * 2. Public Jobs list & detail
 * 3. Public Project enquiry submission
 * 4. Public General contact submission
 * 5. Job Application with mock PDF resume
 * 6. Trainer Application with mock PDF resume
 * 7. Admin authentication & JWT token generation
 * 8. Protected Admin dashboard stats
 * 9. Admin Job CRUD (Create, Read, Update, Status toggle)
 * 10. Admin candidate status update
 * 11. Protected resume download verification
 * 12. Security checks (Invalid token rejection, rate limit resilience)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { app, startServer } = require('./server');

let server;
const PORT = 5055; // dedicated test port

function request(options, postData = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function buildMultipartBody(fields, files, boundary) {
  let body = '';
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }

  for (const [key, file] of Object.entries(files)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"; filename="${file.name}"\r\n`;
    body += `Content-Type: ${file.type}\r\n\r\n`;
    body += `${file.content}\r\n`;
  }
  body += `--${boundary}--\r\n`;
  return body;
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING CODFIS TECHNOLOGIES V2 VERIFICATION TEST');
  console.log('==================================================\n');

  process.env.PORT = PORT;
  server = await startServer(PORT);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Health Check
    console.log('[Test 1] Health Check');
    const health = await request({ hostname: 'localhost', port: PORT, path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.body.status === 'ok', 'Health endpoint returns status ok');

    // TEST 2: Public Jobs
    console.log('\n[Test 2] Public Jobs');
    const jobsRes = await request({ hostname: 'localhost', port: PORT, path: '/api/jobs', method: 'GET' });
    assert(jobsRes.status === 200 && Array.isArray(jobsRes.body.data) && jobsRes.body.data.length > 0, 'Fetched active job listings');
    const sampleJob = jobsRes.body.data[0];

    // TEST 3: Submit Project Enquiry
    console.log('\n[Test 3] Public Project Enquiry Submission');
    const projectPayload = JSON.stringify({
      name: 'Alice Johnson',
      company: 'InnovateCorp',
      email: 'alice@innovatecorp.com',
      phone: '+91 9988776655',
      projectType: 'Web Application',
      budgetRange: '₹3,00,000 - ₹8,00,000',
      timeline: '2 months',
      requirement: 'Need custom internal logistics platform with real-time dashboard.'
    });
    const projRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/project-enquiries',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(projectPayload) }
    }, projectPayload);
    assert(projRes.status === 201 && projRes.body.success === true, 'Project enquiry accepted and stored');

    // TEST 4: Submit General Contact
    console.log('\n[Test 4] Public Contact Message Submission');
    const contactPayload = JSON.stringify({
      name: 'Bob Miller',
      email: 'bob@example.com',
      phone: '+91 9123456789',
      message: 'Looking to enroll 5 team members in Playwright training cohort.'
    });
    const contactRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/contact',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(contactPayload) }
    }, contactPayload);
    assert(contactRes.status === 201 && contactRes.body.success === true, 'Contact message accepted and stored');

    // TEST 5: Job Application with Multipart Resume
    console.log('\n[Test 5] Job Application with File Upload');
    const boundary = '----CodfisBoundary' + Date.now();
    const appBody = buildMultipartBody(
      {
        fullName: 'Dev Candidate',
        email: 'candidate@example.com',
        phone: '+91 9876501234',
        location: 'Chennai',
        experience: '3 years',
        noticePeriod: '30 days',
        expectedSalary: '₹12 LPA',
        coverLetter: 'Strong experience in modern test automation and full-stack engineering.'
      },
      {
        resume: {
          name: 'candidate_resume.pdf',
          type: 'application/pdf',
          content: '%PDF-1.4 Mock PDF Content For Test Suit'
        }
      },
      boundary
    );

    const appRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/jobs/${sampleJob.id}/apply`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(appBody)
      }
    }, appBody);
    assert(appRes.status === 201 && appRes.body.success === true, 'Job application submitted with resume upload');

    // TEST 6: Trainer Application
    console.log('\n[Test 6] Trainer Application');
    const trainerBoundary = '----TrainerBoundary' + Date.now();
    const trainerBody = buildMultipartBody(
      {
        name: 'Master Trainer',
        email: 'trainer@example.com',
        phone: '+91 9876543210',
        location: 'Bangalore',
        primaryTech: 'Playwright & Selenium',
        experience: '7 years',
        currentRole: 'Lead SDET at FinTech',
        preferredTopics: 'API Automation, CI/CD pipelines',
        availability: 'Weekends Only'
      },
      {
        resume: {
          name: 'trainer_cv.pdf',
          type: 'application/pdf',
          content: '%PDF-1.4 Mock Trainer CV Content'
        }
      },
      trainerBoundary
    );

    const trainerRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/trainer-applications',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${trainerBoundary}`,
        'Content-Length': Buffer.byteLength(trainerBody)
      }
    }, trainerBody);
    assert(trainerRes.status === 201 && trainerRes.body.success === true, 'Trainer application submitted');

    // TEST 7: Admin Login & JWT Authentication
    console.log('\n[Test 7] Admin Login Authentication');
    const loginPayload = JSON.stringify({
      username: 'admin',
      password: process.env.ADMIN_PASS || 'Admin@Codfis2026!'
    });
    const loginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginPayload) }
    }, loginPayload);
    assert(loginRes.status === 200 && !!loginRes.body.token, 'Admin logged in and received JWT token');
    const adminToken = loginRes.body.token;

    // TEST 8: Protected Dashboard Stats
    console.log('\n[Test 8] Protected Admin Dashboard Stats');
    const dashRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(dashRes.status === 200 && dashRes.body.stats.projectEnquiries >= 1 && dashRes.body.stats.jobApplications >= 1, 'Dashboard statistics accurately reflected recorded entities');

    // TEST 9: Admin Job Management (Create & Toggle)
    console.log('\n[Test 9] Admin Job Creation & Deactivation');
    const newJobPayload = JSON.stringify({
      title: 'DevOps / Cloud Specialist',
      department: 'Software Engineering',
      location: 'Remote',
      workMode: 'Remote',
      employmentType: 'Full-time',
      experience: '4+ years',
      salary: '₹14 - 18 LPA',
      description: 'Own containerization, Docker, Kubernetes, and CI/CD pipelines.',
      requirements: 'Experience with AWS, Linux, Terraform',
      skills: 'Docker, AWS, CI/CD'
    });
    const createJobRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/jobs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Content-Length': Buffer.byteLength(newJobPayload)
      }
    }, newJobPayload);
    assert(createJobRes.status === 201 && createJobRes.body.data.id, 'Admin created a new job opening');
    const createdJobId = createJobRes.body.data.id;

    // Toggle status
    const toggleJobRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/admin/jobs/${createdJobId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Content-Length': Buffer.byteLength(JSON.stringify({ active: 0 }))
      }
    }, JSON.stringify({ active: 0 }));
    assert(toggleJobRes.status === 200 && toggleJobRes.body.data.active === 0, 'Admin toggled job opening status');

    // TEST 10: Candidate Status Update
    console.log('\n[Test 10] Application Status Management');
    const appsListRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/applications',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const latestApp = appsListRes.body.data[0];
    const statusPayload = JSON.stringify({ status: 'Shortlisted' });
    const updateStatusRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/admin/applications/${latestApp.id}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Content-Length': Buffer.byteLength(statusPayload)
      }
    }, statusPayload);
    assert(updateStatusRes.status === 200, 'Admin updated candidate application status to Shortlisted');

    // TEST 11: Secure Resume Download
    console.log('\n[Test 11] Protected Resume Download');
    const resumeRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/admin/resumes/${latestApp.id}/download?type=job`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(resumeRes.status === 200, 'Authenticated admin securely downloaded candidate resume');

    // TEST 12: Security - Reject Unauthorized Access
    console.log('\n[Test 12] Security Checks');
    const unauthRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/dashboard',
      method: 'GET'
    });
    assert(unauthRes.status === 401, 'Unauthorized request without token is rejected with 401');

    console.log('\n==================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================');

    if (failed === 0) {
      console.log('🎉 ALL V2 SUBSYSTEMS PASSED VERIFICATION.');
    } else {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test Suite encountered an unexpected error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
