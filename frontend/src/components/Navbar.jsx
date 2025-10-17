import React from 'react';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">✓</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Email Deliverability Test</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Free Tool</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
