import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function TestWorkflow() {
  const [step, setStep] = useState(1); // 1: show inboxes, 2: generate code, 3: waiting, 4: report
  const [testCode, setTestCode] = useState(null);
  const [testInboxes, setTestInboxes] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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
    if (!userEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/email-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create test');
      }
      setTestCode(json.data.testCode);
      setStep(2);
    } catch (err) {
      setError(err.message);
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
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, testCode]);

  const resetTest = () => {
    setStep(1);
    setTestCode(null);
    setReport(null);
    setError(null);
    setPolling(false);
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-16 h-1 ${
                    step > s ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Show inboxes */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Step 1: Test Inboxes
            </h3>
            <p className="text-gray-600 mb-6">
              Your email will be sent to these 5 test inboxes. We'll check where it lands.
            </p>
            <div className="space-y-3 mb-8">
              {testInboxes.map((inbox, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {inbox.provider?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{inbox.displayName}</div>
                    <div className="text-sm text-gray-500">{inbox.email}</div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {inbox.provider}
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address (for receiving the report)
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>
            <button
              onClick={startTest}
              disabled={loading}
              className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating Test...' : 'Generate Test Code'}
            </button>
          </div>
        )}

        {/* Step 2: Show test code */}
        {step === 2 && testCode && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Step 2: Send Your Email
            </h3>
            <p className="text-gray-600 mb-6">
              Include this test code in your email's <strong>subject or body</strong>, then send it to all 5 inboxes above.
            </p>
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
              <div className="text-sm text-gray-600 mb-2 font-medium">Your Test Code:</div>
              <div className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                {testCode}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-xl">💡</span>
                <div className="text-sm text-yellow-800">
                  <strong>Important:</strong> Send your email from your own email client to all {testInboxes.length} addresses listed above. Make sure to include the test code <code className="px-2 py-1 bg-yellow-100 rounded">{testCode}</code> somewhere in the email.
                </div>
              </div>
            </div>
            <button
              onClick={startAnalysis}
              disabled={loading}
              className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Starting Analysis...' : "I've Sent the Email - Start Analysis"}
            </button>
          </div>
        )}

        {/* Step 3: Waiting for results */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-block animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Analyzing Your Email...
            </h3>
            <p className="text-gray-600 mb-2">
              We're checking all {testInboxes.length} inboxes for your email with code <code className="px-2 py-1 bg-gray-100 rounded font-mono">{testCode}</code>
            </p>
            <p className="text-sm text-gray-500">
              This usually takes 2-5 minutes. Results will appear automatically.
            </p>
          </div>
        )}

        {/* Step 4: Show report */}
        {step === 4 && report && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Deliverability Report
              </h3>
              <button
                onClick={resetTest}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Run New Test
              </button>
            </div>

            {/* Score summary */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {report.deliverabilityScore}%
                </div>
                <div className="text-sm text-gray-700 font-medium">Overall Score</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {report.metadata?.inboxDelivered || 0}/5
                </div>
                <div className="text-sm text-gray-700 font-medium">Inbox</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {report.metadata?.promotionsDelivered || 0}/5
                </div>
                <div className="text-sm text-gray-700 font-medium">Promotions</div>
              </div>
            </div>

            {/* Detailed results */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-3">Inbox Results:</h4>
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
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {inbox.provider?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{inbox.email}</div>
                        <div className="text-sm text-gray-500 capitalize">{inbox.provider}</div>
                      </div>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-lg border font-medium text-sm ${
                        colorMap[location]
                      }`}
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
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-gray-700 mb-2 font-medium">Shareable Report Link:</div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/report/${testCode}`}
                  className="flex-1 px-3 py-2 border rounded bg-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/report/${testCode}`);
                    alert('Link copied!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
