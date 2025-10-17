const crypto = require('crypto');

const tests = {};

const generateTestId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const startTest = async (req, res) => {
  const testId = generateTestId();
  const testEmails = [
    'test1@example.com',
    'test2@example.com',
    'test3@example.com',
    'test4@example.com',
    'test5@example.com',
  ];

  tests[testId] = {
    emails: testEmails,
    results: [],
  };

  res.json({ testId, testEmails });
};

const getReport = async (req, res) => {
  const { id } = req.params;
  const test = tests[id];

  if (!test) {
    return res.status(404).json({ message: 'Test not found' });
  }

  // In a real application, you would check the inboxes for emails with the testId.
  // For this example, we'll return a mock report.
  const report = {
    results: test.emails.map(email => ({
      email,
      status: 'Received',
      folder: 'Inbox',
    })),
    summary: {
      score: '5/5',
      shareableLink: `http://localhost:3000/report/${id}`,
    },
  };

  res.json(report);
};

module.exports = { startTest, getReport };
