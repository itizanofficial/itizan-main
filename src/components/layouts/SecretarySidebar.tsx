import React, { useState, useEffect } from 'react';
import { CalendarDays, Users, Activity, MessageSquare, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export const SecretarySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [secretaryName, setSecretaryName] = useState('جاري التحميل...');

  // 🌟 جلب بيانات السكرتير الحالي من الداتا بيز
  useEffect(() => {
    const fetchSecretaryData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('secretaries')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data) {
            // بنشوف لو الاسم متسجل في name أو full_name
            setSecretaryName(data.name || data.full_name || 'سكرتير المركز');
          } else {
            setSecretaryName('سكرتير المركز');
          }
        }
      } catch (error) {
        console.error("Error fetching secretary data:", error);
      }
    };
    fetchSecretaryData();
  }, []);

  // 🌟 دالة تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/staff-login');
  };

  const menuItems = [
    { id: 'reservations', label: 'الحجوزات', icon: <CalendarDays size={20} />, path: '/secretary/reservations' },
    { id: 'sessions', label: 'الجلسات', icon: <Activity size={20} />, path: '/secretary/sessions' },
    { id: 'patients', label: 'المرضى', icon: <Users size={20} />, path: '/secretary/patients' },
    { id: 'messages', label: 'الرسائل', icon: <MessageSquare size={20} />, path: '/secretary/messages' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col h-screen shrink-0 font-sans shadow-sm" dir="rtl">
      
      {/* 🌟 البروفايل (ديناميكي) */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800">
        <div className="w-12 h-12 bg-[#00838F] text-white rounded-full flex items-center justify-center font-black text-xl shadow-md">
          {secretaryName !== 'جاري التحميل...' ? secretaryName.charAt(0) : 'س'}
        </div>
        <div className="overflow-hidden">
          <h2 className="font-black text-gray-900 dark:text-white truncate">{secretaryName}</h2>
          <p className="text-xs font-bold text-gray-500">سكرتير المركز</p>
        </div>
      </div>

      {/* الروابط */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all outline-none ${
                isActive 
                  ? 'bg-cyan-50 dark:bg-cyan-900/30 text-[#00838F] dark:text-cyan-400 border-r-4 border-[#00838F]' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#00838F]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* 🌟 زر تسجيل الخروج (مفعل) */}
      <div className="p-4 border-t border-gray-50 dark:border-gray-800">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold text-sm transition-colors outline-none">
          <LogOut size={20} className="rtl:-scale-x-100" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};