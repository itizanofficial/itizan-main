import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

const ToggleSwitch = ({ checked }: { checked: boolean }) => (
  <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-[#00838F]' : 'bg-gray-200 dark:bg-gray-700'}`}>
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-[-24px]' : 'translate-x-0'}`}></div>
  </div>
);

export const SecurityInfo = () => {
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto relative">
      <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center justify-center gap-2 mb-8">
        <Shield size={22} /> بروتوكولات الأمان والمصادقة
      </h3>
      
      <div className="space-y-4">
        
        {/* تغيير كلمة المرور */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-3xl gap-4">
          <div>
            <h4 className="font-black text-gray-900 dark:text-white text-lg mb-1">مسوغات الدخول (كلمة المرور)</h4>
            <p className="text-sm font-bold text-gray-500">تحديث كلمة المرور لضمان أمان السجلات الطبية</p>
          </div>
          <button 
            onClick={() => setPasswordModalOpen(true)}
            className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
          >
            تحديث مسوغات الدخول
          </button>
        </div>

        {/* المصادقة الثنائية */}
        <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-3xl">
          <div>
            <h4 className="font-black text-gray-900 dark:text-white text-lg mb-1">المصادقة الثنائية (2FA)</h4>
            <p className="text-sm font-bold text-gray-500">طبقة حماية إضافية لحسابك السريري</p>
          </div>
          <ToggleSwitch checked={false} />
        </div>

      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </div>
  );
};