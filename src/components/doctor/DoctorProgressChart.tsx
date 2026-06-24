import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../services/supabase';
import { Loader2 } from 'lucide-react';

export const DoctorProgressChart: React.FC = () => {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // جلب كل الجلسات الخاصة بالطبيب
        const { data: sessions, error } = await supabase
          .from('sessions')
          .select('session_date, status')
          .eq('doctor_id', user.id)
          .order('session_date', { ascending: true });

        if (error) throw error;

        // تجميع البيانات حسب الشهر
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const groupedData: Record<string, { name: string; completed: number; active: number }> = {};

        if (sessions && sessions.length > 0) {
          sessions.forEach(session => {
            if (!session.session_date) return;
            const d = new Date(session.session_date);
            const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
            const monthName = monthNames[d.getMonth()];

            if (!groupedData[monthKey]) {
              groupedData[monthKey] = { name: monthName, completed: 0, active: 0 };
            }

            if (session.status === 'completed' || session.status === 'مكتملة') {
              groupedData[monthKey].completed += 1;
            } else {
              groupedData[monthKey].active += 1;
            }
          });

          // تحويل الكائن إلى مصفوفة للرسم البياني وأخذ آخر 8 شهور
          const finalData = Object.values(groupedData).slice(-8);
          setProgressData(finalData.length > 0 ? finalData : [{ name: 'لا توجد بيانات', completed: 0, active: 0 }]);
        } else {
          // داتا افتراضية لو الطبيب لسه جديد
          setProgressData([
            { name: 'الشهر الحالي', completed: 0, active: 0 }
          ]);
        }
      } catch (err) {
        console.error("Error fetching progress data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm w-full flex flex-col h-[400px] transition-colors animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-black text-gray-800 dark:text-white">مؤشر الأداء </h3>
        <div className="flex gap-6 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">استشارات منجزة</span>
            <span className="w-3 h-3 rounded-full bg-[#00BCD4]"></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">حالات نشطة (مجدولة)</span>
            <span className="w-3 h-3 rounded-full bg-[#FFB74D]"></span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full pb-4 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-[#00838F]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid vertical={false} stroke="#374151" strokeDasharray="4 4" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} />
              <YAxis fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1F2937', color: '#fff', fontWeight: 'bold', fontSize: '12px' }} />
              <Line type="monotone" name="استشارات منجزة" dataKey="completed" stroke="#00BCD4" strokeWidth={4} dot={{ r: 5, fill: '#00BCD4', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
              <Line type="monotone" name="حالات نشطة" dataKey="active" stroke="#FFB74D" strokeWidth={4} dot={{ r: 5, fill: '#FFB74D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};