const EmailTest = require('../models/EmailTest');
const TestInbox = require('../models/TestInbox');
const { validationResult } = require('express-validator');
const EmailAnalyzer = require('../services/emailAnalyzer');

// @desc    Create new email deliverability test
// @route   POST /api/email-tests
// @access  Public
const createEmailTest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    // Get active test inboxes
    const testInboxes = await TestInbox.find({ isActive: true }).limit(5);
    if (testInboxes.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No test inboxes available. Please try again later.'
      });
    }

    // Generate unique test code
    let testCode;
    let isUnique = false;
    while (!isUnique) {
      testCode = EmailTest.generateTestCode();
      const existingTest = await EmailTest.findOne({ testCode });
      if (!existingTest) {
        isUnique = true;
      }
    }

    // Create test with inbox configurations
    const emailTest = new EmailTest({
      testCode,
      userEmail,
      testInboxes: testInboxes.map(inbox => ({
        provider: inbox.provider,
        email: inbox.email,
        status: 'pending'
      })),
      status: 'created',
      metadata: {
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        totalInboxes: testInboxes.length
      }
    });

    await emailTest.save();

    res.status(201).json({
      success: true,
      message: 'Email test created successfully',
      data: {
        testCode: emailTest.testCode,
        testInboxes: emailTest.testInboxes.map(inbox => ({
          provider: inbox.provider,
          email: inbox.email
        })),
        userEmail: emailTest.userEmail,
        status: emailTest.status,
        expiresAt: emailTest.expiresAt
      }
    });

  } catch (error) {
    console.error('Create email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating email test'
    });
  }
};

// @desc    Start email analysis
// @route   POST /api/email-tests/:testCode/analyze
// @access  Public
const startAnalysis = async (req, res) => {
  try {
    const { testCode } = req.params;

    const emailTest = await EmailTest.findOne({ 
      testCode
    });

    if (!emailTest) {
      return res.status(404).json({
        success: false,
        message: 'Email test not found'
      });
    }

    if (emailTest.status !== 'created') {
      return res.status(400).json({
        success: false,
        message: 'Test has already been started or completed'
      });
    }

    // Update test status
    emailTest.status = 'waiting-for-email';
    emailTest.emailSentAt = new Date();
    emailTest.analysisStartedAt = new Date();
    
    // Update inbox statuses
    emailTest.testInboxes.forEach(inbox => {
      inbox.status = 'checking';
    });

    await emailTest.save();

    // Start background analysis process with real APIs + simulation fallback
    setTimeout(async () => {
      const analyzer = new EmailAnalyzer();
      const results = await analyzer.analyzeEmailTest(emailTest);
      
      // Update email test with results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        emailTest.testInboxes[i].result = {
          received: result.received,
          location: result.location,
          receivedAt: result.receivedAt,
          checkedAt: result.checkedAt
        };
        emailTest.testInboxes[i].status = 'completed';
        
        // Add metadata about analysis method
        if (result.isSimulated) {
          emailTest.testInboxes[i].metadata = {
            analysisMethod: result.method || 'simulation',
            isSimulated: true
          };
        } else {
          emailTest.testInboxes[i].metadata = {
            analysisMethod: result.method || 'real-api',
            messageId: result.messageId
          };
        }
      }
      
      emailTest.status = 'completed';
      emailTest.completedAt = new Date();
      await emailTest.save();
      
      console.log(`Email test ${emailTest.testCode} completed with ${emailTest.deliverabilityScore}% deliverability`);
    }, 2000);

    res.json({
      success: true,
      message: 'Email analysis started',
      data: {
        testCode: emailTest.testCode,
        status: emailTest.status,
        estimatedCompletionTime: '2-5 minutes'
      }
    });

  } catch (error) {
    console.error('Start analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting analysis'
    });
  }
};

// @desc    Get email test status
// @route   GET /api/email-tests/:testCode
// @access  Private
const getEmailTest = async (req, res) => {
  try {
    const { testCode } = req.params;

    const emailTest = await EmailTest.findOne({ 
      testCode, 
      userId: req.user.id 
    }).select('-__v');

    if (!emailTest) {
      return res.status(404).json({
        success: false,
        message: 'Email test not found'
      });
    }

    res.json({
      success: true,
      data: emailTest
    });

  } catch (error) {
    console.error('Get email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving email test'
    });
  }
};

// @desc    Get user's email tests
// @route   GET /api/email-tests
// @access  Private
const getUserEmailTests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId: req.user.id };
    if (status) {
      query.status = status;
    }

    const emailTests = await EmailTest.find(query)
      .select('-testInboxes.result -__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await EmailTest.countDocuments(query);

    res.json({
      success: true,
      data: emailTests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTests: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user email tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving email tests'
    });
  }
};

// @desc    Delete email test
// @route   DELETE /api/email-tests/:testCode
// @access  Private
const deleteEmailTest = async (req, res) => {
  try {
    const { testCode } = req.params;

    const emailTest = await EmailTest.findOneAndDelete({ 
      testCode, 
      userId: req.user.id 
    });

    if (!emailTest) {
      return res.status(404).json({
        success: false,
        message: 'Email test not found'
      });
    }

    res.json({
      success: true,
      message: 'Email test deleted successfully'
    });

  } catch (error) {
    console.error('Delete email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting email test'
    });
  }
};

// @desc    Get active test inboxes for display
// @route   GET /api/email-tests/inboxes
// @access  Private
const getActiveInboxes = async (req, res) => {
  try {
    const inboxes = await TestInbox.find({ isActive: true })
      .select('provider email displayName')
      .limit(5)
      .lean();

    res.json({ success: true, data: inboxes });
  } catch (error) {
    console.error('Get active inboxes error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving inboxes' });
  }
};

// @desc    Public report by test code (no auth)
// @route   GET /api/email-tests/:testCode/public
// @access  Public
const getPublicEmailTest = async (req, res) => {
  try {
    const { testCode } = req.params;
    const emailTest = await EmailTest.findOne({ testCode }).select('-__v');
    if (!emailTest) {
      return res.status(404).json({ success: false, message: 'Email test not found' });
    }

    res.json({ success: true, data: emailTest });
  } catch (error) {
    console.error('Get public email test error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving report' });
  }
};

// Helper function to simulate email analysis (replace with real API integration)
const simulateEmailAnalysis = async (testId) => {
  try {
    const emailTest = await EmailTest.findById(testId);
    if (!emailTest) return;

    // Simulate checking each inbox
    const locations = ['inbox', 'spam', 'promotions', 'not-found'];
    const weights = [0.6, 0.2, 0.15, 0.05]; // Probability weights

    for (let i = 0; i < emailTest.testInboxes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 15000 + Math.random() * 30000)); // 15-45 seconds per check

      // Simulate random result based on weights
      const random = Math.random();
      let location = 'not-found';
      let cumulative = 0;
      
      for (let j = 0; j < locations.length; j++) {
        cumulative += weights[j];
        if (random <= cumulative) {
          location = locations[j];
          break;
        }
      }

      emailTest.testInboxes[i].result = {
        received: location !== 'not-found',
        location,
        receivedAt: location !== 'not-found' ? new Date() : undefined,
        checkedAt: new Date()
      };
      emailTest.testInboxes[i].status = 'completed';
    }

    emailTest.status = 'completed';
    emailTest.completedAt = new Date();
    
    await emailTest.save();

    console.log(`Email test ${emailTest.testCode} completed with ${emailTest.deliverabilityScore}% deliverability`);

  } catch (error) {
    console.error('Simulate analysis error:', error);
  }
};

module.exports = {
  createEmailTest,
  startAnalysis,
  getEmailTest,
  getUserEmailTests,
  deleteEmailTest,
  getActiveInboxes,
  getPublicEmailTest
};