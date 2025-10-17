import React from 'react';

export default function Hero() {
  return (
    <section className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Email Spam Checker & Deliverability Test
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Ensure your emails land in the inbox, not the spam folder. Test deliverability across Gmail, Outlook, Yahoo, and more.
        </p>
        <div className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
          Start Your Test Below
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Get results in less than 5 minutes • No credit card required
        </p>
      </div>

      {/* Visual preview */}
      <div className="mt-16 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
            <span className="font-semibold">Sample Deliverability Report</span>
            <span className="text-sm opacity-90">Test completed in 3m 42s</span>
          </div>
          <div className="p-8 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">80%</div>
              <div className="text-sm text-gray-600">Inbox Placement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">15%</div>
              <div className="text-sm text-gray-600">Promotions Tab</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">5%</div>
              <div className="text-sm text-gray-600">Spam Folder</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
