import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="font-bold text-gray-600">데이터를 불러오는 중입니다...</p>
  </div>
);