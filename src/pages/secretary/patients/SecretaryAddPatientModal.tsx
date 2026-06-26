import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, UserPlus, Loader2, UserCheck } from 'lucide-react';
import QRCode from 'react-qr-code'; // 🌟 استخدام نفس مكتبة الـ QR الكود بتاع الدكتور
import { supabase } from '../../../services/supabase';

export const SecretaryAddPatientModal = ({ isOpen, onClose, doctors }: any) => {
  const [copied, setCopied] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorCode, setDoctorCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // 🌟 دالة التعامل مع اختيار الدكتور وجلب الكود الحقيقي بتاعه أو توليده
  const handleDoctorSelect = async (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    if (!doctorId) {
      setDoctorCode('');
      return;
    }

    setIsLoadingCode(true);
    try {
      // 1. نشوف هل الدكتور ده مسجل ليه كود في جدول الدكاترة ولا لأ
      const { data: doctor } = await supabase
        .from('doctors')
        .select('doctor_code')
        .eq('id', doctorId)
        .single();

      let code = doctor?.doctor_code;

      // 2. لو ملوش كود محفوظ، نولد كود حقيقي من أول 8 حروف من الـ ID بتاعه ونحفظه فوراً
      if (!code) {
        code = doctorId.slice(0, 8).toUpperCase();
        
        const { error: updateError } = await supabase
          .from('doctors')
          .update({ doctor_code: code })
          .eq('id', doctorId);

        if (updateError) {
          console.error("خطأ في حفظ كود الدكتور بالداتا بيز:", updateError);
        }
      }

      setDoctorCode(code);
    } catch (error) {
      console.error("Error fetching doctor code:", error);
      setDoctorCode("تعذر جلب الرمز");
    } finally {
      setIsLoadingCode(false);
    }
  };

  // تصفير البيانات عند قفل المودال
  useEffect(() => {
    if (!isOpen) {
      setSelectedDoctorId('');
      setDoctorCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!doctorCode || doctorCode === "تعذر جلب الرمز") return;
    navigator.clipboard.writeText(doctorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col font-sans">
        
        {/* الهيدر شيك جداً */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="text-[#00838F]" /> ربط ملف مريض جديد
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 🌟 خطوة 1: السكرتير بيختار الدكتور بس من لستة دكاترة العيادة */}
          <div className="bg-cyan-50/50 dark:bg-gray-800 p-4 rounded-2xl border border-cyan-100 dark:border-gray-700 shadow-sm">
            <label className="block text-xs font-black text-[#00838F] dark:text-cyan-400 mb-2">اختر الطبيب المعالج المطلوب ربط المريض به:</label>
            <div className="relative">
              <select 
                value={selectedDoctorId} 
                onChange={(e) => handleDoctorSelect(e.target.value)} 
                className="w-full bg-white dark:bg-gray-900 border border-cyan-200 dark:border-gray-700 rounded-xl px-10 py-3 font-bold text-sm text-gray-800 dark:text-white cursor-pointer outline-none focus:border-[#00838F]"
              >
                <option value="">-- اختر طبيب العيادة --</option>
                {doctors.map((d: any) => (
                  <option key={d.id} value={d.id}>د. {d.name || d.full_name}</option>
                ))}
              </select>
              <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00838F]" size={18} />
            </div>
          </div>

          {/* 🌟 خطوة 2: عرض الـ QR Code والكود الحقيقي بتاع الدكتور المختار */}
          <div className="flex flex-col items-center text-center justify-center min-h-[260px] border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50/30">
            {isLoadingCode ? (
              <div className="flex flex-col items-center gap-3 text-[#00838F]">
                <Loader2 className="animate-spin" size={36} />
                <p className="font-bold text-xs">جاري سحب كود الربط للمركز...</p>
              </div>
            ) : doctorCode ? (
              <>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 px-2">
                  وجه المريض لمسح هذا الرمز من تطبيق المريض (أو اعطه الكود) ليكتب بياناته بنفسه ويتم ربطه بهذا الدكتور فوراً.
                </p>

                {/* توليد الـ QR Code الحقيقي لقيمة كود الدكتور المسجل */}
                <div className="p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm mb-4">
                  <QRCode value={doctorCode} size={150} fgColor="#111827" />
                </div>

                <div className="w-full mt-2">
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">كود الربط المباشر الخاص بالطبيب:</label>
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 shadow-inner">
                    <span className="font-black text-base text-gray-900 dark:text-white px-3 tracking-widest" dir="ltr">
                      {doctorCode}
                    </span>
                    <button 
                      type="button" 
                      onClick={handleCopy} 
                      className={`p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-cyan-50 text-[#00838F] hover:bg-cyan-100'}`}
                    >
                      {copied ? <><CheckCircle2 size={16} /> <span className="text-[11px] font-bold">تم نسخ الكود</span></> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 font-bold text-sm px-6">
                يرجى تحديد الطبيب من القائمة بالأعلى ليظهر كود الـ QR والربط المباشر الخاص به هنا.
              </div>
            )}
          </div>
        </div>

        {/* فوتر بسيط لقفل النافذة */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-300 transition-colors">
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};