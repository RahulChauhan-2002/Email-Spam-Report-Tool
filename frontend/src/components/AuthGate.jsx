import React, { useEffect, useState } from 'react';
import Auth from './Auth';

export default function AuthGate({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t || null);
    const handler = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', handler);
    window.addEventListener('auth', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('auth', handler);
    };
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <h1 className="text-3xl font-bold text-center mb-6">Email Spam Report Tool</h1>
          <div className="border rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Welcome</h2>
            <p className="text-sm text-gray-600 mb-4">Please login or register to continue.</p>
            <Auth />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
