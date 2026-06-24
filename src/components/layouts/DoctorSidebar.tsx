import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, BarChart3, User, LogOut, Activity, ClipboardList, MessageSquare } from 'lucide-react';import { supabase } from '../../services/supabase'; 

const doctorNavItems = [
  { id: 'dashboard', name: 'لوحة التحكم', icon: LayoutDashboard, path: '/doctor/dashboard' },
  { id: 'appointments', name: 'الحجوزات', icon: CalendarDays, path: '/doctor/appointments' },
  { id: 'patients', name: 'ملفات المراجعين', icon: Users, path: '/doctor/patients' },
  { id: 'sessions', name: 'الجلسات', icon: Activity, path: '/doctor/sessions' },
  { id: 'treatment-plan', name: 'الخطط العلاجية', icon: ClipboardList, path: '/doctor/treatment-plan' }, 
  { id: 'reports', name: 'التقارير', icon: BarChart3, path: '/doctor/reports' },
  { id: 'chat', name: 'الرسائل والاستشارات', icon: MessageSquare, path: '/doctor/chat' }, // 🌟 السطر الجديد
];

export const DoctorSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [doctorName, setDoctorName] = useState('دكتور');
  const [doctorSpecialty, setDoctorSpecialty] = useState('إعداد الملف الشخصي...');
  const [doctorAvatar, setDoctorAvatar] = useState<string | null>(null);
  const [doctorInitials, setDoctorInitials] = useState('د');

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (user.user_metadata?.full_name) {
          setDoctorName(user.user_metadata.full_name);
        } else if (user.email) {
          setDoctorName(user.email.split('@')[0]);
        }

        // 🌟 التعديل هنا: التوجيه لجدول doctors الجديد النظيف
        const { data } = await supabase
          .from('doctors')
          .select('full_name, title, specialty, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          if (data.full_name) {
            setDoctorName(data.full_name);
            const firstLetter = data.full_name.replace('د.', '').replace('د/', '').trim().charAt(0);
            setDoctorInitials(firstLetter || 'د');
          }
          if (data.specialty || data.title) setDoctorSpecialty(data.title || data.specialty);
          if (data.avatar_url) setDoctorAvatar(data.avatar_url); 
        }
      } catch (err) {
        console.error("خطأ في جلب ملف الدكتور السايد بار:", err);
      }
    };

    fetchDoctorProfile();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.setItem('logout_redirect', '/staff-login');
      await supabase.auth.signOut();
      window.location.replace('/staff-login'); 
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  const isProfileActive = location.pathname.startsWith('/doctor/profile');

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col shrink-0 transition-colors">
      
      <div className="p-8 flex items-center justify-center border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-3 cursor-default">
           <div className="flex flex-col text-right">
              <span className="font-bold text-sm text-gray-800 dark:text-white">
                {doctorName.length > 15 ? doctorName.substring(0, 15) + '...' : doctorName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {doctorSpecialty.length > 18 ? doctorSpecialty.substring(0, 18) + '...' : doctorSpecialty}
              </span>
           </div>
           
           {doctorAvatar ? (
             <img src={doctorAvatar} alt="Doctor Avatar" className="h-11 w-11 rounded-full object-cover shadow-sm border border-gray-200 dark:border-gray-700" />
           ) : (
             <div className="h-11 w-11 rounded-full bg-[#00838F] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                 {doctorInitials}
             </div>
           )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4 overflow-y-auto custom-scrollbar">
        {doctorNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/'); 
          return (
            <button 
              key={item.id} 
              onClick={() => navigate(item.path)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all outline-none ${
                isActive 
                  ? "bg-[#E0F7FA] text-[#00838F] dark:bg-cyan-900/30 dark:text-cyan-400 font-bold" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button 
            onClick={() => navigate('/doctor/profile')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all outline-none ${
              isProfileActive 
                ? "bg-[#E0F7FA] text-[#00838F] dark:bg-cyan-900/30 dark:text-cyan-400 font-bold" 
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold"
            }`}
          >
              <User size={20} /><span>الملف الشخصي</span>
          </button>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-semibold outline-none transition-all">
              <LogOut size={20} /><span>تسجيل الخروج</span>
          </button>
      </div>
    </aside>
  );
};