import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startTestStart,
  startTestSuccess,
  startTestFailure,
} from '../store/slices/testSlice';

const API_BASE = import.meta.env.VITE_API_URL || 'https://email-spam-report-tool.onrender.com';

const TestCode = () => {
  const dispatch = useDispatch();
  const { testCode, loading, error } = useSelector((state) => state.test);
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [automaticSending, setAutomaticSending] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generateTestCode = async () => {
    // Validate email
    if (!userEmail.trim()) {
      setEmailError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(userEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    dispatch(startTestStart());
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/email-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userEmail: userEmail.trim() })
      });
      
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create test');
      }
      
      const code = json.data?.testCode;
      const autoEmailSent = json.data?.automaticEmailSending || false;
      
      setAutomaticSending(autoEmailSent);
      dispatch(startTestSuccess(code));
      
    } catch (error) {
      dispatch(startTestFailure(error.message));
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-md mt-4 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Start Email Deliverability Test</h2>
      
      <div className="mb-6">
        <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Your Email Address
        </label>
        <input
          type="email"
          id="userEmail"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="Enter your email to receive the report"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
        <p className="text-sm text-gray-600 mt-1">
          We'll send you the deliverability report when the test completes
        </p>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Creating test and sending emails...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {testCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-800 mb-2">✅ Test Created Successfully!</h3>
          <div className="bg-white border border-green-300 rounded p-3 mb-3">
            <p className="text-sm text-gray-600 mb-1">Test Code:</p>
            <p className="font-mono text-lg text-green-700 font-bold">{testCode}</p>
          </div>
          
          {automaticSending ? (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-blue-800 font-medium">🚀 Emails sent automatically!</p>
              <p className="text-blue-700 text-sm">
                Test emails have been sent to all inboxes. Analysis will begin shortly.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-yellow-800 font-medium">📧 Manual email sending required</p>
              <p className="text-yellow-700 text-sm">
                Please send an email with test code "{testCode}" to the inboxes shown below.
              </p>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={generateTestCode}
        disabled={loading || !userEmail.trim()}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          loading || !userEmail.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {loading ? 'Creating Test...' : 'Start Deliverability Test'}
      </button>
    </div>
  );
};

export default TestCode;
