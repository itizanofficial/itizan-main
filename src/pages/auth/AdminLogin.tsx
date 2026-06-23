import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. تسجيل الدخول العادي بالإيميل والباسورد
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }

      if (!authData.user) {
        throw new Error('حدث خطأ أثناء تسجيل الدخول');
      }

      // 2. التعديل الجديد 🌟: التحقق من وجود الحساب في جدول الـ admins النظيف
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (adminError || !adminData) {
        // 3. الفلتر الصارم: لو مش موجود في جدول الأدمن، إطرده!
        await supabase.auth.signOut(); // بنسجله خروج فوراً
        throw new Error('عذراً، هذا الحساب لا يملك صلاحيات وصول لمدير النظام.');
      }

      // 4. الدخول نجح واليوزر طلع مدير فعلاً
      navigate('/admin/dashboard');

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        
        {/* الهيدر واللوجو */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#00838F] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">بوابة الإدارة العليا</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-bold">أدخل بيانات الاعتماد الخاصة بك للمتابعة</p>
        </div>

        {/* رسالة الخطأ */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* الفورم */}
        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 mr-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-cyan-500/10 focus:bg-white focus:border-[#00838F] transition-all outline-none font-medium text-left"
              placeholder="admin@etizan.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 mr-1">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-cyan-500/10 focus:bg-white focus:border-[#00838F] transition-all outline-none font-medium text-left font-sans"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00838F] hover:bg-[#006064] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 mt-2 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>جاري التحقق...</span>
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>
        
        {/* حقوق الملكية */}
        <p className="text-center text-xs text-gray-400 mt-8 font-bold">
          نظام إتزان الطبي © {new Date().getFullYear()} - مخصص للإدارة فقط
        </p>
      </div>
    </div>
  );
}