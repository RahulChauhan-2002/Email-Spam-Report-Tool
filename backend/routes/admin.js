const express = require('express');
const router = express.Router();
const TestInbox = require('../models/TestInbox');

// @desc    Seed test inboxes (for production setup)
// @route   POST /api/admin/seed-inboxes
// @access  Public (could add auth later)
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
        description: 'TestMail Inbox 1',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox2.test@testmail.app',
        tag: 'inbox2',
        description: 'TestMail Inbox 2',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox3.test@testmail.app',
        tag: 'inbox3',
        description: 'TestMail Inbox 3',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox4.test@testmail.app',
        tag: 'inbox4',
        description: 'TestMail Inbox 4',
        isActive: true
      },
      {
        provider: 'testmail',
        email: 'inbox5.test@testmail.app',
        tag: 'inbox5',
        description: 'TestMail Inbox 5',
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

router.post('/seed-inboxes', seedTestInboxes);

module.exports = router;