import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReportStart,
  fetchReportSuccess,
  fetchReportFailure,
} from '../store/slices/reportSlice';

const API_BASE = import.meta.env.VITE_API_URL || 'https://email-spam-report-tool.onrender.com';

const Report = () => {
  const dispatch = useDispatch();
  const { report, loading, error } = useSelector((state) => state.report);
  const { testCode } = useSelector((state) => state.test);

  useEffect(() => {
    const fetchReport = async () => {
      if (!testCode) return;
      dispatch(fetchReportStart());
      try {
        const res = await fetch(`${API_BASE}/api/email-tests/${encodeURIComponent(testCode)}/public`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load report');
        }
        // Normalize to UI shape
        const data = json.data;
        const normalized = {
          testCode: data.testCode,
          deliverabilityScore: data.deliverabilityScore,
          results: (data.testInboxes || []).map((ti) => ({
            inbox: ti.email,
            status: ti.result?.location === 'inbox' ? 'Inbox'
                   : ti.result?.location === 'spam' ? 'Spam'
                   : ti.result?.location === 'promotions' ? 'Promotions'
                   : 'Not Found'
          }))
        };
        dispatch(fetchReportSuccess(normalized));
      } catch (err) {
        dispatch(fetchReportFailure(err.message));
      }
    };
    fetchReport();
  }, [testCode, dispatch]);

  if (!testCode) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg shadow-md mt-4">
      <h2 className="text-xl font-bold mb-4">Deliverability Report</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {report && (
        <div>
          <p className="mb-2">
            <span className="font-bold">Test Code:</span> {report.testCode}
          </p>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">Inbox</th>
                <th className="border-b p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((result) => (
                <tr key={result.inbox}>
                  <td className="border-b p-2">{result.inbox}</td>
                  <td className="border-b p-2">{result.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Report;
