const mongoose = require('mongoose');

const spamReportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderEmail: {
    type: String,
    required: [true, 'Sender email is required'],
    trim: true,
    lowercase: true
  },
  senderName: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true
  },
  emailBody: {
    type: String,
    required: [true, 'Email body is required']
  },
  spamType: {
    type: String,
    enum: ['phishing', 'scam', 'malware', 'advertisement', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  attachments: [{
    filename: String,
    size: Number,
    contentType: String
  }],
  ipAddress: {
    type: String,
    trim: true
  },
  headers: {
    type: Map,
    of: String
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'false-positive'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
spamReportSchema.index({ senderEmail: 1, createdAt: -1 });
spamReportSchema.index({ status: 1 });
spamReportSchema.index({ spamType: 1 });

module.exports = mongoose.model('SpamReport', spamReportSchema);
