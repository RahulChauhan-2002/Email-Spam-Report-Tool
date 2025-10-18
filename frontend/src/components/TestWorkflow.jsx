import React, { useState, useEffect, useCallback, useRef } from 'react';
import TestHistory from './TestHistory';

const API_BASE = import.meta.env.VITE_API_URL || 'https://email-spam-report-tool.onrender.com';

export default function TestWorkflow() {
  const [step, setStep] = useState(1); // 1: show inboxes, 2: generate code, 3: waiting, 4: report
  const [testCode, setTestCode] = useState(null);
  const [testInboxes, setTestInboxes] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [notification, setNotification] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const emailInputRef = useRef(null);

  // Auto-focus email input when step 1 is active
  useEffect(() => {
    if (step === 1 && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [step]);

  // Load recent tests from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('emailTestHistory');
    if (saved) {
      try {
        setRecentTests(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load test history:', e);
      }
    }
  }, []);

  // Save test to history
  const saveTestToHistory = useCallback((testData) => {
    const historyItem = {
      testCode: testData.testCode,
      userEmail: testData.userEmail,
      timestamp: new Date().toISOString(),
      score: testData.deliverabilityScore || 0
    };
    
    setRecentTests(prev => {
      const newHistory = [historyItem, ...prev.slice(0, 4)]; // Keep last 5 tests
      localStorage.setItem('emailTestHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Email validation with enhanced patterns
  const validateEmail = (email) => {
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Check for common invalid patterns
    const invalidPatterns = [
      /\.\./,  // consecutive dots
      /^\./, // starts with dot
      /\.$/, // ends with dot
      /@\./,  // @ followed by dot
      /\.@/   // dot followed by @
    ];

    return !invalidPatterns.some(pattern => pattern.test(email));
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setUserEmail(email);
    setEmailValid(validateEmail(email));
    setError(null);
  };

  // Handle Enter key for form submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 1 && emailValid && !loading) {
        startTest();
      } else if (step === 2 && !loading) {
        startAnalysis();
      }
    }
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      showNotification('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  // Export report functionality
  const exportReport = () => {
    if (!report) return;
    
    try {
      const reportData = {
        testCode: testCode,
        userEmail: userEmail,
        timestamp: new Date().toISOString(),
        deliverabilityScore: report.deliverabilityScore,
        summary: report.metadata,
        details: report.results,
        recommendations: report.recommendations || []
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-deliverability-report-${testCode}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Report exported successfully!', 'success');
    } catch (error) {
      showNotification('Failed to export report', 'error');
      console.error('Export error:', error);
    }
  };

  // Share report functionality
  const shareReport = async () => {
    const shareText = `📧 Email Deliverability Test Results\n\n` +
      `Test Code: ${testCode}\n` +
      `Overall Score: ${report.deliverabilityScore}%\n` +
      `Inbox Delivery: ${report.metadata?.inboxDelivered || 0}/5\n` +
      `Promotions: ${report.metadata?.promotionsDelivered || 0}/5\n` +
      `Spam: ${report.metadata?.spamDelivered || 0}/5\n\n` +
      `Generated by Email Spam Report Tool`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Email Deliverability Report',
          text: shareText,
        });
        showNotification('Report shared successfully!', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
      showNotification('Report copied to clipboard!', 'success');
    }
  };

  // Load test inboxes on mount
  useEffect(() => {
    loadInboxes();
  }, []);

  const loadInboxes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/email-tests/inboxes`);
      const json = await res.json();
      if (json.success) {
        setTestInboxes(json.data);
      }
    } catch (err) {
      console.error('Failed to load inboxes:', err);
    }
  };

  const startTest = async () => {
    if (!userEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    setTestProgress(10);
    try {
      const res = await fetch(`${API_BASE}/api/email-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail })
      });
      const json = await res.json();
      setTestProgress(50);
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create test');
      }
      setTestCode(json.data.testCode);
      setTestProgress(100);
      setStep(2);
    } catch (err) {
      setError(err.message);
      setTestProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/email-tests/${testCode}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to start analysis');
      }
      setStep(3);
      setPolling(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll for results
  useEffect(() => {
    if (!polling || !testCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/email-tests/${testCode}/public`);
        const json = await res.json();
        if (json.success && json.data.status === 'completed') {
          setReport(json.data);
          setStep(4);
          setPolling(false);
          saveTestToHistory({ 
            testCode, 
            userEmail, 
            deliverabilityScore: json.data.deliverabilityScore 
          });
          showNotification('Email analysis completed!', 'success');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, testCode, userEmail, saveTestToHistory, showNotification]);

  const resetTest = () => {
    if (step > 2 && (testCode || report)) {
      if (!window.confirm('Are you sure you want to start a new test? This will clear your current progress.')) {
        return;
      }
    }
    setStep(1);
    setTestCode(null);
    setReport(null);
    setError(null);
    setPolling(false);
    setTestProgress(0);
    setUserEmail('');
    setEmailValid(false);
    showNotification('Test reset successfully', 'success');
  };

  // Quick demo email
  const fillDemoEmail = () => {
    setUserEmail('user@example.com');
    setEmailValid(true);
    showNotification('Demo email filled!', 'success');
  };

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 max-w-7xl">
      <div className="max-w-4xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg transition-all duration-300 max-w-sm sm:max-w-md mx-auto sm:mx-0 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6 sm:mb-8 lg:mb-12 overflow-x-auto pb-2 px-2">
          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4 min-w-max">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs xs:text-sm sm:text-base ${
                    step >= s
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-6 xs:w-8 sm:w-16 h-1 ${
                      step > s ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Recent Tests (only show on step 1 and if there are recent tests) */}
        {step === 1 && recentTests.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">📊 Recent Test History</h4>
            <div className="space-y-2">
              {recentTests.slice(0, 3).map((test, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">{test.testCode}</code>
                    <span className="text-gray-600 truncate max-w-32">{test.userEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      test.score >= 80 ? 'bg-green-100 text-green-700' :
                      test.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {test.score}%
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(test.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Show inboxes */}
        {step === 1 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 xs:p-4 sm:p-6 lg:p-8 mx-1 sm:mx-0">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Step 1: Test Inboxes
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Your email will be sent to these 5 test inboxes. We'll check where it lands.
            </p>
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {testInboxes.map((inbox, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                    {inbox.provider?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{inbox.displayName}</div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">{inbox.email}</div>
                  </div>
                  <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {inbox.provider}
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address (for receiving the report)
              </label>
              <div className="relative">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={userEmail}
                  onChange={handleEmailChange}
                  onKeyPress={handleKeyPress}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base transition-colors ${
                    userEmail && emailValid 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : userEmail && !emailValid 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email address (Press Enter to submit)"
                  required
                  autoComplete="email"
                  aria-describedby={userEmail && !emailValid ? "email-error" : undefined}
                />
                {userEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {emailValid ? (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {userEmail && !emailValid && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  Please enter a valid email address
                </p>
              )}
              {userEmail && emailValid && (
                <p className="mt-1 text-sm text-green-600" role="status">
                  ✓ Valid email address
                </p>
              )}
              {!userEmail && (
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={fillDemoEmail}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Use demo email
                  </button>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">Or enter your own email</span>
                </div>
              )}
            </div>
            <button
              onClick={startTest}
              disabled={loading || !emailValid}
              className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed mobile-full-width"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creating Test...</span>
                  {testProgress > 0 && <span>({testProgress}%)</span>}
                </div>
              ) : (
                'Generate Test Code'
              )}
            </button>
            
            {/* Test History */}
            <TestHistory userEmail={emailValid ? userEmail : null} />
          </div>
        )}

        {/* Step 2: Show test code */}
        {step === 2 && testCode && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 xs:p-4 sm:p-6 lg:p-8 mx-1 sm:mx-0">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Step 2: Send Your Email
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Include this test code in your email's <strong>subject or body</strong>, then send it to all 5 inboxes above.
            </p>
            <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Your Test Code:</div>
                <button
                  onClick={() => copyToClipboard(testCode)}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L14.586 13H19v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11.586V9a1 1 0 00-1-1H9.414l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 10H14a1 1 0 001 1v.586z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-blue-600 tracking-wider break-all">
                {testCode}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <span className="text-yellow-600 text-lg sm:text-xl">💡</span>
                <div className="text-xs sm:text-sm text-yellow-800 min-w-0">
                  <strong>Important:</strong> Send your email from your own email client to all {testInboxes.length} addresses listed above. Make sure to include the test code <code className="px-1 sm:px-2 py-1 bg-yellow-100 rounded text-xs sm:text-sm break-all">{testCode}</code> somewhere in the email.
                </div>
              </div>
            </div>

            {/* Email Template Suggestions */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">📧 Email Template Suggestions</h4>
              <div className="space-y-2 sm:space-y-3 custom-scrollbar" style={{maxHeight: '300px', overflowY: 'auto'}}>
                <div className="p-2 sm:p-3 bg-white rounded border text-xs sm:text-sm">
                  <div className="font-medium text-gray-700 mb-1">Marketing Email:</div>
                  <div className="text-gray-600">
                    <strong>Subject:</strong> Special Offer Inside - {testCode}<br />
                    <strong>Body:</strong> Hi there! Check out our amazing deals. Test Code: {testCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`Special Offer Inside - ${testCode}`)}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy Subject
                  </button>
                </div>
                <div className="p-2 sm:p-3 bg-white rounded border text-xs sm:text-sm">
                  <div className="font-medium text-gray-700 mb-1">Newsletter:</div>
                  <div className="text-gray-600">
                    <strong>Subject:</strong> Weekly Newsletter - {testCode}<br />
                    <strong>Body:</strong> Your weekly updates are here! Ref: {testCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`Weekly Newsletter - ${testCode}`)}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy Subject
                  </button>
                </div>
                <div className="p-2 sm:p-3 bg-white rounded border text-xs sm:text-sm">
                  <div className="font-medium text-gray-700 mb-1">Business Update:</div>
                  <div className="text-gray-600">
                    <strong>Subject:</strong> Important Business Update<br />
                    <strong>Body:</strong> We wanted to update you on recent changes. Reference: {testCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`Important Business Update`)}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy Subject
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={startAnalysis}
              disabled={loading}
              className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Starting Analysis...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414L8 7.414l2.293 2.293a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 7.586z" clipRule="evenodd" />
                  </svg>
                  <span>I've Sent the Email - Start Analysis</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Waiting for results */}
        {step === 3 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 xs:p-4 sm:p-6 lg:p-8 text-center mx-1 sm:mx-0">
            <div className="mb-4 sm:mb-6">
              <div className="inline-block animate-spin w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Analyzing Your Email...
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              We're checking all {testInboxes.length} inboxes for your email with code <code className="px-1 sm:px-2 py-1 bg-gray-100 rounded font-mono text-xs sm:text-sm break-all">{testCode}</code>
            </p>
            
            {/* Analysis Steps Progress */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-3">Analysis Progress:</div>
              <div className="space-y-2">
                <div className="flex items-center text-xs sm:text-sm">
                  <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Connecting to email providers...</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm">
                  <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-2" style={{animationDelay: '0.5s'}}></div>
                  <span className="text-gray-600">Searching for your test email...</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm">
                  <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-2" style={{animationDelay: '1s'}}></div>
                  <span className="text-gray-600">Checking inbox placement...</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm">
                  <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-2" style={{animationDelay: '1.5s'}}></div>
                  <span className="text-gray-600">Generating detailed report...</span>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-gray-500 space-y-1">
              <p>⏱️ This usually takes 2-5 minutes</p>
              <p>🔄 Results will appear automatically</p>
              <p>💡 You can close this tab and return later - your test will continue running</p>
            </div>
            
            <button
              onClick={resetTest}
              className="mt-4 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Start New Test
            </button>
          </div>
        )}

        {/* Step 4: Show report */}
        {step === 4 && report && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 xs:p-4 sm:p-6 lg:p-8 mx-1 sm:mx-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Deliverability Report
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Test Code: <code className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">{testCode}</code>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mobile-stack">
                <button
                  onClick={shareReport}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  <span>Share</span>
                </button>
                <button
                  onClick={exportReport}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center justify-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Export</span>
                </button>
                <button
                  onClick={resetTest}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition"
                >
                  New Test
                </button>
              </div>
            </div>

            {/* Score summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
                  {report.deliverabilityScore}%
                </div>
                <div className="text-xs sm:text-sm text-gray-700 font-medium">Overall Score</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                  {report.metadata?.inboxDelivered || 0}/5
                </div>
                <div className="text-xs sm:text-sm text-gray-700 font-medium">Inbox</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">
                  {report.metadata?.promotionsDelivered || 0}/5
                </div>
                <div className="text-xs sm:text-sm text-gray-700 font-medium">Promotions</div>
              </div>
            </div>

            {/* Detailed results */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Inbox Results:</h4>
              {report.testInboxes?.map((inbox, idx) => {
                const location = inbox.result?.location || 'not-found';
                const received = inbox.result?.received;
                const colorMap = {
                  inbox: 'bg-green-100 text-green-700 border-green-200',
                  spam: 'bg-red-100 text-red-700 border-red-200',
                  promotions: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                  'not-found': 'bg-gray-100 text-gray-700 border-gray-200'
                };
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border space-y-2 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                        {inbox.provider?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{inbox.email}</div>
                        <div className="text-xs sm:text-sm text-gray-500 capitalize">{inbox.provider}</div>
                      </div>
                    </div>
                    <span
                      className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg border font-medium text-xs sm:text-sm ${
                        colorMap[location]
                      } self-start sm:self-auto`}
                    >
                      {received
                        ? location === 'inbox'
                          ? '✓ Inbox'
                          : location === 'spam'
                          ? '✗ Spam'
                          : '⚠ Promotions'
                        : '− Not Found'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Shareable link */}
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-700 mb-2 font-medium">Shareable Report Link:</div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/report/${testCode}`}
                  className="flex-1 px-2 sm:px-3 py-2 border rounded bg-white text-xs sm:text-sm min-w-0"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/report/${testCode}`);
                    alert('Link copied!');
                  }}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded font-medium text-xs sm:text-sm hover:bg-blue-700 whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
