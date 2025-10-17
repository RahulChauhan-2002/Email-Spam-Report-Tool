const mongoose = require('mongoose');

const emailTestSchema = new mongoose.Schema({
  testCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  testInboxes: [{
    provider: {
      type: String,
      enum: ['gmail', 'outlook', 'yahoo', 'aol', 'icloud'],
      required: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'checking', 'completed', 'failed'],
      default: 'pending'
    },
    result: {
      received: {
        type: Boolean,
        default: false
      },
      location: {
        type: String,
        enum: ['inbox', 'spam', 'promotions', 'not-found'],
        default: 'not-found'
      },
      receivedAt: Date,
      checkedAt: Date
    }
  }],
  status: {
    type: String,
    enum: ['created', 'waiting-for-email', 'analyzing', 'completed', 'failed'],
    default: 'created'
  },
  deliverabilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  reportUrl: {
    type: String,
    trim: true
  },
  emailSentAt: Date,
  analysisStartedAt: Date,
  completedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  metadata: {
    clientIP: String,
    userAgent: String,
    totalInboxes: {
      type: Number,
      default: 5
    },
    inboxDelivered: {
      type: Number,
      default: 0
    },
    spamDelivered: {
      type: Number,
      default: 0
    },
    promotionsDelivered: {
      type: Number,
      default: 0
    },
    notReceived: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating deliverability percentage
emailTestSchema.virtual('deliverabilityPercentage').get(function() {
  const totalReceived = this.metadata.inboxDelivered + this.metadata.spamDelivered + this.metadata.promotionsDelivered;
  return Math.round((totalReceived / this.metadata.totalInboxes) * 100);
});

// Virtual for inbox delivery percentage
emailTestSchema.virtual('inboxPercentage').get(function() {
  return Math.round((this.metadata.inboxDelivered / this.metadata.totalInboxes) * 100);
});

// Index for efficient queries
emailTestSchema.index({ userId: 1, createdAt: -1 });
emailTestSchema.index({ testCode: 1 });
emailTestSchema.index({ status: 1 });
emailTestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to calculate deliverability score
emailTestSchema.pre('save', function(next) {
  if (this.testInboxes && this.testInboxes.length > 0) {
    const metadata = {
      totalInboxes: this.testInboxes.length,
      inboxDelivered: 0,
      spamDelivered: 0,
      promotionsDelivered: 0,
      notReceived: 0
    };

    this.testInboxes.forEach(inbox => {
      if (inbox.result && inbox.result.received) {
        switch (inbox.result.location) {
          case 'inbox':
            metadata.inboxDelivered++;
            break;
          case 'spam':
            metadata.spamDelivered++;
            break;
          case 'promotions':
            metadata.promotionsDelivered++;
            break;
          default:
            metadata.notReceived++;
        }
      } else {
        metadata.notReceived++;
      }
    });

    this.metadata = metadata;
    
    // Calculate deliverability score (inbox delivery is weighted higher)
    const inboxScore = (metadata.inboxDelivered / metadata.totalInboxes) * 100;
    const promotionsScore = (metadata.promotionsDelivered / metadata.totalInboxes) * 50;
    const spamScore = (metadata.spamDelivered / metadata.totalInboxes) * 20;
    
    this.deliverabilityScore = Math.round(inboxScore + promotionsScore + spamScore);
  }
  next();
});

// Static method to generate unique test code
emailTestSchema.statics.generateTestCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TEST-${result}`;
};

module.exports = mongoose.model('EmailTest', emailTestSchema);