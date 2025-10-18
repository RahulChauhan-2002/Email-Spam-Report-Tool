import React from 'react';

export default function Hero() {
  return (
    <section className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
          Email Spam Checker & Deliverability Test
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          Ensure your emails land in the inbox, not the spam folder. Test deliverability across Gmail, Outlook, Yahoo, and more.
        </p>
        <div className="inline-block px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
          Start Your Test Below
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 px-4">
          Get results in less than 5 minutes • No credit card required
        </p>
      </div>

      {/* Visual preview */}
      <div className="mt-8 sm:mt-12 lg:mt-16 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 text-white flex flex-col sm:flex-row items-center justify-between space-y-1 sm:space-y-0">
            <span className="font-semibold text-sm sm:text-base">Sample Deliverability Report</span>
            <span className="text-xs sm:text-sm opacity-90">Test completed in 3m 42s</span>
          </div>
          <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-3 gap-3 sm:gap-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1 sm:mb-2">80%</div>
              <div className="text-xs sm:text-sm text-gray-600">Inbox Placement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-600 mb-1 sm:mb-2">15%</div>
              <div className="text-xs sm:text-sm text-gray-600">Promotions Tab</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-1 sm:mb-2">5%</div>
              <div className="text-xs sm:text-sm text-gray-600">Spam Folder</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
