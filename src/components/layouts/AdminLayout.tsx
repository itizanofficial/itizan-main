import React from 'react';
import { Outlet } from 'react-router-dom'; 
import { AdminSidebar } from './AdminSidebar';
import { Header } from './Header'; // تأكد إن مسار الهيدر صحيح عندك

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full font-sans overflow-hidden bg-gray-50 dark:bg-[#0F172A] text-gray-900 transition-colors" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};