const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');

// Public contact form
router.post('/contact', enquiryController.submitContact);

// Public project enquiry form
router.post('/project-enquiries', enquiryController.submitProjectEnquiry);

module.exports = router;
