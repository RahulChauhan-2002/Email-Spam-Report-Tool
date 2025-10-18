const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TestInbox = require('./models/TestInbox');

dotenv.config();

const testInboxes = [
  {
    provider: 'testmail',
    email: 'inbox1.test@testmail.app',
    displayName: 'TestMail Inbox 1',
    isActive: true,
    description: 'Primary test inbox via TestMail.app'
  },
  {
    provider: 'testmail',
    email: 'inbox2.test@testmail.app',
    displayName: 'TestMail Inbox 2', 
    isActive: true,
    description: 'Secondary test inbox via TestMail.app'
  },
  {
    provider: 'testmail',
    email: 'inbox3.test@testmail.app',
    displayName: 'TestMail Inbox 3',
    isActive: true,
    description: 'Third test inbox via TestMail.app'
  },
  {
    provider: 'testmail',
    email: 'inbox4.test@testmail.app',
    displayName: 'TestMail Inbox 4',
    isActive: true,
    description: 'Fourth test inbox via TestMail.app'
  },
  {
    provider: 'testmail',
    email: 'inbox5.test@testmail.app',
    displayName: 'TestMail Inbox 5',
    isActive: true
  },
  {
    provider: 'icloud',
    email: 'deliverability.test.icloud@icloud.com',
    displayName: 'iCloud Test Inbox',
    isActive: true
  }
];

const seedTestInboxes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/email-deliverability-tool');
    
    
    // Clear existing test inboxes
    await TestInbox.deleteMany({});
    
    // Insert new test inboxes
    await TestInbox.insertMany(testInboxes);
    
  
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test inboxes:', error);
    process.exit(1);
  }
};

seedTestInboxes();