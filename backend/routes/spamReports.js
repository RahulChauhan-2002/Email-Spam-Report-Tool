const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const spamReportController = require('../controllers/spamReportController');

// @route   POST /api/spam-reports
// @desc    Create a new spam report
// @access  Public
router.post('/', [
  body('senderEmail').isEmail().withMessage('Valid sender email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('emailBody').trim().notEmpty().withMessage('Email body is required'),
  body('spamType').isIn(['phishing', 'scam', 'malware', 'advertisement', 'other']).withMessage('Invalid spam type')
], spamReportController.createReport);

// @route   GET /api/spam-reports
// @desc    Get all spam reports (with filters)
// @access  Public
router.get('/', spamReportController.getReports);

// @route   GET /api/spam-reports/:id
// @desc    Get single spam report
// @access  Public
router.get('/:id', spamReportController.getReportById);

// @route   PUT /api/spam-reports/:id
// @desc    Update spam report status
// @access  Public
router.put('/:id', spamReportController.updateReport);

// @route   DELETE /api/spam-reports/:id
// @desc    Delete spam report
// @access  Public
router.delete('/:id', spamReportController.deleteReport);

module.exports = router;
