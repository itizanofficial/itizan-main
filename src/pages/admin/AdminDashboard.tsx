import React, { useState, useEffect } from 'react';
import { Activity, CreditCard, Plus, Loader2, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast'; 
import { supabase } from '../../services/supabase';

export const AdminDashboard: React.FC = () => {
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // الإحصائيات الحية
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);
  const [netProfit, setNetProfit] = useState(0); 
  
  // الالتزامات المؤسسية
  const [unpaidLoans, setUnpaidLoans] = useState(0);
  const [dueSalaries, setDueSalaries] = useState(0);

  // 🌟 قائمة جلسات اليوم للعرض فقط
  const [todaySessionsList, setTodaySessionsList] = useState<any[]>([]);

  // دالة مساعدة للحصول على admin_id الخاص بالمدير الحالي
  const getAdminId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // أولاً: نتأكد هل هو أدمن فعلاً؟
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single();
      
    return admin ? admin.id : null;
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const currentAdminId = await getAdminId();
      if (!currentAdminId) {
        toast.error("صلاحيات غير صالحة، يرجى تسجيل الدخول كمدير.");
        setLoadingStats(false);
        return;
      }

      const now = new Date();
      // ظبطنا الوقت ليكون دقيق من بداية لنهاية اليوم المحلي
      now.setHours(0, 0, 0, 0);
      const todayStart = now.toISOString();
      now.setHours(23, 59, 59, 999);
      const todayEnd = now.toISOString();
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const currentMonth = now.toISOString().slice(0, 7); 

      // =========================================
      // 1. إيرادات وجلسات "اليوم" لعيادة المدير الحالي فقط
      // =========================================
      const { data: todaySessions, error: sessionErr } = await supabase
        .from('sessions')
        .select(`
          id, fees, payment_status, session_date, status, session_type,
          patient:patients(name),
          doctor:doctors(full_name)
        `)
        .eq('admin_id', currentAdminId) // 🌟 الفلترة الأهم!
        .gte('session_date', todayStart)
        .lte('session_date', todayEnd)
        .order('session_date', { ascending: true });

      if (sessionErr) console.error("Error fetching sessions:", sessionErr);

      setTodaySessionsList(todaySessions || []);
      setTodaySessionsCount(todaySessions?.length || 0);

      // حساب إيرادات اليوم للجلسات المدفوعة فعلياً
      const dailyRev = todaySessions?.reduce((sum, s) => s.payment_status === 'paid' ? sum + (Number(s.fees) || 0) : sum, 0) || 0;
      setTodayRevenue(dailyRev);

      // =========================================
      // 2. مصروفات الشهر الحالي
      // =========================================
      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('admin_id', currentAdminId) // فلترة
        .gte('created_at', startOfMonth);
      
      const currentMonthExpenses = monthExpenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
      setMonthlyExpenses(currentMonthExpenses);
      
      // =========================================
      // 3. صافي الربح الختامي العام
      // =========================================
      const { data: allSessions } = await supabase
        .from('sessions')
        .select('fees')
        .eq('admin_id', currentAdminId)
        .eq('payment_status', 'paid'); // المدفوع فقط
        
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('admin_id', currentAdminId);
      
      let allTimeRev = 0;
      allSessions?.forEach(s => allTimeRev += Number(s.fees) || 0);
      let allTimeExp = 0;
      allExpenses?.forEach(e => allTimeExp += Number(e.amount) || 0);
      
      setNetProfit(allTimeRev - allTimeExp); 

      // =========================================
      // 4. جلب حسابات الفريق (السلف والرواتب)
      // =========================================
      const { data: doctors } = await supabase.from('doctors').select('salary, loan, last_paid_month').eq('admin_id', currentAdminId);
      const { data: secretaries } = await supabase.from('secretaries').select('salary, loan, last_paid_month').eq('admin_id', currentAdminId);
      
      let totalLoans = 0;
      let totalDueSalaries = 0;

      [...(doctors || []), ...(secretaries || [])].forEach(emp => {
        totalLoans += Number(emp.loan) || 0;
        if (emp.last_paid_month !== currentMonth) {
          const net = (Number(emp.salary) || 0) - (Number(emp.loan) || 0);
          if (net > 0) totalDueSalaries += net; 
        }
      });

      // =========================================
      // 5. جلب الالتزامات الثابتة (إيجارات، ضرائب)
      // =========================================
      const { data: obs } = await supabase.from('fixed_obligations').select('amount, last_paid_month').eq('admin_id', currentAdminId);
      obs?.forEach(ob => {
        if (ob.last_paid_month !== currentMonth) {
          totalDueSalaries += Number(ob.amount) || 0; 
        }
      });

      setUnpaidLoans(totalLoans);
      setDueSalaries(totalDueSalaries);

    } catch (error) {
      toast.error('تعذر جلب البيانات المالية الحية.');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { 
    fetchDashboardStats(); 
    
    // تفعيل التحديث المباشر للوحة المدير عند إضافة السكرتير لجلسة أو دفع
    const channel = supabase.channel('admin_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => { fetchDashboardStats(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => { fetchDashboardStats(); })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseNote) return;
    setIsSubmitting(true);
    try {
      const currentAdminId = await getAdminId();
      await supabase.from('expenses').insert([{ 
        amount: Number(expenseAmount), 
        note: expenseNote, 
        admin_id: currentAdminId, 
        category: 'مصروفات تشغيلية' 
      }]);
      toast.success(`تم قيد مصروف بقيمة ${expenseAmount} ج.م بنجاح ✅`);
      setExpenseAmount(''); setExpenseNote('');
      fetchDashboardStats(); 
    } catch (err) {
      toast.error('تعذر تسجيل الخصم المالي.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="text-[#00838F]" /> الإدارة المالية والمركز المالي
        </h1>
        <p className="text-gray-500 font-bold text-sm mt-1">تحديث حي للمركز المالي والإداري لمنظومة إتزان الطبية.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#E0F7FA] dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900 rounded-[2rem] p-6 text-center shadow-sm">
          {loadingStats ? <Loader2 className="animate-spin text-cyan-600 mx-auto" /> : <h3 className="text-3xl font-black text-[#00838F] dark:text-cyan-400">{todayRevenue.toLocaleString()} <span className="text-sm">ج.م</span></h3>}
          <p className="text-sm font-bold text-gray-700 dark:text-cyan-100 mt-1">إيرادات العيادة (اليوم)</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-[2rem] p-6 text-center shadow-sm">
          {loadingStats ? <Loader2 className="animate-spin text-red-600 mx-auto" /> : <h3 className="text-3xl font-black text-red-600 dark:text-red-400">{monthlyExpenses.toLocaleString()} <span className="text-sm">ج.م</span></h3>}
          <p className="text-sm font-bold text-gray-700 dark:text-red-100 mt-1">إجمالي المنصرف (الشهر)</p>
        </div>
        <div className="bg-[#F3E5F5] dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-[2rem] p-6 text-center shadow-sm">
          {loadingStats ? <Loader2 className="animate-spin text-purple-600 mx-auto" /> : <h3 className="text-3xl font-black text-purple-700 dark:text-purple-400">{todaySessionsCount}</h3>}
          <p className="text-sm font-bold text-gray-700 dark:text-purple-100 mt-1">الاستشارات المنجزة (اليوم)</p>
        </div>
        <div className="bg-[#E8F5E9] dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-[2rem] p-6 text-center shadow-sm">
          {loadingStats ? <Loader2 className="animate-spin text-emerald-600 mx-auto" /> : <h3 className={`text-3xl font-black ${netProfit < 0 ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-400'}`} dir="ltr">{netProfit > 0 ? '+' : ''}{netProfit.toLocaleString()} <span className="text-sm" dir="rtl">ج.م</span></h3>}
          <p className="text-sm font-bold text-gray-700 dark:text-emerald-100 mt-1">إجمالي الأرباح الختامية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* كارت المصروفات */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-gray-800 dark:text-white"><CreditCard className="text-red-500" /> قيد منصرفات تشغيلية</h3>
          <form onSubmit={handleAddExpense} className="space-y-5">
            <div className="flex gap-4">
              <input type="number" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="المبلغ (ج.م)" className="w-1/3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 outline-none font-black text-red-600 dark:text-red-400 text-center" />
              <input type="text" required value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} placeholder="بيان الصرف (مثال: صيانة، ضيافة...)" className="w-2/3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 outline-none font-bold dark:text-white" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-black py-4 rounded-xl flex items-center justify-center gap-2 border border-red-100 dark:border-red-900 shadow-sm disabled:opacity-50 transition-all">
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> اعتماد وقيد الخصم المالي</>}
            </button>
          </form>
        </div>

        {/* كارت الالتزامات المؤسسية */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-black mb-6 text-gray-800 dark:text-white">جدولة الالتزامات المؤسسية</h3>
          <div className="flex gap-4">
            <div className="flex-1 bg-red-50 dark:bg-red-950/30 p-5 rounded-2xl border border-red-100 dark:border-red-900/50 text-center shadow-inner">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">عهد وسلف غير مسددة</p>
              {loadingStats ? <Loader2 className="animate-spin text-red-600 dark:text-red-400 mx-auto" size={20} /> : <h4 className="text-3xl font-black text-red-700 dark:text-red-300">{unpaidLoans.toLocaleString()} <span className="text-base">ج.م</span></h4>}
            </div>
            <div className="flex-1 bg-blue-50 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center shadow-inner">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">رواتب والتزامات مستحقة</p>
              {loadingStats ? <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mx-auto" size={20} /> : <h4 className="text-3xl font-black text-blue-700 dark:text-blue-300">{dueSalaries.toLocaleString()} <span className="text-base">ج.م</span></h4>}
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 سجل جلسات اليوم (للعرض والمراقبة فقط) */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black flex items-center gap-2 text-gray-800 dark:text-white">
            <CalendarDays className="text-[#00838F]" /> كشف جلسات اليوم
          </h3>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
            إجمالي الجلسات: {todaySessionsList.length}
          </span>
        </div>

        {loadingStats ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-[#00838F]" size={30} /></div>
        ) : todaySessionsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-4 font-bold text-gray-600 dark:text-gray-300">المريض</th>
                  <th className="p-4 font-bold text-gray-600 dark:text-gray-300">الطبيب المعالج</th>
                  <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-center">التوقيت</th>
                  <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-center">النوع</th>
                  <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-center">الحالة والدفع</th>
                  <th className="p-4 font-black text-[#00838F] dark:text-cyan-400">الرسوم</th>
                </tr>
              </thead>
              <tbody>
                {todaySessionsList.map((session, idx) => (
                  <tr key={idx} className="border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-black text-gray-900 dark:text-white">{session.patient?.name || session.patient?.full_name || 'غير مسجل'}</td>
                    <td className="p-4 font-bold text-gray-700 dark:text-gray-300">{session.doctor?.full_name || session.doctor?.name || '---'}</td>
                    <td className="p-4 font-bold text-gray-500 dark:text-gray-400 text-center" dir="ltr">
                      {session.session_date ? new Date(session.session_date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '---'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md text-xs font-bold">
                        {session.session_type || 'كشف'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${session.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {session.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${session.status === 'completed' || session.status === 'مكتملة' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : 'bg-cyan-50 text-[#00838F] dark:bg-cyan-900/30 dark:text-cyan-400'}`}>
                          {session.status === 'completed' || session.status === 'مكتملة' ? 'مكتملة' : (session.status || 'مجدولة')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-black text-[#00838F] dark:text-cyan-400 text-lg">
                      {Number(session.fees || 0).toLocaleString()} <span className="text-sm">ج.م</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
            لا توجد جلسات مجدولة حتى الآن في يومية اليوم.
          </div>
        )}
      </div>

    </div>
  );
};