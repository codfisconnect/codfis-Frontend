const { query, get, run } = require('../database');

// POST /api/contact (public)
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const result = await run(`
      INSERT INTO contacts (name, email, phone, message, status)
      VALUES (?, ?, ?, ?, 'New')
    `, [name, email, phone || '', message]);

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out. Our team will get back to you shortly.',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error submitting contact form:', err);
    res.status(500).json({ success: false, error: 'Unable to send message. Please try again.' });
  }
};

// POST /api/project-enquiries (public)
exports.submitProjectEnquiry = async (req, res) => {
  try {
    const { name, company, email, phone, projectType, budgetRange, timeline, requirement } = req.body;
    if (!name || !email || !projectType || !requirement) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, project type, and requirement description are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const result = await run(`
      INSERT INTO project_enquiries (name, company, email, phone, projectType, budgetRange, timeline, requirement, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New')
    `, [
      name,
      company || '',
      email,
      phone || '',
      projectType,
      budgetRange || 'Flexible',
      timeline || 'Immediate / 1-3 months',
      requirement
    ]);

    res.status(201).json({
      success: true,
      message: 'Project enquiry submitted successfully. Our engineering team will review and contact you with an initial discovery plan.',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error submitting project enquiry:', err);
    res.status(500).json({ success: false, error: 'Unable to submit enquiry. Please try again.' });
  }
};
