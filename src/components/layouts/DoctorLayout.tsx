import React from 'react';
import { Outlet } from 'react-router-dom';
import { DoctorSidebar } from './DoctorSidebar';
import { Header } from './Header';

export const DoctorLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full font-sans overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300" dir="rtl">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-[#0f172a] transition-colors duration-300 custom-scrollbar">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};