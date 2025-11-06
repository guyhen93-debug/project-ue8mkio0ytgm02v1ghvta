import React from 'react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <div className="text-center p-8">
        <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-black font-bold text-2xl">PN</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Piternoufi Orders
        </h1>
        <p className="text-gray-600 mb-6">
          Quarry Management System
        </p>
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;