const axios = require('axios');

class TestMailService {
  constructor() {
    this.apiKey = process.env.TESTMAIL_API_KEY;
    this.namespace = process.env.TESTMAIL_NAMESPACE || 'test';
    this.baseUrl = 'https://api.testmail.app/api/json';
    
    if (!this.apiKey) {
      console.warn('TestMail API key not configured. Email checking will use simulation mode.');
    }
  }

  /**
   * Get messages from a TestMail.app inbox
   * @param {string} tag - The inbox tag (e.g., 'inbox1', 'inbox2')
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise<Array>} Array of email messages
   */
  async getMessages(tag, limit = 50) {
    if (!this.apiKey) {
      throw new Error('TestMail API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${this.apiKey}/${this.namespace}/${tag}`, {
        params: { livequery: true, limit },
        timeout: 10000
      });

      return response.data.emails || [];
    } catch (error) {
      console.error('TestMail API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch emails from TestMail.app');
    }
  }

  /**
   * Search for emails containing specific test code
   * @param {string} tag - The inbox tag
   * @param {string} testCode - The test code to search for
   * @param {Date} since - Only check emails after this date
   * @returns {Promise<Object|null>} Found email or null
   */
  async findEmailWithTestCode(tag, testCode, since = null) {
    try {
      const messages = await this.getMessages(tag, 100);
      
      // Filter messages by date if specified
      let filteredMessages = messages;
      if (since) {
        const sinceDate = new Date(since);
        filteredMessages = messages.filter(msg => {
          const msgDate = new Date(msg.timestamp * 1000);
          return msgDate >= sinceDate;
        });
      }

      // Log recent messages for debugging
      if (filteredMessages.length > 0) {
        filteredMessages.slice(0, 3).forEach((msg, index) => {
          console.log(`  ${index + 1}. Subject: "${msg.subject || 'No subject'}" | From: ${msg.from || 'Unknown'} | Time: ${new Date(msg.timestamp * 1000).toISOString()}`);
        });
      }

      // Search in subject and text content
      const foundEmail = filteredMessages.find(msg => {
        const subject = msg.subject || '';
        const text = msg.text || '';
        const html = msg.html || '';
        
        const hasTestCode = subject.includes(testCode) || 
                           text.includes(testCode) || 
                           html.includes(testCode);
        
        if (hasTestCode) {
          console.log(`✅ Found test code '${testCode}' in message: "${subject}"`);
        }
        
        return hasTestCode;
      });

      if (foundEmail) {
        const location = this.determineEmailLocation(foundEmail);
        return {
          received: true,
          location: this.determineEmailLocation(foundEmail),
          receivedAt: new Date(foundEmail.timestamp * 1000),
          checkedAt: new Date(),
          messageId: foundEmail.oid,
          subject: foundEmail.subject,
          from: foundEmail.from,
          isSimulated: false,
          method: 'testmail-api'
        };
      }
      return {
        received: false,
        location: 'not-found',
        receivedAt: null,
        checkedAt: new Date(),
        messageId: null,
        isSimulated: false,
        method: 'testmail-api'
      };

    } catch (error) {
      console.error(`Error checking TestMail inbox ${tag}:`, error.message);
      
      // Return simulation fallback
      return {
        received: Math.random() > 0.3,
        location: ['inbox', 'promotions', 'spam'][Math.floor(Math.random() * 3)],
        receivedAt: new Date(),
        checkedAt: new Date(),
        messageId: null,
        isSimulated: true,
        method: 'testmail-fallback-simulation'
      };
    }
  }

  /**
   * Determine email location based on TestMail.app data
   * TestMail.app doesn't have folder classification, so we simulate realistic distribution
   */
  determineEmailLocation(email) {
    const subject = (email.subject || '').toLowerCase();
    const text = (email.text || '').toLowerCase();
    
    // Simple heuristics for classification
    const spamKeywords = ['spam', 'phishing', 'scam', 'virus', 'malware'];
    const promoKeywords = ['offer', 'deal', 'discount', 'sale', 'promotion', 'marketing'];
    
    const isSpam = spamKeywords.some(keyword => 
      subject.includes(keyword) || text.includes(keyword)
    );
    
    const isPromo = promoKeywords.some(keyword => 
      subject.includes(keyword) || text.includes(keyword)
    );
    
    if (isSpam) return 'spam';
    if (isPromo) return 'promotions';
    return 'inbox';
  }

  /**
   * Get inbox statistics
   * @param {string} tag - The inbox tag
   * @returns {Promise<Object>} Inbox statistics
   */
  async getInboxStats(tag) {
    try {
      const messages = await this.getMessages(tag, 100);
      
      return {
        totalMessages: messages.length,
        lastMessage: messages.length > 0 ? new Date(messages[0].timestamp * 1000) : null,
        isActive: messages.length > 0
      };
    } catch (error) {
      console.error(`Error getting inbox stats for ${tag}:`, error.message);
      return {
        totalMessages: 0,
        lastMessage: null,
        isActive: false
      };
    }
  }

  /**
   * Generate TestMail.app inbox configuration
   * @returns {Array} Array of inbox configurations
   */
  generateInboxConfig() {
    const inboxes = [];
    
    for (let i = 1; i <= 5; i++) {
      inboxes.push({
        provider: 'testmail',
        email: `inbox${i}.${this.namespace}@testmail.app`,
        displayName: `TestMail Inbox ${i}`,
        tag: `inbox${i}`,
        isActive: true,
        description: `Real test inbox ${i} via TestMail.app`
      });
    }
    
    return inboxes;
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection() {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Try to get messages from inbox1 to test connection
      await this.getMessages('inbox1', 1);
      return true;
    } catch (error) {
      console.error('TestMail connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = TestMailService;