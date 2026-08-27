import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';

export const AppLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Header />
    <main id="main-content" className="flex-1">
      <Outlet />
    </main>
    <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} CropSage — AI Crop Advisory Assistant
        </p>
        <p className="text-xs text-gray-400 text-center">
          ⚠️ AI-generated advisories are decision-support tools only. Always consult qualified local agronomists.
        </p>
      </div>
    </footer>
  </div>
);
