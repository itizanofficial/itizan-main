import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Activity, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../services/supabase';

export const AdherenceStats: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ adherence: 0, totalMinutes: 0, completedSessions: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessionStats = async () => {
      setLoading(true);
      try {
        // جلب كل الجلسات الخاصة بالمريض
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, status, session_date, duration')
          .eq('patient_id', patientId)
          .order('session_date', { ascending: true });

        if (sessions && sessions.length > 0) {
          // حساب الجلسات المكتملة
          const completed = sessions.filter(s => s.status === 'مكتملة' || s.status === 'completed');
          
          // حساب نسبة الالتزام
          const adherenceRate = Math.round((completed.length / sessions.length) * 100);
          
          // حساب إجمالي الدقائق (بافتراض أن الجلسة 60 دقيقة لو مفيش حقل duration)
          const minutes = completed.reduce((total, session) => total + (session.duration || 60), 0);

          setStats({ adherence: adherenceRate, totalMinutes: minutes, completedSessions: completed.length });

          // تجهيز بيانات الرسم البياني (آخر 5 جلسات/أسابيع)
          const last5 = sessions.slice(-5).map((s, index) => ({
            name: `أسبوع ${index + 1}`,
            sessions: s.status === 'مكتملة' || s.status === 'completed' ? 2 : 1 // تمثيل رقمي
          }));
          
          // لو الجلسات أقل من 5، نكملهم عشان شكل الشارت
          while(last5.length < 5) {
            last5.unshift({ name: `أسبوع ${5 - last5.length}`, sessions: 0 });
          }
          setChartData(last5);
        } else {
          // Fallback في حالة عدم وجود جلسات
          setStats({ adherence: 0, totalMinutes: 0, completedSessions: 0 });
          setChartData([
            { name: 'الأسبوع 1', sessions: 0 }, { name: 'الأسبوع 2', sessions: 0 },
            { name: 'الأسبوع 3', sessions: 0 }, { name: 'الأسبوع 4', sessions: 0 }, { name: 'الأسبوع 5', sessions: 0 }
          ]);
        }
      } catch (error) {
        console.error("Error fetching sessions stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchSessionStats();
  }, [patientId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00838F]" size={32} /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-[#00838F]" size={20} />
        <h3 className="text-lg font-black text-gray-800 dark:text-white">نظرة عامة على الجلسات</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between hover:border-cyan-200 transition-colors">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.adherence}%</h3>
            <p className="text-sm font-bold text-gray-500 mt-1">نسبة الالتزام</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-[#00838F] flex items-center justify-center border border-cyan-100 dark:border-cyan-800">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalMinutes}</h3>
            <p className="text-sm font-bold text-gray-500 mt-1">إجمالي الدقائق</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center border border-blue-100 dark:border-blue-800">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-colors">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.completedSessions}</h3>
            <p className="text-sm font-bold text-gray-500 mt-1">جلسات مكتملة</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm mt-6 h-64">
        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-6 text-center">توزيع الجلسات (5 أسابيع الأخيرة)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6B7280' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip cursor={{ fill: 'rgba(0, 131, 143, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} />
            <Bar dataKey="sessions" fill="#00838F" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};