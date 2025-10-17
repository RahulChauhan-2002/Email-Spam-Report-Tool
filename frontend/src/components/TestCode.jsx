import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startTestStart,
  startTestSuccess,
  startTestFailure,
} from '../store/slices/testSlice';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TestCode = () => {
  const dispatch = useDispatch();
  const { testCode, loading, error } = useSelector((state) => state.test);

  const generateTestCode = async () => {
    dispatch(startTestStart());
    try {
      const token = localStorage.getItem('token');
      // For now, no auth header; backend route currently protected, consider adding JWT later
      const res = await fetch(`${API_BASE}/api/email-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create test');
      }
      const code = json.data?.testCode;
      dispatch(startTestSuccess(code));
    } catch (error) {
      dispatch(startTestFailure(error.message));
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md mt-4">
      <h2 className="text-xl font-bold mb-4">Your Test Code</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {testCode && (
        <div className="p-2 bg-blue-100 text-blue-800 rounded">
          {testCode}
        </div>
      )}
      <button
        onClick={generateTestCode}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Start New Test
      </button>
    </div>
  );
};

export default TestCode;
