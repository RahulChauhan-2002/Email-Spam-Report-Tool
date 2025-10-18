import React, { useState } from 'react';

const DatabaseSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const seedDatabase = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('https://email-spam-report-tool.onrender.com/api/admin/seed-inboxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert('✅ Database seeded successfully! Please refresh the page.');
      }
    } catch (error) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">🔧 Database Setup Required</h3>
      <p className="text-yellow-700 mb-3">
        This appears to be a fresh deployment. Click below to initialize the database with test inboxes.
      </p>
      
      <button
        onClick={seedDatabase}
        disabled={loading}
        className={`px-4 py-2 rounded font-medium ${
          loading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
      >
        {loading ? 'Setting up database...' : 'Initialize Database'}
      </button>
      
      {result && (
        <div className={`mt-3 p-3 rounded ${
          result.success 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">
            {result.success ? '✅ Success!' : '❌ Error:'}
          </p>
          <p className="text-sm">{result.message}</p>
          {result.success && (
            <p className="text-sm mt-1">
              <strong>Please refresh the page to see the test inboxes.</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseSeeder;