import React, { createContext, useContext, useState, useEffect,type ReactNode } from 'react';

export type Role = 'doctor' | 'secretary';

interface AppContextType {
  isDark: boolean;
  toggleTheme: () => void;
  userRole: Role;
  setUserRole: (role: Role) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. نجبر التطبيق يبدأ بالوضع الفاتح دائماً عشان نتأكد إن المشكلة اتحلت
  const [isDark, setIsDark] = useState<boolean>(false); 
  const [userRole, setUserRole] = useState<Role>('doctor');

  // 2. التحكم الصارم في الـ HTML
  useEffect(() => {
    const root = window.document.documentElement;
    
    // تنظيف إجباري في البداية
    root.classList.remove('dark', 'light');
    
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark'; // لضبط ألوان السكرول بار
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <AppContext.Provider value={{ isDark, toggleTheme, userRole, setUserRole }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};