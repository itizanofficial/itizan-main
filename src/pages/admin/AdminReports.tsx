import React, { useState, useEffect } from 'react';
import { CalendarDays, Calendar, Receipt, Loader2, FileText, TrendingDown, DollarSign, Wallet, UserCheck } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'months' | 'days' | 'financials' | 'sessions'>('months');
  const [loading, setLoading] = useState(true);
  
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [financialsData, setFinancialsData] = useState<any[]>([]);
  const [sessionsData, setSessionsData] = useState<any[]>([]);

  // ملخصات سريعة للعرض فوق الجداول
  const [totals, setTotals] = useState({ revenue: 0, expenses: 0, net: 0, sessions: 0 });

  // دالة مساعدة لجلب معرف المدير
  const getAdminId = async (userId: string) => {
    const { data } = await supabase.from('admins').select('id').eq('id', userId).single();
    return data ? data.id : userId;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const adminId = await getAdminId(user.id);

        if (activeTab === 'months') {
          const { data: sessions } = await supabase.from('sessions').select('session_date, fees').eq('admin_id', adminId).eq('payment_status', 'paid');
          const { data: expenses } = await supabase.from('expenses').select('amount, created_at').eq('admin_id', adminId);

          const groupedData: any = {};
          let tRev = 0; let tExp = 0; let tSess = 0;

          sessions?.forEach(session => {
            if (!session.session_date) return;
            const d = new Date(session.session_date);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM لضمان الترتيب
            
            if (!groupedData[monthKey]) groupedData[monthKey] = { monthKey, dateObj: d, sessionsCount: 0, revenue: 0, expenses: 0 };
            
            groupedData[monthKey].sessionsCount += 1;
            groupedData[monthKey].revenue += Number(session.fees) || 0;
            tRev += Number(session.fees) || 0;
            tSess += 1;
          });

          expenses?.forEach(exp => {
            if (!exp.created_at) return;
            const d = new Date(exp.created_at);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groupedData[monthKey]) groupedData[monthKey] = { monthKey, dateObj: d, sessionsCount: 0, revenue: 0, expenses: 0 };
            
            groupedData[monthKey].expenses += Number(exp.amount) || 0;
            tExp += Number(exp.amount) || 0;
          });

          const finalReports = Object.values(groupedData)
            .map((r: any) => ({
              ...r,
              netProfit: r.revenue - r.expenses,
              monthName: new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(r.dateObj)
            }))
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // ترتيب من الأحدث للأقدم

          setMonthlyData(finalReports);
          setTotals({ revenue: tRev, expenses: tExp, net: tRev - tExp, sessions: tSess });

        } else if (activeTab === 'days') {
          // 🌟 التعديل هنا: جلبنا اسم السكرتير اللي قفل الوردية
          const { data: reports } = await supabase.from('daily_reports')
            .select('*, secretary:secretaries(full_name)')
            .eq('admin_id', adminId)
            .order('report_date', { ascending: false });
          setDailyReports(reports || []);

        } else if (activeTab === 'financials') {
          const { data: expenses } = await supabase.from('expenses').select('*').eq('admin_id', adminId);
          const { data: loans } = await supabase.from('loans_history').select('*').eq('admin_id', adminId);
          
          const combined = [
            ...(expenses || []).map(e => ({ ...e, type: 'expense', date: e.created_at })),
            ...(loans || []).map(l => ({ ...l, type: 'loan', note: `سلفة للموظف: ${l.employee_name} (${l.role === 'doctor' ? 'طبيب' : 'سكرتير'})`, date: l.created_at }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          let tExp = 0;
          combined.forEach(item => tExp += Number(item.amount) || 0);

          setFinancialsData(combined);
          setTotals(prev => ({ ...prev, expenses: tExp }));

        } else if (activeTab === 'sessions') {
          const { data: sessions } = await supabase.from('sessions').select(`
            id, session_date, status, payment_status, fees, session_type,
            patient:patients(name, full_name),
            doctor:doctors(name, full_name)
          `).eq('admin_id', adminId).order('session_date', { ascending: false });
          
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
    <div className="space-y-6 font-sans animate-fade-in pb-10" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">التقارير والموازنة الختامية</h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">متابعة دقيقة للأداء المالي، المصروفات، وصافي الأرباح لمنظومة إتزان.</p>
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
            <Receipt size={18} /> السجل العام للجلسات
          </button>
        </div>

        <div className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#00838F] dark:text-cyan-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold text-lg">جاري تحميل السجلات المركزية...</p>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* 1. تاب الشهور (الأداء الشهري) */}
              {/* ======================================================== */}
              {activeTab === 'months' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">إجمالي الإيرادات التراكمية</p>
                      <h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{totals.revenue.toLocaleString()} ج.م</h4>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/50">
                      <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-1">إجمالي المصروفات التراكمية</p>
                      <h4 className="text-2xl font-black text-red-700 dark:text-red-300">{totals.expenses.toLocaleString()} ج.م</h4>
                    </div>
                    <div className="bg-[#E0F7FA] dark:bg-cyan-900/20 p-5 rounded-2xl border border-cyan-100 dark:border-cyan-900/50">
                      <p className="text-[#00838F] dark:text-cyan-400 font-bold text-sm mb-1">صافي الأرباح العام</p>
                      <h4 className="text-2xl font-black text-[#00838F] dark:text-cyan-300" dir="ltr">{totals.net > 0 ? '+' : ''}{totals.net.toLocaleString()} ج.م</h4>
                    </div>
                  </div>

                  {monthlyData.length === 0 ? <EmptyState msg="لا توجد بيانات شهرية حتى الآن." /> : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                      <table className="w-full text-right whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">الشهر</th>
                            <th className="py-4 px-6 font-bold text-center text-gray-600 dark:text-gray-300">الاستشارات المدفوعة</th>
                            <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">الإيرادات</th>
                            <th className="py-4 px-6 font-bold text-red-500">المصروفات</th>
                            <th className="py-4 px-6 font-black text-emerald-600">صافي الربح</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.map((r, idx) => (
                            <tr key={idx} className="border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="py-4 px-6 font-black text-gray-800 dark:text-white text-lg">{r.monthName}</td>
                              <td className="py-4 px-6 font-bold text-center text-gray-600 dark:text-gray-400">{r.sessionsCount} جلسة</td>
                              <td className="py-4 px-6 font-black text-blue-600 dark:text-blue-400 text-lg">{r.revenue.toLocaleString()}</td>
                              <td className="py-4 px-6 font-black text-red-500 text-lg">{r.expenses.toLocaleString()}</td>
                              <td className="py-4 px-6 font-black text-emerald-600 dark:text-emerald-400 text-xl bg-emerald-50/50 dark:bg-emerald-900/10" dir="ltr">
                                {r.netProfit > 0 ? '+' : ''}{r.netProfit.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ======================================================== */}
              {/* 2. تاب يوميات السكرتارية */}
              {/* ======================================================== */}
              {activeTab === 'days' && (
                dailyReports.length === 0 ? <EmptyState msg="لم يتم تقفيل أي ورديات من قبل السكرتارية حتى الآن." /> : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">تاريخ الوردية</th>
                          <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">مسؤول التقفيل</th>
                          <th className="py-4 px-6 font-bold text-center text-gray-600 dark:text-gray-300">الجلسات المؤكدة</th>
                          <th className="py-4 px-6 font-black text-emerald-600">إجمالي التوريد</th>
                          <th className="py-4 px-6 font-bold text-center text-gray-600 dark:text-gray-300">وقت التقفيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyReports.map((r, idx) => (
                          <tr key={idx} className="border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-4 px-6 font-black text-gray-800 dark:text-white text-lg">{r.report_date}</td>
                            <td className="py-4 px-6 font-bold text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-2"><UserCheck size={16} className="text-[#00838F]" /> {r.secretary?.full_name || 'سكرتير غير معروف'}</span>
                            </td>
                            <td className="py-4 px-6 font-bold text-center text-gray-600 dark:text-gray-400">
                              <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">{r.confirmed_sessions} جلسة</span>
                            </td>
                            <td className="py-4 px-6 font-black text-emerald-600 text-xl bg-emerald-50/50 dark:bg-emerald-900/10">{Number(r.total_revenue).toLocaleString()} ج.م</td>
                            <td className="py-4 px-6 font-bold text-center text-gray-500" dir="ltr">{new Date(r.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ======================================================== */}
              {/* 3. تاب المصروفات والسلف */}
              {/* ======================================================== */}
              {activeTab === 'financials' && (
                <>
                  <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/50 mb-6 inline-block">
                    <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-1">إجمالي السجلات المخصومة</p>
                    <h4 className="text-2xl font-black text-red-700 dark:text-red-300">{totals.expenses.toLocaleString()} ج.م</h4>
                  </div>

                  {financialsData.length === 0 ? <EmptyState msg="سجل المصروفات والسلف فارغ." /> : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                      <table className="w-full text-right whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">التاريخ</th>
                            <th className="py-4 px-6 font-bold text-center text-gray-600 dark:text-gray-300">النوع</th>
                            <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">البيان / التفاصيل</th>
                            <th className="py-4 px-6 font-black text-red-600">القيمة المخصومة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialsData.map((f, idx) => (
                            <tr key={idx} className="border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                              <td className="py-4 px-6 font-bold text-gray-600 dark:text-gray-400" dir="ltr">{new Date(f.date).toLocaleDateString('en-CA')}</td>
                              <td className="py-4 px-6 text-center">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${f.type === 'loan' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {f.type === 'loan' ? 'سلفة موظف' : (f.category || 'مصروف')}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-bold text-gray-800 dark:text-gray-200">{f.note}</td>
                              <td className="py-4 px-6 font-black text-red-600 text-lg">- {Number(f.amount).toLocaleString()} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ======================================================== */}
              {/* 4. تاب سجل الجلسات العام */}
              {/* ======================================================== */}
              {activeTab === 'sessions' && (
                sessionsData.length === 0 ? <EmptyState msg="لا توجد جلسات مسجلة في النظام." /> : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">تاريخ الجلسة</th>
                          <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">المريض</th>
                          <th className="py-4 px-6 font-bold text-gray-600 dark:text-gray-300">الطبيب المعالج</th>
                          <th className="py-4 px-6 font-bold text-center text-gray-600 dark:text-gray-300">الحالة والدفع</th>
                          <th className="py-4 px-6 font-black text-[#00838F] dark:text-cyan-400">الرسوم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionsData.map((s, idx) => (
                          <tr key={idx} className="border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-gray-600 dark:text-gray-400" dir="ltr">{s.session_date ? new Date(s.session_date).toLocaleDateString('en-CA') : '---'}</td>
                            <td className="py-4 px-6 font-black text-gray-900 dark:text-white">{s.patient?.name || s.patient?.full_name || '---'}</td>
                            <td className="py-4 px-6 font-bold text-gray-700 dark:text-gray-300">{s.doctor?.name || s.doctor?.full_name || '---'}</td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${s.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                  {s.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${s.status === 'completed' || s.status === 'مكتملة' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : 'bg-cyan-50 text-[#00838F] dark:bg-cyan-900/30 dark:text-cyan-400'}`}>
                                  {s.status === 'completed' || s.status === 'مكتملة' ? 'مكتملة' : (s.status || 'مجدولة')}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-black text-[#00838F] dark:text-cyan-400 text-lg">{Number(s.fees || 0).toLocaleString()} <span className="text-sm">ج.م</span></td>
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
  <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 font-bold flex flex-col items-center">
    <FileText size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
    <p className="text-lg">{msg}</p>
  </div>
);