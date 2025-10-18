import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TestHistory = ({ userEmail }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/email-tests/stats/${encodeURIComponent(userEmail)}`);
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch statistics');
      }
      
      setStats(json.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!userEmail) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-700">Error loading test history: {error}</p>
      </div>
    );
  }

  if (!stats || stats.totalTests === 0) {
    return (
      <div className="mt-6 p-4 border rounded-lg bg-blue-50">
        <h3 className="font-semibold text-blue-800 mb-2">📊 Test History</h3>
        <p className="text-blue-700">No previous tests found. This will be your first deliverability test!</p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">📊 Your Test History</h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{stats.totalTests}</div>
          <div className="text-sm text-blue-700">Total Tests</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded">
          <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
            {stats.averageScore}%
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>
      </div>

      {/* Recent Tests */}
      {stats.recentTests && stats.recentTests.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Recent Tests</h4>
          <div className="space-y-2">
            {stats.recentTests.map((test) => (
              <div key={test.testCode} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-mono text-sm text-gray-600">{test.testCode}</span>
                  <div className="text-xs text-gray-500">
                    {new Date(test.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(test.score)}`}>
                  {test.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Indicator */}
      {stats.trends && stats.trends.length >= 2 && (
        <div className="mt-4 pt-3 border-t">
          <div className="text-sm text-gray-600">
            {(() => {
              const latest = stats.trends[stats.trends.length - 1].score;
              const previous = stats.trends[stats.trends.length - 2].score;
              const change = latest - previous;
              
              if (change > 0) {
                return (
                  <span className="text-green-600">
                    📈 Improving: +{change}% from last test
                  </span>
                );
              } else if (change < 0) {
                return (
                  <span className="text-red-600">
                    📉 Declining: {change}% from last test
                  </span>
                );
              } else {
                return (
                  <span className="text-gray-600">
                    ➡️ Stable: Same as last test
                  </span>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestHistory;