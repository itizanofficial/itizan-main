import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. تسجيل الدخول في Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      if (!authData.user) throw new Error('حدث خطأ أثناء تسجيل الدخول');

      const userId = authData.user.id;

      // 2. البحث في جدول الأطباء
      const { data: doctorData, error: docError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (doctorData) {
        navigate('/doctor/dashboard');
        return;
      }

      // 3. البحث في جدول السكرتارية
      const { data: secretaryData, error: secError } = await supabase
        .from('secretaries')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (secretaryData) {
        navigate('/secretary/reservations'); 
        return;
      }

      // 🛑 4. الطرد لو ملقاش الـ ID في الجدولين
      await supabase.auth.signOut();
      throw new Error('عذراً، هذه البوابة مخصصة للأطباء والسكرتارية المسجلين فقط.');

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">بوابة الفريق الطبي</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-bold">أهلاً بك، أدخل بياناتك للمتابعة</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleStaffLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 mr-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-600 outline-none font-medium text-left transition-all" 
              dir="ltr" 
              placeholder="staff@clinic.com" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 mr-1">كلمة المرور</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-600 outline-none font-medium text-left font-sans transition-all" 
              dir="ltr" 
              placeholder="••••••••" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] mt-2 disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}