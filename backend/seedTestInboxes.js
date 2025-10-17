const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TestInbox = require('./models/TestInbox');

dotenv.config();

const testInboxes = [
  {
    provider: 'gmail',
    email: 'deliverability.test.gmail@gmail.com',
    displayName: 'Gmail Test Inbox',
    isActive: true
  },
  {
    provider: 'outlook',
    email: 'deliverability.test.outlook@outlook.com',
    displayName: 'Outlook Test Inbox',
    isActive: true
  },
  {
    provider: 'yahoo',
    email: 'deliverability.test.yahoo@yahoo.com',
    displayName: 'Yahoo Test Inbox',
    isActive: true
  },
  {
    provider: 'aol',
    email: 'deliverability.test.aol@aol.com',
    displayName: 'AOL Test Inbox',
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
    
    console.log('Connected to MongoDB');
    
    // Clear existing test inboxes
    await TestInbox.deleteMany({});
    console.log('Cleared existing test inboxes');
    
    // Insert new test inboxes
    await TestInbox.insertMany(testInboxes);
    console.log('✅ Test inboxes seeded successfully');
    
    console.log('\n📧 Available Test Inboxes:');
    testInboxes.forEach((inbox, index) => {
      console.log(`${index + 1}. ${inbox.displayName}: ${inbox.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test inboxes:', error);
    process.exit(1);
  }
};

seedTestInboxes();