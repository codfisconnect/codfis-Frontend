const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Public login
router.post('/login', adminController.login);

// Protected routes
router.use(authenticateAdmin);

// Dashboard overview
router.get('/dashboard', adminController.getDashboardStats);

// Jobs management
router.get('/jobs', adminController.getAllJobsAdmin);
router.post('/jobs', adminController.createJob);
router.put('/jobs/:id', adminController.updateJob);
router.delete('/jobs/:id', adminController.deleteJob);

// Applications management
router.get('/applications', adminController.getAllApplications);
router.get('/applications/:id', adminController.getApplicationById);
router.patch('/applications/:id/status', adminController.updateApplicationStatus);

// Resume download
router.get('/resumes/:id/download', adminController.downloadResume);

// Trainer applications
router.get('/trainer-applications', adminController.getAllTrainerApplications);
router.patch('/trainer-applications/:id/status', adminController.updateTrainerStatus);

// Contacts
router.get('/contacts', adminController.getAllContacts);
router.patch('/contacts/:id/status', adminController.updateContactStatus);

// Project enquiries
router.get('/project-enquiries', adminController.getAllProjectEnquiries);
router.patch('/project-enquiries/:id/status', adminController.updateProjectStatus);

module.exports = router;
