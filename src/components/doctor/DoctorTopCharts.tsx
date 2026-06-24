import React, { useState, useEffect } from 'react';
import { UserCircle, CalendarClock, Clock, Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { supabase } from '../../services/supabase';

const PIE_COLORS = ['#00BCD4', '#4DB6AC', '#FFB74D', '#9575CD', '#F06292'];

export const DoctorTopCharts: React.FC = () => {
  const [totalPatients, setTotalPatients] = useState(0);
  const [genderStats, setGenderStats] = useState({ malePerc: 0, femalePerc: 0 });
  const [pieData, setPieData] = useState<{name: string, value: number, color: string}[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1️⃣ جلب بيانات المرضى للإحصائيات 
        const { data: patients } = await supabase.from('patients').select('*').eq('doctor_id', user.id);

        if (patients && patients.length > 0) {
          setTotalPatients(patients.length);
          let males = 0, females = 0;
          let diagnosisCount: Record<string, number> = {};

          patients.forEach(p => {
            if (p.gender === 'ذكر' || p.gender === 'male' || p.gender === 'M') males++;
            else females++;
            const diag = p.diagnosis || 'تصنيف عام';
            diagnosisCount[diag] = (diagnosisCount[diag] || 0) + 1;
          });

          setGenderStats({
            malePerc: Number(((males / patients.length) * 100).toFixed(1)),
            femalePerc: Number(((females / patients.length) * 100).toFixed(1))
          });

          const formattedPie = Object.keys(diagnosisCount).map((key, i) => ({
            name: key, value: diagnosisCount[key], color: PIE_COLORS[i % PIE_COLORS.length]
          }));
          setPieData(formattedPie);
        } else {
          setPieData([{ name: 'سجل فارغ', value: 1, color: '#E5E7EB' }]);
        }

        // 2️⃣ جلب استشارات اليوم بدقة (توقيت محلي من بداية اليوم لنهايته)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const localTodayDate = `${year}-${month}-${day}`; // تاريخ اليوم المحلي

        const { data: sessions } = await supabase
          .from('sessions')
          .select('*, patient:patients(name)') 
          .eq('doctor_id', user.id)
          // 🌟 الحل السحري: بنفلتر من أول دقيقة في اليوم لآخر دقيقة
          .gte('session_date', `${localTodayDate}T00:00:00`)
          .lte('session_date', `${localTodayDate}T23:59:59`)
          .order('session_date', { ascending: true })
          .limit(5); // خليتها 5 عشان تملى الجدول بشكل أشيك

        if (sessions) {
          setTodaySessions(sessions);
        }
      } catch (error) {
        console.error("خطأ في جلب بيانات الداشبورد:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* 1. الحالات حسب التصنيف السريري */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
        <h3 className="text-base font-black text-gray-800 dark:text-white w-full text-right mb-2">التصنيف السريري للمراجعين</h3>
        <div className="relative flex-1 w-full min-h-[180px] flex items-center justify-center">
          {loading ? (
            <Loader2 className="animate-spin text-[#00BCD4]" size={28} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1F2937', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="block text-xs font-bold text-gray-500 dark:text-gray-400">إجمالي السجلات</span>
                <span className="block text-3xl font-black text-[#00838F] dark:text-cyan-400">{totalPatients}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. التوزيع الديموغرافي */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-base font-black text-gray-800 dark:text-white">زيارات حسب النوع</h3>
          <UserCircle size={20} className="text-[#00838F]" />
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 px-1 text-gray-800 dark:text-gray-200">
            <span className="text-sm font-black">ذكور</span><span className="text-sm font-black">{genderStats.malePerc}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="bg-[#00BCD4] h-full rounded-full transition-all duration-1000" style={{ width: `${genderStats.malePerc}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2 px-1 text-gray-800 dark:text-gray-200">
            <span className="text-sm font-black">إناث</span><span className="text-sm font-black">{genderStats.femalePerc}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="bg-[#FFB74D] h-full rounded-full transition-all duration-1000" style={{ width: `${genderStats.femalePerc}%` }}></div>
          </div>
        </div>
      </div>

      {/* 3. استشارات اليوم (Live Table) */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-5 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-black text-gray-800 dark:text-white">جدول اليوم السريري</h3>
            <span className="text-xs font-bold text-gray-500">الاستشارات المجدولة لتاريخ اليوم فقط</span>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
            <CalendarClock size={20} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
          ) : todaySessions.length > 0 ? (
            <div className="space-y-3">
              {todaySessions.map((session, idx) => {
                const sessionTime = new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                const patientName = session.patient?.name || 'مراجع غير معرف';

                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#00838F]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00838F] text-white flex items-center justify-center font-bold shadow-sm">
                        {patientName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{patientName}</p>
                        <p className="text-xs font-bold text-gray-500">{session.session_type || 'استشارة'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                      <Clock size={14} className="text-[#00838F]" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300" dir="ltr">{sessionTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <CalendarClock size={40} className="text-gray-400 mb-3" />
              <p className="text-sm font-bold text-gray-500">لا توجد استشارات مجدولة لهذا اليوم.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};