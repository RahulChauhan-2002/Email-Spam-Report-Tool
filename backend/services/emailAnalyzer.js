const { google } = require('googleapis');

/**
 * Real Email Analysis Service
 * Implements actual Gmail API integration with fallback to simulation
 */
class EmailAnalyzer {
  constructor() {
    this.gmailEnabled = process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET;
    
    if (this.gmailEnabled) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );
    }
  }

  /**
   * Analyze email placement across test inboxes
   * Uses real APIs where available, simulation as fallback
   */
  async analyzeEmailTest(emailTest) {
    console.log(`Starting analysis for test ${emailTest.testCode}`);
    
    const results = [];
    
    for (const inbox of emailTest.testInboxes) {
      let result;
      
      try {
        // Try real API first
        if (this.canUseRealAPI(inbox.provider)) {
          result = await this.checkRealInbox(inbox, emailTest.testCode);
        } else {
          // Fallback to simulation with clear marking
          result = await this.simulateInboxCheck(inbox, emailTest.testCode);
          result.isSimulated = true;
        }
      } catch (error) {
        console.error(`Analysis error for ${inbox.email}:`, error);
        // Fallback to simulation on error
        result = await this.simulateInboxCheck(inbox, emailTest.testCode);
        result.isSimulated = true;
        result.error = error.message;
      }
      
      results.push({
        provider: inbox.provider,
        email: inbox.email,
        ...result
      });
      
      // Add realistic delay between checks
      await this.delay(5000 + Math.random() * 10000);
    }
    
    return results;
  }

  /**
   * Check if we can use real API for this provider
   */
  canUseRealAPI(provider) {
    switch (provider.toLowerCase()) {
      case 'gmail':
        return this.gmailEnabled && process.env.GMAIL_TEST_EMAIL;
      case 'outlook':
        return false; // Would need Microsoft Graph setup
      case 'yahoo':
        return false; // Limited API access
      default:
        return false;
    }
  }

  /**
   * Real Gmail API integration
   */
  async checkRealInbox(inbox, testCode) {
    if (inbox.provider.toLowerCase() !== 'gmail') {
      throw new Error('Real API only supported for Gmail in this implementation');
    }

    // Set up Gmail API
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });
    
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    try {
      // Search for email with test code
      const searchQuery = `subject:${testCode} OR body:${testCode}`;
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults: 10
      });
      
      if (!response.data.messages || response.data.messages.length === 0) {
        return {
          received: false,
          location: 'not-found',
          checkedAt: new Date(),
          method: 'gmail-api'
        };
      }
      
      // Get the first matching message
      const messageId = response.data.messages[0].id;
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });
      
      // Determine folder based on label IDs
      const labelIds = message.data.labelIds || [];
      const location = this.determineGmailLocation(labelIds);
      
      return {
        received: true,
        location,
        receivedAt: new Date(parseInt(message.data.internalDate)),
        checkedAt: new Date(),
        method: 'gmail-api',
        messageId
      };
      
    } catch (error) {
      console.error('Gmail API error:', error);
      throw error;
    }
  }

  /**
   * Determine Gmail folder based on labels
   */
  determineGmailLocation(labelIds) {
    if (labelIds.includes('INBOX')) {
      if (labelIds.includes('CATEGORY_PROMOTIONS')) {
        return 'promotions';
      }
      return 'inbox';
    }
    
    if (labelIds.includes('SPAM')) {
      return 'spam';
    }
    
    return 'inbox'; // Default assumption
  }

  /**
   * Simulation fallback (marked as such)
   */
  async simulateInboxCheck(inbox, testCode) {
    // Simulate realistic checking time
    await this.delay(10000 + Math.random() * 20000);
    
    const locations = ['inbox', 'spam', 'promotions', 'not-found'];
    const weights = [0.6, 0.2, 0.15, 0.05];
    
    const random = Math.random();
    let location = 'not-found';
    let cumulative = 0;
    
    for (let i = 0; i < locations.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        location = locations[i];
        break;
      }
    }
    
    return {
      received: location !== 'not-found',
      location,
      receivedAt: location !== 'not-found' ? new Date() : undefined,
      checkedAt: new Date(),
      method: 'simulation',
      isSimulated: true
    };
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EmailAnalyzer;