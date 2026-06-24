import React, { useState, useEffect } from 'react';
import { X, User, PhoneCall, AlertTriangle, HeartPulse, Edit3, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { doctorService } from '../../../services/doctorService';

// 🌟 الدالة الفاجرة لحساب العمر أوتوماتيكياً
const calculateAge = (dobString: string) => {
  if (!dobString) return 'غير مدون';
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return `${age} سنة`;
};

// ... (مكون PatientDiagnosisSection زي ما هو بدون تغيير) ...
const PatientDiagnosisSection = ({ patientId, initialDiagnosis, onRefresh }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    setDiagnosis(initialDiagnosis || '');
    setIsEditing(false);
  }, [initialDiagnosis, patientId]);

  const handleSave = async () => {
    if (diagnosis.trim() === initialDiagnosis) {
      setIsEditing(false);
      return;
    }
    
    try {
      setIsSaving(true);
      await doctorService.updatePatientDiagnosis(patientId, diagnosis);
      setShowSuccessAlert(true);
      setIsEditing(false);
      onRefresh(); 
    } catch (error) {
      console.error("Error updating diagnosis:", error);
      alert('حدث خطأ أثناء حفظ التشخيص، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-2">
          <HeartPulse size={18} /> التشخيص والمعلومات الطبية
        </h3>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl hover:bg-emerald-100 font-bold transition-all"
          >
            <Edit3 size={12} /> تحرير السجل
          </button>
        )}
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 transition-all">
        <span className="block text-xs font-bold text-emerald-500/70 dark:text-emerald-400/70 mb-2">التشخيص السريري للحالة</span>
        {isEditing ? (
          <div className="space-y-3 animate-fade-in">
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-[#00838F] min-h-[100px] text-sm resize-none"
              placeholder="اكتب التشخيص التفصيلي هنا..."
              disabled={isSaving}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setIsEditing(false); setDiagnosis(initialDiagnosis || ''); }} 
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                إلغاء التعديل
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} اعتماد الحفظ
              </button>
            </div>
          </div>
        ) : (
          <p className="font-black text-emerald-900 dark:text-emerald-100 text-base leading-relaxed">
            {initialDiagnosis || 'لم يتم إدراج تشخيص طبي نهائي في السجل حتى الآن.'}
          </p>
        )}
      </div>

      {showSuccessAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h4 className="text-lg font-black text-gray-900 dark:text-white">تم الحفظ بنجاح</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-bold">تم تحديث التشخيص الطبي ومزامنة السجل بنجاح.</p>
            </div>
            <button 
              onClick={() => setShowSuccessAlert(false)} 
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              موافق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 🌟 الكومبوننت الأساسي 
export const PatientDetailsModal = ({ isOpen, onClose, patient, onRefresh }: any) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        <div className="bg-[#00838F] p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-black flex items-center gap-2">
            السجل الطبي - {patient.name || 'مراجع غير معرف'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* 1. البيانات الشخصية */}
          <div>
            <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center gap-2 mb-4">
              <User size={18} /> البيانات الديموغرافية
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div><span className="block text-xs font-bold text-gray-500 mb-1">الاسم الرباعي</span><span className="font-black text-gray-900 dark:text-white">{patient.name || 'غير مسجل'}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 mb-1">الهوية الوطنية / الإقامة</span><span className="font-black text-gray-900 dark:text-white" dir="ltr">{patient.national_id || patient.nationalId || 'غير مدون'}</span></div>
              
              {/* 🌟 استخدام الدالة لحساب العمر من تاريخ الميلاد */}
              <div>
                <span className="block text-xs font-bold text-gray-500 mb-1">العمر</span>
                <span className="font-black text-gray-900 dark:text-white">
                  {calculateAge(patient.birth_date || patient.dob)}
                </span>
              </div>
              
              <div><span className="block text-xs font-bold text-gray-500 mb-1">الجنس</span><span className="font-black text-gray-900 dark:text-white">{patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : patient.gender || 'غير مدون'}</span></div>
            </div>
          </div>

          {/* ... باقي الأقسام كما هي ... */}
          {/* 2. بيانات الاتصال */}
          <div>
            <h3 className="text-blue-600 dark:text-blue-400 font-black flex items-center gap-2 mb-4">
              <PhoneCall size={18} /> معلومات التواصل
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div><span className="block text-xs font-bold text-blue-500/70 dark:text-blue-400/70 mb-1">رقم الهاتف الأساسي</span><span className="font-black text-blue-900 dark:text-blue-100" dir="ltr">{patient.phone || 'غير متوفر'}</span></div>
              <div><span className="block text-xs font-bold text-blue-500/70 dark:text-blue-400/70 mb-1">البريد الإلكتروني</span><span className="font-black text-blue-900 dark:text-blue-100">{patient.email || 'غير متوفر'}</span></div>
              <div className="col-span-2"><span className="block text-xs font-bold text-blue-500/70 dark:text-blue-400/70 mb-1">محل الإقامة</span><span className="font-black text-blue-900 dark:text-blue-100">{patient.address || 'لم يتم تسجيل العنوان'}</span></div>
            </div>
          </div>

          {/* 3. جهة الاتصال في الطوارئ */}
          <div>
            <h3 className="text-orange-600 dark:text-orange-400 font-black flex items-center gap-2 mb-4">
              <AlertTriangle size={18} /> جهة الاتصال للحالات الطارئة
            </h3>
            <div className="grid grid-cols-3 gap-4 bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
              <div><span className="block text-xs font-bold text-orange-500/70 dark:text-orange-400/70 mb-1">اسم المرافق</span><span className="font-black text-orange-900 dark:text-orange-100">{patient.emergency_contact_name || patient.emergencyName || 'لا يوجد'}</span></div>
              <div><span className="block text-xs font-bold text-orange-500/70 dark:text-orange-400/70 mb-1">صلة القرابة</span><span className="font-black text-orange-900 dark:text-orange-100">{patient.emergency_contact_relation || patient.emergencyRelation || 'لا يوجد'}</span></div>
              <div><span className="block text-xs font-bold text-orange-500/70 dark:text-orange-400/70 mb-1">رقم الطوارئ</span><span className="font-black text-orange-900 dark:text-orange-100" dir="ltr">{patient.emergency_contact_phone || patient.emergencyPhone || 'لا يوجد'}</span></div>
            </div>
          </div>

          <PatientDiagnosisSection patientId={patient.id} initialDiagnosis={patient.diagnosis} onRefresh={onRefresh} />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
            إغلاق السجل
          </button>
        </div>

      </div>
    </div>
  );
};