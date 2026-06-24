import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase';

// الاتصال كأدمن من السوبابيز لإنشاء حسابات Auth للموظفين
const supabaseAdminAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export default function CreateAccount() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'secretary'>('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg({ type: '', text: '' });

    try {
      // التأكد إن اللي بيضيف ده مدير مسجل دخول
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("يجب تسجيل الدخول كمدير أولاً");

      // 1. إنشاء حساب Auth للموظف الجديد
      const { data: authData, error: authError } = await supabaseAdminAuth.auth.signUp({
        email, password
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("فشل إنشاء حساب الموظف.");

      // 2. 🌟 توجيه البيانات للجدول الصحيح بناءً على الدور (doctor أو secretary)
      if (role === 'doctor') {
        const { error: dbError } = await supabase
          .from('doctors')
          .insert([{
            id: authData.user.id,
            admin_id: currentUser.id, // ربط الدكتور بهذا الأدمن فقط
            full_name: name,
            email: email,
          }]);
        if (dbError) throw dbError;
      } 
      else if (role === 'secretary') {
        const { error: dbError } = await supabase
          .from('secretaries')
          .insert([{
            id: authData.user.id,
            admin_id: currentUser.id, // ربط السكرتير بهذا الأدمن فقط
            full_name: name,
            email: email,
          }]);
        if (dbError) throw dbError;
      }

      setMsg({ type: 'success', text: `تم إنشاء حساب الـ ${role === 'doctor' ? 'طبيب' : 'سكرتير'} بنجاح تحت مظلتك! 🎉` });
      setName(''); setEmail(''); setPassword('');

    } catch (err: any) {
      console.error("Create account error:", err);
      setMsg({ type: 'error', text: err.message || "حدث خطأ غير متوقع." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 font-sans" dir="rtl">
      <h1 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">إضافة عضو جديد للفريق</h1>
      <div className="max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        
        {msg.text && (
          <div className={`p-4 mb-6 rounded-2xl text-sm font-bold text-center border ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">الاسم بالكامل</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 font-medium transition-all" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">البريد الإلكتروني</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@clinic.com" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 font-medium text-left transition-all" dir="ltr" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">كلمة المرور</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 font-medium text-left transition-all font-sans" dir="ltr" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">المسمى الوظيفي (الصلاحيات)</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 font-bold transition-all text-gray-700 cursor-pointer">
                <option value="doctor">طبيب / أخصائي</option>
                <option value="secretary">سكرتير / استقبال</option>
              </select>
            </div>
          </div>
          
          <button type="submit" disabled={isLoading} className="w-full mt-6 py-4 bg-[#00838F] hover:bg-[#006064] text-white font-black rounded-2xl transition-all shadow-lg shadow-cyan-500/30 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
            {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وحفظه'}
          </button>
        </form>
      </div>
    </div>
  );
}