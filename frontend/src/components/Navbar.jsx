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
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              <span className="hidden sm:inline">Email Spam Report Tool</span>
              <span className="sm:hidden">Email Tool</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs sm:text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Free Tool
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
