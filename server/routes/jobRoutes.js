const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const { uploadResume, applicationFilesUpload } = require('../middleware/upload');

// Public jobs routes
router.get('/jobs', jobsController.getActiveJobs);
router.get('/jobs/:id', jobsController.getJobById);

// Public application endpoint supporting single or multi-file uploads
router.post('/jobs/:id/apply', applicationFilesUpload.any(), jobsController.applyForJob);

// Candidate Registration & Login (Workflow 16: QA Lead)
router.post('/candidate/register', jobsController.registerCandidate);
router.post('/candidate/login', jobsController.loginCandidate);

// Interview Slots (Workflow 18: Software Engineer)
router.get('/interview-slots', jobsController.getInterviewSlots);

// Application Events tracking
router.post('/application-events', jobsController.logClientEvent);

// Public trainer application
router.post('/trainer-applications', uploadResume.single('resume'), jobsController.applyTrainer);

module.exports = router;

