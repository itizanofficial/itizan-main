import React, { useState, useEffect } from 'react';
import { HeartPulse, Edit3, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 استدعاء مكتبة الإشعارات الشيك
import { doctorService } from '../../../services/doctorService';

interface DiagnosisSectionProps {
  patientId: string;
  initialDiagnosis: string;
  onRefresh: () => void;
}

export const PatientDiagnosisSection: React.FC<DiagnosisSectionProps> = ({ patientId, initialDiagnosis, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      
      toast.success('تم تحديث التشخيص الطبي للمراجع  بنجاح.'); // 🌟 Toast شيك بدل الـ UI المعقد
      
      setIsEditing(false);
      onRefresh(); 
    } catch (error) {
      console.error("Error updating diagnosis:", error);
      toast.error('حدث خطأ أثناء حفظ التشخيص، يرجى المحاولة مرة أخرى.');
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
              placeholder="اكتب التشخيص التفصيلي هنا (مثال: يعاني المراجع من نوبات هلع متكررة واضطراب نوم مرتبط بالقلق...)"
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
    </div>
  );
};