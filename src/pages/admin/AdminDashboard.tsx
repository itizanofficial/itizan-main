import React, { useState, useEffect } from 'react';
import { Activity, CreditCard, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الإشعارات
import { supabase } from '../../services/supabase';

export const AdminDashboard: React.FC = () => {
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // حالات الإحصائيات الحية
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  // جلب الإحصائيات الحية من قاعدة البيانات
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];

      // 1. جلب عدد جلسات اليوم (من جدول الجلسات)
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .like('session_date', `${todayDate}%`);
      
      const sessionsCount = sessions ? sessions.length : 0;
      setTodaySessionsCount(sessionsCount);

      // افتراض: متوسط إيراد الجلسة الواحدة 250 جنيه
      const calculatedRevenue = sessionsCount * 250; 
      setTodayRevenue(calculatedRevenue);

      // 2. جلب إجمالي المصروفات (من جدول المصروفات)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount');

      let currentExpenses = 0;
      if (expenses) {
        currentExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      }
      setTotalExpenses(currentExpenses);

      // 3. حساب صافي الربح (إيراد شهري افتراضي - المصروفات)
      // في نظام حقيقي هنجيب كل جلسات الشهر، لكن هنا بنعمل حسبة مبدئية
      setNetProfit((calculatedRevenue * 30) - currentExpenses); 

    } catch (error) {
      console.error("خطأ في جلب الإحصائيات المالية:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // دالة تسجيل المصروف في قاعدة البيانات
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseNote) return;
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 🌟 حفظ المصروف في الجدول
      const { error } = await supabase.from('expenses').insert([{ 
        amount: Number(expenseAmount), 
        note: expenseNote,
        admin_id: user?.id
      }]);

      if (error) throw error;

      toast.success(`تم قيد وتقييد مصروف بقيمة ${expenseAmount} ج.م بنجاح.`); // Toast احترافي
      setExpenseAmount('');
      setExpenseNote('');
      fetchDashboardStats(); // تحديث الأرقام فوراً
    } catch (err) {
      console.error("Error adding expense:", err);
      toast.error('تعذر تسجيل الخصم المالي، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans">
      
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="text-[#00838F]" /> الإدارة المالية والمركز المالي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">تحديث حي للمركز المالي والإداري لمنظومة إتزان الطبية.</p>
      </div>

      {/* الكروت الإحصائية الأربعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#E0F7FA] dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900 rounded-[2rem] p-6 text-center shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1">
          {loadingStats ? <Loader2 className="animate-spin text-cyan-600 mx-auto" /> : (
            <h3 className="text-3xl font-black text-[#00838F] dark:text-cyan-400 z-10 relative">{todayRevenue.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          )}
          <p className="text-sm font-bold text-gray-700 dark:text-cyan-100/70 z-10 relative mt-1">إيرادات العيادة (اليوم)</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-[2rem] p-6 text-center shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1">
          {loadingStats ? <Loader2 className="animate-spin text-red-600 mx-auto" /> : (
            <h3 className="text-3xl font-black text-red-600 dark:text-red-400 z-10 relative">{totalExpenses.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          )}
          <p className="text-sm font-bold text-gray-700 dark:text-red-100/70 z-10 relative mt-1">إجمالي المنصرف والعهد</p>
        </div>
        
        <div className="bg-[#F3E5F5] dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-[2rem] p-6 text-center shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1">
          {loadingStats ? <Loader2 className="animate-spin text-purple-600 mx-auto" /> : (
            <h3 className="text-3xl font-black text-purple-700 dark:text-purple-400 z-10 relative">{todaySessionsCount}</h3>
          )}
          <p className="text-sm font-bold text-gray-700 dark:text-purple-100/70 z-10 relative mt-1">الاستشارات المجدولة (اليوم)</p>
        </div>
        
        <div className="bg-[#E8F5E9] dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-[2rem] p-6 text-center shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1">
          {loadingStats ? <Loader2 className="animate-spin text-emerald-600 mx-auto" /> : (
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400 z-10 relative" dir="ltr">{netProfit > 0 ? '+' : ''} {netProfit.toLocaleString()} <span className="text-sm" dir="rtl">ج.م</span></h3>
          )}
          <p className="text-sm font-bold text-gray-700 dark:text-emerald-100/70 z-10 relative mt-1">المؤشر التقديري للربحية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* 🌟 كارت إضافة مصروف جديد */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
            <CreditCard className="text-red-500" /> قيد منصرفات تشغيلية
          </h3>
          <form onSubmit={handleAddExpense} className="space-y-5">
            <div className="flex gap-4">
              <input 
                type="number" 
                required 
                min="1"
                value={expenseAmount} 
                onChange={(e) => setExpenseAmount(e.target.value)} 
                placeholder="المبلغ (ج.م)" 
                className="w-1/3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 outline-none font-black text-red-600 dark:text-red-400 focus:border-red-400 focus:bg-white dark:focus:bg-gray-900 transition-all text-center" 
              />
              <input 
                type="text" 
                required 
                value={expenseNote} 
                onChange={(e) => setExpenseNote(e.target.value)} 
                placeholder="بيان الصرف (مثال: صيانة دورية، ضيافة، فواتير...)" 
                className="w-2/3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 outline-none font-bold focus:border-[#00838F] focus:bg-white dark:focus:bg-gray-900 text-sm transition-all" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-100 dark:border-red-800/50 shadow-sm mt-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> اعتماد وقيد الخصم المالي</>}
            </button>
          </form>
        </div>

        {/* كارت ملخص السلف والالتزامات */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-black mb-6 text-gray-800 dark:text-white">جدولة الالتزامات المؤسسية</h3>
          <div className="flex gap-4">
            <div className="flex-1 bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/50 text-center shadow-inner">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">عهد وسلف غير مسددة</p>
              <h4 className="text-3xl font-black text-red-700 dark:text-red-300">4,500 <span className="text-base">ج.م</span></h4>
            </div>
            <div className="flex-1 bg-blue-50 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center shadow-inner">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">مسيرات الرواتب المستحقة</p>
              <h4 className="text-3xl font-black text-blue-700 dark:text-blue-300">32,000 <span className="text-base">ج.م</span></h4>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};