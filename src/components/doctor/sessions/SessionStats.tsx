import React from 'react';
import { CalendarDays, Activity, CheckCircle } from 'lucide-react';

interface StatsProps {
  todayCount: number;
  completedCount: number;
}

export const SessionStats: React.FC<StatsProps> = ({ todayCount, completedCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      
      {/* جلسات اليوم */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 h-36 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-800 bg-[#E0F7FA] dark:bg-cyan-950/40 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-[#B2EBF2] dark:bg-cyan-800 text-[#00838F] dark:text-cyan-300">
          <CalendarDays size={24} strokeWidth={2.5} />
        </div>
        <h3 className="text-3xl font-black text-[#00838F] dark:text-cyan-300">{todayCount}</h3>
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300"> جلسات اليوم</p>
      </div>

      {/* جارية الآن */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 h-36 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-800 bg-[#FFF3E0] dark:bg-orange-950/40 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-[#FFE0B2] dark:bg-orange-800 text-[#E65100] dark:text-orange-300">
          <Activity size={24} strokeWidth={2.5} />
        </div>
        <h3 className="text-3xl font-black text-[#E65100] dark:text-orange-300">0</h3>
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300"> جارية الان قيد التنفيذ</p>
      </div>

      {/* مكتملة */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 h-36 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-800 bg-[#E8F5E9] dark:bg-emerald-950/40 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-[#C8E6C9] dark:bg-emerald-800 text-[#2E7D32] dark:text-emerald-300">
          <CheckCircle size={24} strokeWidth={2.5} />
        </div>
        <h3 className="text-3xl font-black text-[#2E7D32] dark:text-emerald-300">{completedCount}</h3>
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300"> الجلسات  المكتملة</p>
      </div>

    </div>
  );
};