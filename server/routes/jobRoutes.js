const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const { uploadResume, jobApplicationUpload, applicationFilesUpload, validateUploadedResumeContent } = require('../middleware/upload');

// Public jobs routes
router.get('/jobs', jobsController.getActiveJobs);
router.get('/jobs/:id', jobsController.getJobById);

// Public application endpoint supporting resume uploads
router.post('/jobs/:id/apply', jobApplicationUpload, validateUploadedResumeContent, jobsController.applyForJob);

// Candidate Registration & Login (Workflow 16: QA Lead)
router.post('/candidate/register', jobsController.registerCandidate);
router.post('/candidate/login', jobsController.loginCandidate);

// Interview Slots (Workflow 18: Software Engineer)
router.get('/interview-slots', jobsController.getInterviewSlots);

// Application Events tracking
router.post('/application-events', jobsController.logClientEvent);

// Public trainer application
router.post('/trainer-applications', uploadResume.single('resume'), validateUploadedResumeContent, jobsController.applyTrainer);

module.exports = router;

