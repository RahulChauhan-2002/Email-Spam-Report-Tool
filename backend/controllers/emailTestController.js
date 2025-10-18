const EmailTest = require('../models/EmailTest');
const TestInbox = require('../models/TestInbox');
const { validationResult } = require('express-validator');
const EmailAnalyzer = require('../services/emailAnalyzer');
const EmailSender = require('../services/emailSender');

// Initialize email sender
const emailSender = new EmailSender();

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

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check for rate limiting (max 5 tests per email per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTests = await EmailTest.countDocuments({
      userEmail: userEmail,
      createdAt: { $gte: oneHourAgo }
    });

    if (recentTests >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please wait before creating another test.'
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
        tag: inbox.tag, // Include tag for TestMail.app
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

    // Automatically send test emails if email sender is configured
    let emailSendingResult = null;
    try {
      emailSendingResult = await emailSender.sendTestEmails(
        testCode, 
        userEmail, 
        testInboxes
      );
      
      if (emailSendingResult.success) {
        // Update test status to indicate emails were sent
        emailTest.status = 'waiting-for-email';
        emailTest.emailSentAt = new Date();
        await emailTest.save();
      }
    } catch (error) {
      console.error('Error sending automatic emails:', error.message);
    }

    res.status(201).json({
      success: true,
      message: emailSendingResult?.success 
        ? `Email test created and ${emailSendingResult.sentEmails.length} emails sent automatically`
        : 'Email test created successfully',
      data: {
        testCode: emailTest.testCode,
        testInboxes: emailTest.testInboxes.map(inbox => ({
          provider: inbox.provider,
          email: inbox.email
        })),
        userEmail: emailTest.userEmail,
        status: emailTest.status,
        expiresAt: emailTest.expiresAt,
        automaticEmailSending: emailSendingResult?.success || false,
        emailsSent: emailSendingResult?.sentEmails || []
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
     
      
      // Send report notification email
      try {
        const reportUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/report/${emailTest.testCode}`;
        await emailSender.sendReportNotification(
          emailTest.userEmail,
          emailTest.testCode,
          emailTest.testInboxes,
          reportUrl
        );
        
      } catch (emailError) {
        console.error('Failed to send report notification:', emailError.message);
      }
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
    
    // Update test status to failed
    if (emailTest) {
      emailTest.status = 'failed';
      emailTest.error = error.message;
      await emailTest.save();
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error starting analysis. Please try again later.'
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

  } catch (error) {
    console.error('Simulate analysis error:', error);
  }
};

// @desc    Get deliverability statistics for a user
// @route   GET /api/email-tests/stats/:userEmail
// @access  Public
const getDeliverabilityStats = async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    // Get completed tests for this user
    const completedTests = await EmailTest.find({
      userEmail,
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(10);

    if (completedTests.length === 0) {
      return res.json({
        success: true,
        data: {
          totalTests: 0,
          averageScore: 0,
          trends: [],
          recentTests: []
        }
      });
    }

    // Calculate statistics
    const totalTests = completedTests.length;
    const averageScore = Math.round(
      completedTests.reduce((sum, test) => sum + (test.deliverabilityScore || 0), 0) / totalTests
    );

    // Get trends (last 5 tests)
    const trends = completedTests.slice(0, 5).reverse().map(test => ({
      testCode: test.testCode,
      score: test.deliverabilityScore || 0,
      date: test.createdAt
    }));

    res.json({
      success: true,
      data: {
        totalTests,
        averageScore,
        trends,
        recentTests: completedTests.slice(0, 5).map(test => ({
          testCode: test.testCode,
          score: test.deliverabilityScore || 0,
          createdAt: test.createdAt,
          completedAt: test.completedAt
        }))
      }
    });

  } catch (error) {
    console.error('Get deliverability stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting deliverability statistics'
    });
  }
};

// @desc    Seed test inboxes (for production setup)
// @route   POST /api/email-tests/seed-inboxes
// @access  Public
const seedTestInboxes = async (req, res) => {
  try {
    // Clear existing test inboxes
    await TestInbox.deleteMany({});
    console.log('Cleared existing test inboxes');

    // Create TestMail.app test inboxes
    const testInboxes = [
      {
        provider: 'testmail',
        email: 'inbox1.test@testmail.app',
        tag: 'inbox1',
        displayName: 'TestMail Inbox 1',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox2.test@testmail.app',
        tag: 'inbox2',
        displayName: 'TestMail Inbox 2',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox3.test@testmail.app',
        tag: 'inbox3',
        displayName: 'TestMail Inbox 3',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox4.test@testmail.app',
        tag: 'inbox4',
        displayName: 'TestMail Inbox 4',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox5.test@testmail.app',
        tag: 'inbox5',
        displayName: 'TestMail Inbox 5',
        isActive: true
      }
    ];

    // Insert test inboxes
    const createdInboxes = await TestInbox.insertMany(testInboxes);
    console.log(`✅ Successfully seeded ${createdInboxes.length} test inboxes`);

    res.json({
      success: true,
      message: `Successfully seeded ${createdInboxes.length} test inboxes`,
      data: createdInboxes.map(inbox => ({
        provider: inbox.provider,
        email: inbox.email,
        tag: inbox.tag,
        isActive: inbox.isActive
      }))
    });

  } catch (error) {
    console.error('❌ Error seeding test inboxes:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding test inboxes',
      error: error.message
    });
  }
};

module.exports = {
  createEmailTest,
  startAnalysis,
  getEmailTest,
  getUserEmailTests,
  deleteEmailTest,
  getActiveInboxes,
  getPublicEmailTest,
  getDeliverabilityStats,
  seedTestInboxes
};