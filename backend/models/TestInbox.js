const mongoose = require('mongoose');

const testInboxSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo', 'aol', 'icloud'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  apiCredentials: {
    // Store encrypted API credentials for accessing each inbox
    clientId: String,
    clientSecret: String,
    refreshToken: String,
    accessToken: String,
    tokenExpiry: Date
  },
  settings: {
    checkInterval: {
      type: Number,
      default: 30 // seconds
    },
    maxCheckDuration: {
      type: Number,
      default: 300 // 5 minutes in seconds
    }
  },
  statistics: {
    totalTests: {
      type: Number,
      default: 0
    },
    inboxDeliveries: {
      type: Number,
      default: 0
    },
    spamDeliveries: {
      type: Number,
      default: 0
    },
    promotionsDeliveries: {
      type: Number,
      default: 0
    },
    lastChecked: Date,
    averageDeliveryTime: Number // in seconds
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Don't expose API credentials
      delete ret.apiCredentials;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for delivery rate
testInboxSchema.virtual('deliveryRate').get(function() {
  if (this.statistics.totalTests === 0) return 0;
  const delivered = this.statistics.inboxDeliveries + 
                   this.statistics.spamDeliveries + 
                   this.statistics.promotionsDeliveries;
  return Math.round((delivered / this.statistics.totalTests) * 100);
});

// Virtual for inbox rate
testInboxSchema.virtual('inboxRate').get(function() {
  if (this.statistics.totalTests === 0) return 0;
  return Math.round((this.statistics.inboxDeliveries / this.statistics.totalTests) * 100);
});

// Index for efficient queries
testInboxSchema.index({ provider: 1, isActive: 1 });
testInboxSchema.index({ email: 1 });

module.exports = mongoose.model('TestInbox', testInboxSchema);