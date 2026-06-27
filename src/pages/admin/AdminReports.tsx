import React, { useState, useEffect } from 'react';
import { CalendarDays, Calendar, Receipt, Loader2, FileText, TrendingDown } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'months' | 'days' | 'financials' | 'sessions'>('months');
  const [loading, setLoading] = useState(true);
  
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [financialsData, setFinancialsData] = useState<any[]>([]);
  const [sessionsData, setSessionsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (activeTab === 'months') {
          const { data: sessions } = await supabase.from('sessions').select('session_date, fees, payment_status').eq('admin_id', user.id).eq('payment_status', 'paid');
          const { data: expenses } = await supabase.from('expenses').select('amount, created_at').eq('admin_id', user.id);

          const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          const groupedData: any = {};

          sessions?.forEach(session => {
            if (!session.session_date) return;
            const d = new Date(session.session_date);
            const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (!groupedData[monthKey]) groupedData[monthKey] = { month: monthKey, sessionsCount: 0, revenue: 0, expenses: 0, netProfit: 0 };
            groupedData[monthKey].sessionsCount += 1;
            groupedData[monthKey].revenue += Number(session.fees) || 0;
          });

          expenses?.forEach(exp => {
            if (!exp.created_at) return;
            const d = new Date(exp.created_at);
            const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (!groupedData[monthKey]) groupedData[monthKey] = { month: monthKey, sessionsCount: 0, revenue: 0, expenses: 0, netProfit: 0 };
            groupedData[monthKey].expenses += Number(exp.amount) || 0;
          });

          const finalReports = Object.values(groupedData).map((r: any) => ({ ...r, netProfit: r.revenue - r.expenses }));
          setMonthlyData(finalReports.reverse());

        } else if (activeTab === 'days') {
          const { data: reports } = await supabase.from('daily_reports').select('*').eq('admin_id', user.id).order('created_at', { ascending: false });
          setDailyReports(reports || []);

        } else if (activeTab === 'financials') {
          const { data: expenses } = await supabase.from('expenses').select('*').eq('admin_id', user.id);
          const { data: loans } = await supabase.from('loans_history').select('*').eq('admin_id', user.id);
          
          const combined = [
            ...(expenses || []).map(e => ({ ...e, type: 'expense', date: e.created_at })),
            ...(loans || []).map(l => ({ ...l, type: 'loan', note: `سلفة للموظف: ${l.employee_name} (${l.role === 'doctor' ? 'طبيب' : 'سكرتير'})`, date: l.created_at }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setFinancialsData(combined);

        } else if (activeTab === 'sessions') {
          const { data: sessions } = await supabase.from('sessions').select(`
            id, session_date, status, payment_status, fees, mode,
            patient:patients(name, full_name),
            doctor:doctors(name, full_name)
          `).eq('admin_id', user.id).order('session_date', { ascending: false });
          
          setSessionsData(sessions || []);
        }

      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">التقارير والموازنة الختامية</h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">متابعة الأداء المالي، المصروفات، وصافي الأرباح لمنظومة إتزان.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* التابات العلوية */}
        <div className="flex flex-wrap border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={() => setActiveTab('months')} className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'months' ? 'bg-white dark:bg-gray-900 text-[#00838F] border-b-2 border-[#00838F]' : 'text-gray-400 hover:text-gray-600'}`}>
            <CalendarDays size={18} /> الأداء الشهري
          </button>
          <button onClick={() => setActiveTab('days')} className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'days' ? 'bg-white dark:bg-gray-900 text-[#00838F] border-b-2 border-[#00838F]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Calendar size={18} /> يوميات السكرتارية
          </button>
          <button onClick={() => setActiveTab('financials')} className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'financials' ? 'bg-white dark:bg-gray-900 text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <TrendingDown size={18} /> المصروفات والسلف
          </button>
          <button onClick={() => setActiveTab('sessions')} className={`flex-1 py-4 font-black flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'sessions' ? 'bg-white dark:bg-gray-900 text-[#00838F] border-b-2 border-[#00838F]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Receipt size={18} /> سجل الجلسات
          </button>
        </div>

        <div className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#00838F] dark:text-cyan-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="font-bold">جاري تحميل السجلات المركزية...</p>
            </div>
          ) : (
            <>
              {/* 1. تاب الشهور */}
              {activeTab === 'months' && (
                monthlyData.length === 0 ? <EmptyState msg="لا توجد بيانات شهرية حتى الآن." /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead>
                        <tr className="text-gray-500 bg-gray-50 border-b">
                          <th className="py-5 px-6 font-bold">الشهر / الفترة</th>
                          <th className="py-5 px-6 font-bold text-center">الاستشارات المدفوعة</th>
                          <th className="py-5 px-6 font-bold">إجمالي الإيرادات</th>
                          <th className="py-5 px-6 font-bold text-red-500">منصرفات ومسيرات</th>
                          <th className="py-5 px-6 font-black text-emerald-600">صافي الربحية </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((r, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="py-5 px-6 font-black text-lg">{r.month}</td>
                            <td className="py-5 px-6 font-bold text-center">{r.sessionsCount} جلسة</td>
                            <td className="py-5 px-6 font-black text-blue-600">{r.revenue.toLocaleString()} ج.م</td>
                            <td className="py-5 px-6 font-black text-red-500">{r.expenses.toLocaleString()} ج.م</td>
                            <td className="py-5 px-6 font-black text-emerald-700 bg-emerald-50 text-lg" dir="ltr">
                              {r.netProfit > 0 ? '+' : ''}{r.netProfit.toLocaleString()} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* 2. تاب يوميات السكرتارية */}
              {activeTab === 'days' && (
                dailyReports.length === 0 ? <EmptyState msg="لم يتم تقفيل أي ورديات من قبل السكرتارية حتى الآن." /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead>
                        <tr className="text-gray-500 bg-gray-50 border-b">
                          <th className="py-5 px-6 font-bold">تاريخ الوردية</th>
                          <th className="py-5 px-6 font-bold text-center">الجلسات المؤكدة</th>
                          <th className="py-5 px-6 font-black text-emerald-600">إجمالي التحصيل المورد</th>
                          <th className="py-5 px-6 font-bold text-center">وقت التقفيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyReports.map((r, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="py-5 px-6 font-black text-gray-800">{r.report_date}</td>
                            <td className="py-5 px-6 font-bold text-center text-gray-600">{r.confirmed_sessions} جلسة</td>
                            <td className="py-5 px-6 font-black text-emerald-600 text-lg">{Number(r.total_revenue).toLocaleString()} ج.م</td>
                            <td className="py-5 px-6 font-bold text-center text-gray-500" dir="ltr">{new Date(r.created_at).toLocaleTimeString('ar-EG')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* 3. تاب المصروفات والسلف */}
              {activeTab === 'financials' && (
                financialsData.length === 0 ? <EmptyState msg="سجل المصروفات والسلف فارغ." /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead>
                        <tr className="text-gray-500 bg-gray-50 border-b">
                          <th className="py-5 px-6 font-bold">التاريخ</th>
                          <th className="py-5 px-6 font-bold text-center">النوع</th>
                          <th className="py-5 px-6 font-bold">البيان / التفاصيل</th>
                          <th className="py-5 px-6 font-black text-red-600">القيمة المخصومة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialsData.map((f, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-red-50/30 transition-colors">
                            <td className="py-5 px-6 font-bold text-gray-600" dir="ltr">{new Date(f.date).toLocaleDateString('en-CA')}</td>
                            <td className="py-5 px-6 text-center">
                              <span className={`px-3 py-1 rounded-lg text-xs font-black ${f.type === 'loan' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                {f.type === 'loan' ? 'سلفة موظف' : (f.category || 'مصروف')}
                              </span>
                            </td>
                            <td className="py-5 px-6 font-bold text-gray-800">{f.note}</td>
                            <td className="py-5 px-6 font-black text-red-600 text-lg">- {Number(f.amount).toLocaleString()} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* 4. تاب سجل الجلسات */}
              {activeTab === 'sessions' && (
                sessionsData.length === 0 ? <EmptyState msg="لا توجد جلسات مسجلة في النظام." /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead>
                        <tr className="text-gray-500 bg-gray-50 border-b">
                          <th className="py-5 px-6 font-bold">تاريخ الجلسة</th>
                          <th className="py-5 px-6 font-bold">المريض</th>
                          <th className="py-5 px-6 font-bold">الطبيب المعالج</th>
                          <th className="py-5 px-6 font-bold text-center">الدفع</th>
                          <th className="py-5 px-6 font-black text-[#00838F]">القيمة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionsData.map((s, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="py-5 px-6 font-bold text-gray-600" dir="ltr">{s.session_date ? new Date(s.session_date).toLocaleDateString('en-CA') : '---'}</td>
                            <td className="py-5 px-6 font-black text-gray-900">{s.patient?.name || s.patient?.full_name || '---'}</td>
                            <td className="py-5 px-6 font-bold text-gray-700">{s.doctor?.name || s.doctor?.full_name || '---'}</td>
                            <td className="py-5 px-6 text-center">
                              <span className={`px-3 py-1 rounded-lg text-xs font-black ${s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                {s.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                              </span>
                            </td>
                            <td className="py-5 px-6 font-black text-[#00838F] text-lg">{Number(s.fees || 0).toLocaleString()} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ msg }: { msg: string }) => (
  <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold flex flex-col items-center">
    <FileText size={48} className="mb-4 text-gray-300" />
    {msg}
  </div>
);