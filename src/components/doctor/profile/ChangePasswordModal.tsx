import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الإشعارات
import { changeDoctorPassword } from '../../../services/doctorProfileService'; 

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة. يرجى التأكد من الإدخال.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('تتطلب سياسة الأمان 6 أحرف على الأقل لكلمة المرور.');
      return;
    }

    setLoading(true);
    const success = await changeDoctorPassword(newPassword);
    setLoading(false);
    
    if (success) {
      toast.success('تم تحديث بيانات الاعتماد (كلمة المرور) بنجاح.');
      onClose();
    } else {
      toast.error('تعذر تحديث مسوغات الدخول، يرجى مراجعة الخادم.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4 font-sans" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
        
        {/* الهيدر */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-[#00838F] dark:text-cyan-400 text-xl font-black">تحديث بيانات الأمان</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* المحتوى (الفورم) */}
        <div className="p-8 space-y-5">
          
          {/* كلمة المرور الحالية */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الحالية</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"} 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all text-left font-sans font-bold"
                dir="ltr"
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00838F] transition-colors"
              >
                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* كلمة المرور الجديدة */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الجديدة</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all text-left font-sans font-bold"
                dir="ltr"
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00838F] transition-colors"
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تأكيد كلمة المرور</label>
            <div className="relative">
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all text-left font-sans font-bold"
                dir="ltr"
              />
            </div>
          </div>

        </div>

        {/* الفوتر */}
        <div className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            إلغاء
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="px-8 py-2.5 rounded-xl bg-[#00838F] hover:bg-[#006064] text-white font-black transition-colors disabled:opacity-50 shadow-md"
          >
            {loading ? 'جاري التحديث...' : 'اعتماد التغيير'}
          </button>
        </div>

      </div>
    </div>
  );
};