import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ShieldPlus } from 'lucide-react'; // ضفنا أيقونة شيك للوجو

export default function RootAdminSetup() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleCreateRootAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg({ type: '', text: '' });

    try {
      // 1. إنشاء الحساب في Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: adminName,
            role: 'admin',
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("فشل في إنشاء الحساب في نظام المصادقة.");

      // 2. شبكة الأمان المطلقة - التعديل الجديد: الرفع لجدول admins 
      const { error: dbError } = await supabase
        .from('admins')
        .insert([{
          id: authData.user.id,
          full_name: adminName,
          email: email,
        }]);

      if (dbError) {
        console.error("Admin Insert Error:", dbError);
        throw new Error(dbError.message || "حدث خطأ أثناء حفظ بيانات المدير"); 
      }

      setMsg({ type: 'success', text: 'تم إنشاء النظام والمظلة بنجاح! سيتم تحويلك...' });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error("Caught Error:", error);
      setMsg({ 
        type: 'error', 
        text: error?.message || 'تعذر الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] px-4 font-sans" dir="rtl">
      
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-gray-100 relative overflow-hidden">
        
        {/* لمسة ديكور خفيفة في الخلفية */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00838F] opacity-5 rounded-bl-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500 opacity-5 rounded-tr-full pointer-events-none"></div>

        {/* مكان اللوجو */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-20 h-20 bg-cyan-50 text-[#00838F] rounded-2xl flex items-center justify-center shadow-inner border border-cyan-100 rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldPlus size={40} />
          </div>
        </div>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-gray-800 mb-2">إعداد النظام الرئيسي</h2>
          <p className="text-sm font-bold text-gray-500">قم بإنشاء حساب المدير العام (Root) للمنظومة</p>
        </div>

        {msg.text && (
          <div className={`p-4 mb-6 rounded-2xl text-sm font-bold text-center border relative z-10 ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCreateRootAdmin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">اسم المدير بالكامل</label>
            <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="مثال: د. حسام الدين" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">اسم المؤسسة / العيادة</label>
            <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="مثال: عيادات التوازن النفسي" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">البريد الإلكتروني</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@clinic.com" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium text-left" dir="ltr" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">كلمة المرور</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium text-left font-sans" dir="ltr" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-[#00838F] hover:bg-[#006064] text-white font-black py-4 rounded-2xl mt-6 shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                جاري تهيئة المظلة...
              </>
            ) : 'إنشاء حساب المدير العام'}
          </button>
        </form>
      </div>

    </div>
  );
}