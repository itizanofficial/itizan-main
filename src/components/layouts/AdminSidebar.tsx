import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BarChart3, 
  Settings, LogOut, UserPlus, Building 
} from 'lucide-react';
import { supabase } from '../../services/supabase'; 

const adminNavItems = [
  { id: 'dashboard', name: 'لوحة التحكم', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'team', name: 'إدارة الفريق', icon: Users, path: '/admin/team' },
  { id: 'create-account', name: 'إضافة موظف', icon: UserPlus, path: '/admin/create-account' },
  { id: 'reports', name: 'التقارير الشاملة', icon: BarChart3, path: '/admin/reports' },
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 🌟 حالات لتخزين بيانات المدير لايف
  const [adminName, setAdminName] = useState('إدارة النظام');
  const [adminInitials, setAdminInitials] = useState('م');

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 🌟 جلب بيانات المدير من جدول admins الجديد
        const { data } = await supabase
          .from('admins')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (data && data.full_name) {
          setAdminName(data.full_name);
          setAdminInitials(data.full_name.charAt(0));
        } else if (user.email) {
          const emailName = user.email.split('@')[0];
          setAdminName(emailName);
          setAdminInitials(emailName.charAt(0).toUpperCase());
        }
      } catch (err) {
        console.error("خطأ في جلب بيانات المدير:", err);
      }
    };

    fetchAdminProfile();
  }, []);

  // 🌟 دالة تسجيل خروج المدير القاطعة
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.replace('/login'); // طرد إجباري وتفريغ الكاش
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col transition-colors shrink-0">
      
      {/* اللوجو والملف الشخصي للمدير */}
      <div className="p-8 flex items-center justify-center border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-3 cursor-default">
           <div className="flex flex-col text-right hidden sm:flex">
              <span className="font-black text-sm text-gray-800 dark:text-white truncate max-w-[120px]">
                {adminName}
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                المدير العام 
              </span>
           </div>
           
           <div className="h-11 w-11 rounded-2xl bg-[#00838F] text-white flex items-center justify-center font-black text-lg shadow-md shadow-cyan-500/30">
               {adminInitials}
           </div>
        </div>
      </div>

      {/* القوائم */}
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto custom-scrollbar">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/'); 

          return (
            <button 
              key={item.id} 
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all outline-none ${
                isActive 
                  ? "bg-[#E0F7FA] text-[#00838F] font-black dark:bg-cyan-900/30 dark:text-cyan-400" 
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 font-bold"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* الإعدادات وتسجيل الخروج */}
      <div className="p-4 space-y-2 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => navigate('/admin/settings')} 
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-xl font-bold outline-none transition-all"
          >
              <Settings size={20} />
              <span>إعدادات النظام</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold outline-none transition-all"
          >
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
          </button>
      </div>
    </aside>
  );
};