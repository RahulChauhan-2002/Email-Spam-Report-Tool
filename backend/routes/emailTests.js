const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createEmailTest,
  startAnalysis,
  getPublicEmailTest,
  getActiveInboxes,
  getDeliverabilityStats,
  seedTestInboxes
} = require('../controllers/emailTestController');

// @desc    Create new email deliverability test
// @route   POST /api/email-tests
// @access  Public
router.post('/', 
  [
    body('userEmail')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ],
  createEmailTest
);

// Place static routes BEFORE param routes to avoid conflicts
// @desc    Get active test inboxes (for display)
// @route   GET /api/email-tests/inboxes
// @access  Public
router.get('/inboxes', getActiveInboxes);

// @desc    Get public report (shareable)
// @route   GET /api/email-tests/:testCode/public
// @access  Public (testCode acts as access token)
router.get('/:testCode/public', getPublicEmailTest);

// @desc    Start email analysis for a test
// @route   POST /api/email-tests/:testCode/analyze
// @access  Public
router.post('/:testCode/analyze', startAnalysis);

// @desc    Get deliverability statistics for a user
// @route   GET /api/email-tests/stats/:userEmail
// @access  Public
router.get('/stats/:userEmail', getDeliverabilityStats);

// @desc    Seed test inboxes (for production setup)
// @route   POST /api/email-tests/seed-inboxes
// @access  Public
router.post('/seed-inboxes', seedTestInboxes);

module.exports = router;