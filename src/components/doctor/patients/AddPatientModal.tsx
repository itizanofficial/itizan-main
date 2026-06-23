import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, UserPlus, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code'; 
import toast from 'react-hot-toast'; // 🌟 مكتبة الإشعارات الشيك
import { doctorService } from '../../../services/doctorService';

export const AddPatientModal = ({ isOpen, onClose }: any) => {
  const [copied, setCopied] = useState(false);
  const [doctorCode, setDoctorCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchCode = async () => {
        setIsLoading(true);
        try {
          const code = await doctorService.getCurrentDoctorCode();
          if (code) setDoctorCode(code);
        } catch (error) {
          console.error("Error:", error);
          setDoctorCode("تعذر توليد الرمز");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!doctorCode || doctorCode === "تعذر توليد الرمز") return;
    navigator.clipboard.writeText(doctorCode);
    setCopied(true);
    toast.success('تم نسخ كود الربط بنجاح! 📋'); // 🌟 إشعار احترافي يختفي تلقائياً
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col">
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="text-[#00838F]" /> فتح ملف طبي جديد
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center space-y-6 min-h-[300px] justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-[#00838F] dark:text-cyan-400">
              <Loader2 className="animate-spin" size={40} />
              <p className="font-bold text-sm">جاري تجهيز كود الربط المشفر...</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                وجه المراجع لمسح هذا الرمز من تطبيق العيادة لإتمام ربط الملف الطبي الخاص به.
              </p>

              <div className="p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm relative group flex justify-center items-center">
                <QRCode value={doctorCode || "empty"} size={160} fgColor="#111827" />
              </div>

              <div className="w-full">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">أو قم بنسخ المعرف المباشر:</label>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2">
                  <span className="font-black text-lg text-gray-900 dark:text-white px-4 tracking-widest" dir="ltr">
                    {doctorCode}
                  </span>
                  <button onClick={handleCopy} className={`p-3 rounded-lg flex items-center justify-center transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-[#E0F7FA] text-[#00838F] hover:bg-cyan-100'}`}>
                    {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};