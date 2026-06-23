import React, { useEffect, useState } from 'react';
import { Bell, Sun, Moon, Search } from 'lucide-react';

export const Header: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 transition-colors shrink-0 z-10 shadow-sm">
      <div className="relative w-96 max-w-full">
        <input 
          type="text" 
          placeholder="البحث في السجلات الطبية السريعة..." 
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl px-12 py-3 outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm shadow-inner"
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      </div>

      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="w-11 h-11 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-cyan-50 hover:text-[#00838F] dark:hover:bg-cyan-900/30 dark:hover:text-cyan-400 transition-colors shadow-sm border border-gray-100 dark:border-gray-700">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="w-11 h-11 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-cyan-50 hover:text-[#00838F] dark:hover:bg-cyan-900/30 dark:hover:text-cyan-400 transition-colors shadow-sm border border-gray-100 dark:border-gray-700 relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-3 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};