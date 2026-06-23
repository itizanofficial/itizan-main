import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Lock, Save, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الإشعارات الشيك

export const SystemSettings: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور الجديدة غير متطابقة، يرجى المراجعة.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('دواعي الأمان تتطلب 6 أحرف على الأقل لكلمة المرور.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error(error);
      toast.error('تعذر تحديث مسوغات الدخول، يرجى المحاولة لاحقاً.');
    } else {
      toast.success('تم تشفير وحفظ كلمة المرور الإدارية الجديدة بنجاح 🛡️.');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in" dir="rtl">
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="text-[#00838F]" /> بروتوكولات الأمان والنظام
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">مركز التحكم في السياسات الأمنية ومسوغات الدخول للإدارة العليا.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 max-w-2xl rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
          <Lock size={20} className="text-[#00838F]" /> تحديث المفتاح السري للإدارة (Root)
        </h3>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          💡 يُنصح بشدة بتحديث كلمة المرور المركزية كل 90 يوماً لضمان عدم اختراق السجلات المالية والسريرية للمنظومة.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الإدارية الجديدة</label>
            <input 
              type="password" 
              required 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 focus:bg-white dark:focus:bg-gray-900 transition-all font-sans font-bold text-left" 
              dir="ltr" 
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">إعادة إدخال كلمة المرور للمطابقة</label>
            <input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 focus:bg-white dark:focus:bg-gray-900 transition-all font-sans font-bold text-left" 
              dir="ltr" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !newPassword || !confirmPassword} 
            className="w-full bg-[#00838F] hover:bg-[#006064] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {loading ? 'جاري التشفير والحفظ...' : 'اعتماد التحديثات الأمنية'}
          </button>
        </form>
      </div>
    </div>
  );
};