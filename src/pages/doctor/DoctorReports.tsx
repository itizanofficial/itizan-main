import React, { useState, useEffect } from 'react';
import { FileText, Download, FileBarChart, Loader2, CheckCircle2, Activity, BrainCircuit, Clock, Pill, Moon } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { reportsService } from '../../services/reportsService';

import { AdherenceStats } from '../../components/doctor/reports/AdherenceStats';
import { ProgressChart } from '../../components/doctor/reports/ProgressChart';

const calculateAge = (dobString: string) => {
  if (!dobString) return 'غير مدون';
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) { age--; }
  return `${age} سنة`;
};

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
  
  // 🌟 استيت الداتا الحقيقية
  const [treatmentSummary, setTreatmentSummary] = useState({ 
    medAdherence: 0, 
    taskAdherence: 0, 
    sleepAdherence: 0, 
    doctorNotes: '', 
    recommendations: [] as string[] 
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
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

  const handleGenerateReport = async () => {
    if (selectedPatientId) {
      const summary = await reportsService.getTreatmentSummary(selectedPatientId);
      setTreatmentSummary(summary);
      setIsReportGenerated(true);
    }
  };

  const selectedPatientData = patients.find(p => p.id === selectedPatientId);

  return (
    <div dir="rtl" className="space-y-8 animate-fade-in pb-12 font-sans text-gray-900 dark:text-white max-w-6xl mx-auto">
      
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">إدارة ملفات المرضى (التقارير)</h1>
          <p className="text-sm font-bold text-gray-500">عرض وإدارة جميع تقارير المرضى السريرية</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="bg-cyan-50/50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00838F] text-white rounded-lg flex items-center justify-center">
              <FileBarChart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">منشئ التقارير</h2>
              <p className="text-xs font-bold text-gray-500">املأ البيانات التالية لإنشاء تقرير مفصل</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-black text-[#00838F] mb-3">
              <span className="w-6 h-6 rounded-full bg-cyan-100 text-[#00838F] flex items-center justify-center text-xs">1</span>
              اختيار المريض
            </label>
            <select 
              value={selectedPatientId}
              onChange={(e) => { setSelectedPatientId(e.target.value); setIsReportGenerated(false); }}
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-4 outline-none focus:border-[#00838F] font-bold text-gray-700 dark:text-gray-200"
            >
              <option value="" disabled>-- حدد مريض من القائمة --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.diagnosis || 'بدون تشخيص'})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-400">{selectedPatientId ? 'تم ربط السجلات بنجاح' : 'جميع الحقول مطلوبة'}</span>
            <button 
              onClick={handleGenerateReport}
              disabled={!selectedPatientId}
              className="bg-[#00838F] hover:bg-[#006064] text-white px-10 py-3 rounded-xl font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              عرض التقرير 
            </button>
          </div>
        </div>
      </div>

      {isReportGenerated && selectedPatientData && (
        <div className="bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-gray-700 animate-fade-in space-y-8 shadow-inner">
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 flex justify-between items-center flex-wrap gap-4 shadow-sm border-r-4 border-r-[#00838F]">
            <div><span className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><FileText size={12}/> الاسم الكامل</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{selectedPatientData.name}</h3></div>
            <div><span className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><Activity size={12}/> العمر</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{calculateAge(selectedPatientData.birth_date || selectedPatientData.dob)}</h3></div>
            <div><span className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><BrainCircuit size={12}/> التشخيص</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{selectedPatientData.diagnosis || 'غير محدد'}</h3></div>
            <div><span className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><Clock size={12}/> مدة المتابعة</span><h3 className="font-black text-gray-900 dark:text-white text-lg">{calculateDuration(selectedPatientData.created_at)}</h3></div>
          </div>

          <AdherenceStats patientId={selectedPatientId} />
          <ProgressChart patientId={selectedPatientId} />

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <Pill className="text-[#00838F]" size={20} /> ملخص العلاج
            </h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  <span>العلاج المعرفي السلوكي (إتمام المهام)</span>
                  <span className="text-[#00838F]">{treatmentSummary.taskAdherence}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-[#00838F] h-2.5 rounded-full" style={{ width: `${treatmentSummary.taskAdherence}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  <span>العلاج الدوائي (الالتزام بالجرعات)</span>
                  <span className="text-blue-500">{treatmentSummary.medAdherence}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${treatmentSummary.medAdherence}%` }}></div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">الالتزام بالأدوية: {treatmentSummary.medAdherence > 0 ? `${treatmentSummary.medAdherence}%` : '0%'}</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl border border-purple-100">
                  <Moon size={16} className="text-purple-500" />
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400">النوم المنتظم: {treatmentSummary.sleepAdherence}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#00838F]"></div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="text-[#00838F]" size={20} /> ملاحظات الطبيب والتوصيات
            </h3>
            
            {/* 🌟 داتا حقيقية 100% من الجلسات */}
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {treatmentSummary.doctorNotes}
            </p>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-black text-gray-500 mb-2 block">التوصيات المجدولة (من الخطط):</span>
              {treatmentSummary.recommendations && treatmentSummary.recommendations.length > 0 ? (
                <ul className="text-sm font-bold text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1.5 pl-2">
                  {treatmentSummary.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-bold text-gray-400">لا توجد توصيات سريرية مدرجة حالياً للمريض.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
            <p className="text-xs font-bold text-gray-400">تم إنشاء التقرير في {new Date().toLocaleDateString('ar-EG')} - الساعة {new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-[#00838F] text-[#00838F] hover:bg-cyan-50 dark:hover:bg-cyan-900/20 font-black text-sm transition-all">
              <Download size={18} /> تحميل PDF
            </button>
          </div>

        </div>
      )}
    </div>
  );
};