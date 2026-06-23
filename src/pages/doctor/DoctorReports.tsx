import React, { useState, useEffect } from 'react';
import { FileBarChart, Loader2, User } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { AdherenceStats } from '../../components/doctor/reports/AdherenceStats';
import { ProgressChart } from '../../components/doctor/reports/ProgressChart';

export const DoctorReports: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // جلب قائمة المراجعين المرتبطين بالطبيب
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('patients')
          .select('id, name, diagnosis')
          .eq('doctor_id', user.id);
          
        if (data && data.length > 0) {
          setPatients(data);
          setSelectedPatientId(data[0].id); // اختيار أول مريض افتراضياً
        }
      } catch (error) {
        console.error("Error fetching patients for reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans text-gray-900 dark:text-white">
      
      {/* الهيدر واختيار المراجع */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-[#00838F] dark:text-cyan-400">
            <FileBarChart size={32} /> التقارير السريرية الشاملة
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">
            تحليل مستوى الالتزام بالخطط العلاجية وتتبع التحسن.
          </p>
        </div>
        
        <div className="w-full md:w-72 relative">
          <select 
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3.5 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 font-bold text-sm appearance-none cursor-pointer"
          >
            <option value="" disabled>-- حدد ملف المراجع --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.diagnosis || 'غير مصنف'})</option>
            ))}
          </select>
          <User className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00838F]" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#00838F] dark:text-cyan-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="font-bold">جاري معالجة التقارير الحيوية...</p>
        </div>
      ) : !selectedPatientId ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
          يرجى اختيار مراجع من القائمة لعرض تقريره السريري.
        </div>
      ) : (
        <div className="space-y-6">
          {/* مكون الإحصائيات (نسبة إنجاز المهام، النوم، الأدوية) */}
          <AdherenceStats patientId={selectedPatientId} />
          
          {/* مكون الرسم البياني للتقدم */}
          <ProgressChart patientId={selectedPatientId} />
        </div>
      )}
    </div>
  );
};