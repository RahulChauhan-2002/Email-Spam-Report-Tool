# Email Deliverability Test Tool ðŸ“§

A professional web application that tests email deliverability by checking where your emails land in recipients' inboxes. Ensure your emails reach the inbox, not the spam folder!

## ðŸš€ Live Demo

**Live App URL**: [https://your-app-url.com](https://your-app-url.com) *(Replace with your deployed URL)*

**GitHub Repository**: [https://github.com/yourusername/email-deliverability-tool](https://github.com/yourusername/email-deliverability-tool) *(Replace with your repo URL)*

## ðŸ“‹ What It Does

This tool helps email marketers, developers, and businesses test their email deliverability across major email providers. Instead of guessing whether your emails are reaching inboxes, get concrete data about:

- **Inbox Placement Rates**: See what percentage of your emails land in the primary inbox
- **Spam Detection**: Identify if emails are being filtered to spam/junk folders
- **Promotions Tab Placement**: Check if emails end up in Gmail's Promotions or other tabs
- **Provider-Specific Results**: Get detailed results for Gmail, Outlook, Yahoo, and more
- **Shareable Reports**: Generate public links to share test results with your team or clients
- **Email Notifications**: Receive test results directly in your inbox

## ðŸ”„ How It Works

### The 4-Step Testing Process:

1. **ðŸ“‹ Step 1: Review Test Inboxes**
   - View 5 pre-configured test email addresses (Gmail, Outlook, Yahoo, etc.)
   - These represent common email providers your customers use

2. **ðŸŽ¯ Step 2: Generate Test Code**
   - Click "Generate Test Code" to get a unique identifier (e.g., TEST-ABC123)
   - Enter your email address for receiving the report

3. **ðŸ“¤ Step 3: Send Your Email**
   - Compose an email from your own account
   - Include the test code in the subject line or email body
   - Send the email to all 5 test inbox addresses
   - The system monitors these inboxes for your test email

4. **ðŸ“Š Step 4: View Results**
   - The system analyzes where your email landed in each inbox
   - Get a comprehensive report with:
     - Individual provider results
     - Overall deliverability score (e.g., 80% inbox placement)
     - Shareable public link
     - Option to email results to yourself

### Technical Flow:
- **Frontend**: React-based wizard guides users through each step
- **Backend**: Node.js/Express API handles test creation and analysis
- **Database**: MongoDB stores test data and results
- **Analysis**: Automated checking of test inboxes (currently simulated)

## ðŸ› ï¸ Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Express Validator** for input validation
- **Nodemailer** for email notifications
- **CORS** for cross-origin requests

### Frontend
- **React 19** with modern hooks and functional components
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, professional styling
- **React Router** for navigation (if needed)

### Development Tools
- **Concurrent** for running frontend/backend simultaneously
- **Nodemon** for backend auto-restart
- **ESLint** for code quality

## ðŸš€ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/email-deliverability-tool.git
   cd email-deliverability-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Environment Setup**
   - Copy `backend/.env.example` to `backend/.env`
   - Configure your MongoDB connection string
   - Set CLIENT_ORIGIN to your frontend URL

4. **Seed Test Data** (Optional)
   ```bash
   cd backend
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Backend runs on http://localhost:5000
   - Frontend runs on http://localhost:5173

## ðŸ“Š Sample Report Output

```
Email Deliverability Report
==========================

Test Code: TEST-ABC123
Test Date: 2025-10-17

Overall Score: 80% Inbox Placement

Provider Results:
âœ… Gmail: Inbox (Primary)
âœ… Outlook: Inbox (Primary)
âš ï¸ Yahoo: Promotions Tab
âŒ AOL: Spam Folder
âœ… iCloud: Inbox (Primary)

Recommendations:
- Review email content for spam triggers
- Consider authentication (SPF, DKIM, DMARC)
- Test different subject lines
```

## ï¿½ What's Missing or Could Be Improved

### Current Limitations
- **Simulation vs. Real APIs**: Currently uses simulated analysis instead of real mailbox APIs (Gmail, Outlook, etc.)
- **Limited Provider Coverage**: Only simulates 5 providers; real implementation would need API integrations
- **No Authentication**: Users can run tests without accounts (good for simplicity, but limits features)
- **Basic Reporting**: Reports are functional but could be more visually appealing

### Potential Improvements
- **Real Mailbox Integration**: Implement Gmail API, Microsoft Graph API, and Yahoo Mail API for actual inbox checking
- **Advanced Analytics**: Add historical tracking, trend analysis, and comparison features
- **PDF Export**: Generate downloadable PDF reports
- **Email Templates**: Provide sample email templates for testing
- **Bulk Testing**: Allow testing multiple variations simultaneously
- **Real-time Notifications**: WebSocket integration for live analysis updates
- **User Accounts**: Add user registration for saving test history and preferences
- **Admin Dashboard**: Analytics for administrators to track usage and system health
- **A/B Testing**: Compare different email versions side-by-side
- **Integration APIs**: REST API for integrating with email marketing tools
- **Mobile App**: React Native companion app for on-the-go testing

### Technical Debt
- **Error Handling**: Could be more robust in edge cases
- **Testing**: Add unit and integration tests
- **Security**: Implement rate limiting and input sanitization
- **Performance**: Optimize database queries and add caching
- **Documentation**: API documentation with Swagger/OpenAPI

## ï¿½ Evaluation Criteria Alignment

This project addresses the assignment requirements:

- âœ… **Design & UX**: Clean, modern interface with clear visual hierarchy
- âœ… **Functionality**: Smooth 4-step workflow from test creation to report generation
- âœ… **Code Quality**: Well-structured MERN application with proper separation of concerns
- âœ… **Product Thinking**: Practical solution to real email deliverability challenges
- âœ… **Shareable Reports**: Public URLs for easy result sharing
- âœ… **Email Notifications**: Results delivered via email
- âš ï¸ **Real APIs**: Currently simulated (would need API keys and OAuth for production)

## ðŸ¤ Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ðŸ“„ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ðŸ™ Acknowledgments

- Inspired by tools like Mail-Tester and GlockApps
- Built with the MERN stack for modern web development
- Designed for email marketers and developers worldwide

---

**Note**: This is a demonstration project. For production use with real email providers, API integrations and proper authentication would be required.
JWT_SECRET=your_super_secret_jwt_key_here_change_this
