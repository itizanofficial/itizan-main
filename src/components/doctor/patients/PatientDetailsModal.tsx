import React from 'react';
import { X, User, PhoneCall, AlertTriangle } from 'lucide-react';
import { PatientDiagnosisSection } from './PatientDiagnosisSection'; 

export const PatientDetailsModal = ({ isOpen, onClose, patient, onRefresh }: any) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#00838F] p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-black flex items-center gap-2">
            السجل الطبي - {patient.name || 'مراجع غير معرف'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* 1. البيانات الشخصية */}
          <div>
            <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center gap-2 mb-4">
              <User size={18} /> البيانات الديموغرافية
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div><span className="block text-xs font-bold text-gray-500 mb-1">الاسم الرباعي</span><span className="font-black text-gray-900 dark:text-white">{patient.name || 'غير مسجل'}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 mb-1">الهوية الوطنية / الإقامة</span><span className="font-black text-gray-900 dark:text-white" dir="ltr">{patient.nationalId || 'غير مدون'}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 mb-1">العمر</span><span className="font-black text-gray-900 dark:text-white">{patient.age ? `${patient.age} سنة` : 'غير مدون'}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 mb-1">الجنس</span><span className="font-black text-gray-900 dark:text-white">{patient.gender || 'غير مدون'}</span></div>
            </div>
          </div>

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
              <div><span className="block text-xs font-bold text-orange-500/70 dark:text-orange-400/70 mb-1">اسم المرافق</span><span className="font-black text-orange-900 dark:text-orange-100">{patient.emergencyName || 'لا يوجد'}</span></div>
              <div><span className="block text-xs font-bold text-orange-500/70 dark:text-orange-400/70 mb-1">صلة القرابة</span><span className="font-black text-orange-900 dark:text-orange-100">{patient.emergencyRelation || 'لا يوجد'}</span></div>
              <div><span className="block text-xs font-bold text-orange-500/70 dark:text-orange-400/70 mb-1">رقم الطوارئ</span><span className="font-black text-orange-900 dark:text-orange-100" dir="ltr">{patient.emergencyPhone || 'لا يوجد'}</span></div>
            </div>
          </div>

          {/* 4. قسم المعلومات الطبية */}
          <PatientDiagnosisSection 
            patientId={patient.id} 
            initialDiagnosis={patient.diagnosis} 
            onRefresh={onRefresh} 
          />

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