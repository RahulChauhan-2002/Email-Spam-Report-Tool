import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login' ? { email, password } : { name: name || email.split('@')[0], email, password };
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Auth failed');
      if (json.token) {
        localStorage.setItem('token', json.token);
        window.dispatchEvent(new Event('auth'));
        setMessage('Authenticated. Token saved.');
      } else if (json._id && json.email && json.role) {
        // Some responses might include fields directly; prefer json.token but handle alternative shapes
        if (json.token) {
          localStorage.setItem('token', json.token);
          window.dispatchEvent(new Event('auth'));
          setMessage('Authenticated. Token saved.');
        } else {
          setMessage('Authenticated but token missing in response');
        }
      } else {
        setMessage('Unexpected response');
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return (
    <div className="p-4 border rounded-lg shadow-md mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Auth</h2>
        <div className="text-sm text-gray-600">{token ? 'Logged in' : 'Not authenticated'}</div>
      </div>
      <form onSubmit={handleAuth} className="grid gap-2 md:grid-cols-3">
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="px-4 py-2 border rounded"
          >
            Switch to {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </div>
      </form>
      {message && <div className="mt-2 text-sm text-gray-700">{message}</div>}
    </div>
  );
}
