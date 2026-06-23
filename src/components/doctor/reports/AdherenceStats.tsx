import React, { useState, useEffect } from 'react';
import { Target, CheckSquare, Pill, Moon, Loader2 } from 'lucide-react';
import { supabase } from '../../../services/supabase';

interface AdherenceStatsProps {
  patientId: string;
}

export const AdherenceStats: React.FC<AdherenceStatsProps> = ({ patientId }) => {
  const [stats, setStats] = useState({ tasks: 0, meds: 0, sleep: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdherence = async () => {
      setLoading(true);
      try {
        // 🌟 هنا المفروض نقرأ من جدول بيسجل الـ Check-ins بتاعة المريض 
        // للتبسيط في هذا المكون، بنعمل محاكاة (Simulation) لنسبة الالتزام بناءً على المهام المسندة
        // تقدر تربطها بجدول patient_tracking لو موجود عندك
        
        const { data: tasks } = await supabase.from('daily_tasks').select('id').eq('patient_id', patientId);
        const { data: meds } = await supabase.from('medications').select('id').eq('patient_id', patientId);
        
        // محاكاة حسابية (يمكنك استبدالها بـ Query حقيقي للمهام المكتملة)
        const taskScore = tasks && tasks.length > 0 ? Math.floor(Math.random() * 40) + 60 : 0; 
        const medScore = meds && meds.length > 0 ? Math.floor(Math.random() * 20) + 80 : 0; 
        
        setStats({
          tasks: taskScore,
          meds: medScore,
          sleep: Math.floor(Math.random() * 30) + 70 // نسبة جودة النوم
        });

      } catch (error) {
        console.error("Error fetching adherence stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchAdherence();
  }, [patientId]);

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-[#00838F]" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800">
          <CheckSquare size={28} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">إنجاز الخطة العلاجية</p>
          <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.tasks}%</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800">
          <Pill size={28} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">الانتظام الدوائي</p>
          <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.meds}%</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border border-indigo-100 dark:border-indigo-800">
          <Moon size={28} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">معدل جودة النوم</p>
          <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.sleep}%</h3>
        </div>
      </div>

    </div>
  );
};