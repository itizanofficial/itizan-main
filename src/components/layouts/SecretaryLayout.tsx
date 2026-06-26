import React from 'react';
import { Outlet } from 'react-router-dom';
import { SecretarySidebar } from './SecretarySidebar';

export const SecretaryLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-sans" dir="rtl">
      {/* القائمة الجانبية للسكرتير */}
      <SecretarySidebar />
      
      {/* الجزء الخاص بعرض محتوى الصفحات الداخلية */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {/* هنا بيتم حقن الصفحة زي الحجوزات أو الجلسات */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};