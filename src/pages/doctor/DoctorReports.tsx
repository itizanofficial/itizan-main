import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Send, FileBarChart, Loader2, CheckCircle2, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { AdherenceStats } from '../../components/doctor/reports/AdherenceStats';
import { ProgressChart } from '../../components/doctor/reports/ProgressChart';

// دالة حساب العمر الحقيقية
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

// دالة حساب مدة المتابعة بالأشهر
const calculateDuration = (createdAt: string) => {
  if (!createdAt) return 'غير محدد';
  const start = new Date(createdAt);
  const now = new Date();
  const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return diffMonths === 0 ? 'أقل من شهر' : `${diffMonths} أشهر`;
};

export const DoctorReports: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('آخر 3 أشهر');
  const [reportType, setReportType] = useState('شامل');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // جلب الداتا الكاملة للمريض عشان نعرض العمر وتاريخ التسجيل
        const { data } = await supabase.from('patients').select('*').eq('doctor_id', user.id);
        if (data) setPatients(data);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleGenerateReport = () => {
    if (selectedPatientId) {
      setIsReportGenerated(true);
    }
  };

  const selectedPatientData = patients.find(p => p.id === selectedPatientId);

  return (
    <div dir="rtl" className="space-y-8 animate-fade-in pb-12 font-sans text-gray-900 dark:text-white max-w-6xl mx-auto">
      
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">إدارة التقارير السريرية</h1>
          <p className="text-sm font-bold text-gray-500">إنشاء وعرض التقارير الطبية للمراجعين</p>
        </div>
        <button onClick={() => { setIsReportGenerated(false); setSelectedPatientId(''); }} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-md">
          + إنشاء تقرير جديد
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="bg-cyan-50/50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00838F] text-white rounded-lg flex items-center justify-center">
              <FileBarChart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">منشئ التقارير</h2>
              <p className="text-xs font-bold text-gray-500">املأ البيانات التالية لإنشاء تقرير مفصل مبني على قاعدة البيانات</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400">مباشر ومزامن</span>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-black text-[#00838F] mb-3">
              <span className="w-6 h-6 rounded-full bg-cyan-100 text-[#00838F] flex items-center justify-center text-xs">1</span>
              اختيار المراجع
            </label>
            <select 
              value={selectedPatientId}
              onChange={(e) => { setSelectedPatientId(e.target.value); setIsReportGenerated(false); }}
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-4 outline-none focus:border-[#00838F] font-bold text-gray-700 dark:text-gray-200"
            >
              <option value="" disabled>-- حدد مراجع من القائمة --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.diagnosis || 'تشخيص عام'})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-400">{selectedPatientId ? 'تم ربط السجلات بنجاح' : 'في انتظار اختيار المراجع'}</span>
            <button 
              onClick={handleGenerateReport}
              disabled={!selectedPatientId}
              className="bg-[#00838F] hover:bg-[#006064] text-white px-8 py-3 rounded-xl font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              عرض التقرير  
            </button>
          </div>
        </div>
      </div>

      {isReportGenerated && selectedPatientData && (
        <div className="bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-gray-700 animate-fade-in space-y-8 shadow-inner" id="report-content">
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 flex justify-between items-center flex-wrap gap-4 shadow-sm border-r-4 border-r-[#00838F]">
            <div><span className="block text-xs font-bold text-gray-400 mb-1">الاسم الكامل</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{selectedPatientData.name}</h3></div>
            {/* استخدام دالة العمر الحقيقية */}
            <div><span className="block text-xs font-bold text-gray-400 mb-1">العمر</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{calculateAge(selectedPatientData.birth_date || selectedPatientData.dob)}</h3></div>
            <div><span className="block text-xs font-bold text-gray-400 mb-1">التشخيص الحالي</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{selectedPatientData.diagnosis || 'قيد التقييم'}</h3></div>
            {/* حساب مدة المتابعة بناءً على تاريخ إنشاء الملف في قاعدة البيانات */}
            <div><span className="block text-xs font-bold text-gray-400 mb-1">مدة المتابعة</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{calculateDuration(selectedPatientData.created_at)}</h3></div>
          </div>

          <AdherenceStats patientId={selectedPatientId} />
          <ProgressChart patientId={selectedPatientId} />

          <div className="flex flex-wrap justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
            <p className="text-xs font-bold text-gray-400">تاريخ إصدار التقرير: {new Date().toLocaleDateString('ar-EG')} - الساعة {new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#00838F] text-[#00838F] hover:bg-cyan-50 dark:hover:bg-cyan-900/20 font-black text-sm transition-all">
                <Download size={18} /> طباعة / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};