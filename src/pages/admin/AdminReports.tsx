import React, { useState, useEffect } from 'react';
import { CalendarDays, Calendar, Receipt, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface MonthlyReport {
  month: string;
  sessionsCount: number;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'months' | 'days' | 'sessions'>('months');
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);

  // 🌟 استعلام حي لحساب تقارير الشهور
  useEffect(() => {
    const fetchMonthlyReports = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. جلب الجلسات المكتملة
        const { data: sessions } = await supabase
          .from('sessions')
          .select('session_date')
          .eq('status', 'completed'); // أو 'مكتملة' حسب اللي بيتسجل عندك

        // 2. جلب المصروفات المسجلة
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, created_at');

        // تجميع وتصنيف البيانات بناءً على الشهر
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const groupedData: Record<string, MonthlyReport> = {};

        // معالجة الجلسات (افترضنا إيراد الجلسة 250 جنيه)
        if (sessions) {
          sessions.forEach(session => {
            if (!session.session_date) return;
            const d = new Date(session.session_date);
            const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

            if (!groupedData[monthKey]) {
              groupedData[monthKey] = { month: monthKey, sessionsCount: 0, revenue: 0, expenses: 0, netProfit: 0 };
            }
            groupedData[monthKey].sessionsCount += 1;
            groupedData[monthKey].revenue += 250; // سعر افتراضي للجلسة
          });
        }

        // معالجة المصروفات والخصميات
        if (expenses) {
          expenses.forEach(exp => {
            if (!exp.created_at) return;
            const d = new Date(exp.created_at);
            const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

            if (!groupedData[monthKey]) {
              groupedData[monthKey] = { month: monthKey, sessionsCount: 0, revenue: 0, expenses: 0, netProfit: 0 };
            }
            groupedData[monthKey].expenses += Number(exp.amount) || 0;
          });
        }

        // حساب صافي الربح لكل شهر
        const finalReports = Object.values(groupedData).map(report => ({
          ...report,
          netProfit: report.revenue - report.expenses
        }));

        setMonthlyData(finalReports.reverse()); // عرض الأحدث أولاً
      } catch (err) {
        console.error("خطأ في جلب التقارير:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'months') {
      fetchMonthlyReports();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">التقارير والموازنة الختامية</h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">متابعة الأداء المالي، المصروفات، وصافي الأرباح لمنظومة إتزان.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* التابات العلوية */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={() => setActiveTab('months')} className={`flex-1 py-5 font-black flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'months' ? 'bg-white dark:bg-gray-900 text-[#00838F] dark:text-cyan-400 border-b-2 border-[#00838F] dark:border-cyan-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <CalendarDays size={20} /> الأداء الشهري المجمع
          </button>
          <button onClick={() => setActiveTab('days')} className={`flex-1 py-5 font-black flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'days' ? 'bg-white dark:bg-gray-900 text-[#00838F] dark:text-cyan-400 border-b-2 border-[#00838F] dark:border-cyan-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <Calendar size={20} /> اليوميات والسجلات
          </button>
          <button onClick={() => setActiveTab('sessions')} className={`flex-1 py-5 font-black flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'sessions' ? 'bg-white dark:bg-gray-900 text-[#00838F] dark:text-cyan-400 border-b-2 border-[#00838F] dark:border-cyan-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <Receipt size={20} /> كشوفات الاستشارات
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'months' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#00838F] dark:text-cyan-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-bold">جاري تجميع وحساب البيانات المالية...</p>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
                لا توجد بيانات مالية أو جلسات مكتملة حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                      <th className="py-5 px-6 font-bold">الشهر / الفترة</th>
                      <th className="py-5 px-6 font-bold text-center">الاستشارات المنجزة</th>
                      <th className="py-5 px-6 font-bold">إجمالي الإيرادات</th>
                      <th className="py-5 px-6 font-bold text-red-500">منصرفات ومسيرات</th>
                      <th className="py-5 px-6 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10">صافي الربحية 💰</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((report, idx) => (
                      <tr key={idx} className="border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-5 px-6 font-black text-lg text-gray-900 dark:text-white">{report.month}</td>
                        <td className="py-5 px-6 font-bold text-center text-gray-600 dark:text-gray-300">{report.sessionsCount} جلسة</td>
                        <td className="py-5 px-6 font-black text-blue-600 dark:text-blue-400">{report.revenue.toLocaleString()} ج.م</td>
                        <td className="py-5 px-6 font-black text-red-500 dark:text-red-400">{report.expenses.toLocaleString()} ج.م</td>
                        <td className="py-5 px-6 font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 text-lg">
                          <span dir="ltr">{report.netProfit > 0 ? '+' : ''}{report.netProfit.toLocaleString()}</span> ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          {activeTab === 'days' && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold">
              وحدة تقفيل اليوميات قيد التجهيز والمزامنة...
            </div>
          )}
          {activeTab === 'sessions' && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold">
              سجل استعلام الجلسات والمسودات قيد الربط...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};