const nodemailer = require('nodemailer');

class EmailSender {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.setupTransporter();
  }

  setupTransporter() {
    try {
      // Gmail SMTP configuration
      if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
        this.isConfigured = true;
      } else {
        console.log('Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env to enable');
      }
    } catch (error) {
      console.error('❌ Error setting up email transporter:', error.message);
    }
  }

  /**
   * Send test emails to all TestMail.app inboxes
   */
  async sendTestEmails(testCode, userEmail, testInboxes) {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Email sending not configured',
        sentEmails: []
      };
    }

    const sentEmails = [];
    const failedEmails = [];

    for (const inbox of testInboxes) {
      try {
        const emailContent = this.generateTestEmail(testCode, userEmail, inbox.email);
        
        await this.transporter.sendMail({
          from: process.env.GMAIL_EMAIL,
          to: inbox.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });

        sentEmails.push(inbox.email);
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        failedEmails.push({
          email: inbox.email,
          error: error.message
        });
      }
    }

    return {
      success: sentEmails.length > 0,
      message: `Sent ${sentEmails.length}/${testInboxes.length} emails successfully`,
      sentEmails,
      failedEmails
    };
  }

  /**
   * Generate test email content with embedded test code
   */
  generateTestEmail(testCode, userEmail, targetEmail) {
    const subject = `Email Deliverability Test - ${testCode}`;
    
    const text = `
Email Deliverability Test

Test Code: ${testCode}
From: ${userEmail}
To: ${targetEmail}
Time: ${new Date().toISOString()}

This is an automated test email to check email deliverability. 
This email contains the test code ${testCode} for verification purposes.

Please do not reply to this email.

---
Email Spam Report Tool
Automated Deliverability Testing
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Deliverability Test</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .test-code { background: #e3f2fd; padding: 15px; border-radius: 5px; font-weight: bold; text-align: center; font-size: 18px; margin: 20px 0; }
        .details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 Email Deliverability Test</h1>
        <p>Automated email testing in progress</p>
    </div>
    
    <div class="test-code">
        Test Code: <span style="color: #1976d2;">${testCode}</span>
    </div>
    
    <div class="details">
        <h3>Test Details:</h3>
        <ul>
            <li><strong>From:</strong> ${userEmail}</li>
            <li><strong>To:</strong> ${targetEmail}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
    </div>
    
    <p>This is an automated test email to check email deliverability across different email providers.</p>
    <p>This email contains the test code <strong>${testCode}</strong> for verification purposes.</p>
    
    <div class="footer">
        <p>📊 Email Spam Report Tool</p>
        <p>Automated Deliverability Testing</p>
        <p><em>Please do not reply to this email</em></p>
    </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  /**
   * Send report notification email to user
   */
  async sendReportNotification(userEmail, testCode, reportData, reportUrl) {
    if (!this.isConfigured) {
      return { success: false, message: 'Email not configured' };
    }

    try {
      const emailContent = this.generateReportEmail(testCode, reportData, reportUrl);
      
      await this.transporter.sendMail({
        from: process.env.GMAIL_EMAIL,
        to: userEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      return { success: true, message: 'Report notification sent' };
      
    } catch (error) {
      console.error(`❌ Failed to send report to ${userEmail}:`, error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate report notification email
   */
  generateReportEmail(testCode, reportData, reportUrl) {
    const deliverabilityScore = this.calculateDeliverabilityScore(reportData);
    
    const subject = `📊 Your Email Deliverability Report - ${deliverabilityScore}% Score`;
    
    const text = `
Email Deliverability Report

Test Code: ${testCode}
Overall Score: ${deliverabilityScore}%

Results Summary:
${reportData.map(result => 
  `• ${result.email}: ${result.result.received ? (result.result.location === 'inbox' ? '✅ Inbox' : result.result.location === 'spam' ? '❌ Spam' : '⚠️ ' + result.result.location) : '❌ Not Delivered'}`
).join('\n')}

View full report: ${reportUrl}

---
Email Spam Report Tool
Automated Deliverability Testing
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Deliverability Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .score { background: ${deliverabilityScore >= 80 ? '#d4edda' : deliverabilityScore >= 60 ? '#fff3cd' : '#f8d7da'}; 
                 color: ${deliverabilityScore >= 80 ? '#155724' : deliverabilityScore >= 60 ? '#856404' : '#721c24'};
                 padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .results { margin: 20px 0; }
        .result-item { padding: 10px; margin: 5px 0; border-radius: 5px; background: #f8f9fa; }
        .inbox { border-left: 4px solid #28a745; }
        .spam { border-left: 4px solid #dc3545; }
        .not-found { border-left: 4px solid #6c757d; }
        .cta { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Your Email Deliverability Report</h1>
        <p>Test Code: <strong>${testCode}</strong></p>
    </div>
    
    <div class="score">
        Overall Score: ${deliverabilityScore}%
    </div>
    
    <div class="results">
        <h3>Results Summary:</h3>
        ${reportData.map(result => {
          const status = result.result.received 
            ? (result.result.location === 'inbox' ? 'inbox' : result.result.location === 'spam' ? 'spam' : 'other')
            : 'not-found';
          const icon = status === 'inbox' ? '✅' : status === 'spam' ? '❌' : '⚠️';
          const label = status === 'inbox' ? 'Delivered to Inbox' : 
                       status === 'spam' ? 'Delivered to Spam' : 
                       'Not Delivered';
          
          return `<div class="result-item ${status}">
            <strong>${result.email}</strong><br>
            ${icon} ${label}
          </div>`;
        }).join('')}
    </div>
    
    <div class="cta">
        <a href="${reportUrl}" class="button">View Full Report</a>
    </div>
    
    <div class="footer">
        <p>📧 Email Spam Report Tool</p>
        <p>Automated Deliverability Testing</p>
    </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  /**
   * Calculate deliverability score based on results
   */
  calculateDeliverabilityScore(reportData) {
    if (!reportData || reportData.length === 0) return 0;
    
    const inboxCount = reportData.filter(result => 
      result.result.received && result.result.location === 'inbox'
    ).length;
    
    return Math.round((inboxCount / reportData.length) * 100);
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, message: 'Email not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = EmailSender;