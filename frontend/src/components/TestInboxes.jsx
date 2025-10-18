import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInboxesStart,
  fetchInboxesSuccess,
  fetchInboxesFailure,
} from '../store/slices/inboxSlice';

const API_BASE = import.meta.env.VITE_API_URL || 'https://email-spam-report-tool.onrender.com';

const TestInboxes = () => {
  const dispatch = useDispatch();
  const { inboxes, loading, error } = useSelector((state) => state.inboxes);

  useEffect(() => {
    const loadInboxes = async () => {
      dispatch(fetchInboxesStart());
      try {
        const res = await fetch(`${API_BASE}/api/email-tests/inboxes`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load inboxes');
        }
        const items = json.data.map((x, idx) => ({ id: idx + 1, email: x.email, provider: x.provider, displayName: x.displayName }));
        dispatch(fetchInboxesSuccess(items));
      } catch (err) {
        dispatch(fetchInboxesFailure(err.message));
      }
    };
    loadInboxes();
  }, [dispatch]);

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Test Inboxes</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-2">
        {inboxes.map((inbox) => (
          <li key={inbox.id} className="p-2 bg-gray-100 rounded">
            <span className="font-medium">{inbox.displayName || inbox.provider}:</span> {inbox.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestInboxes;
