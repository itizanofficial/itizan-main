import React from 'react';
import { User, CalendarDays, Star, Clock } from 'lucide-react';
import type { DoctorProfileData } from '../../../services/doctorProfileService';

interface ProfileStatsProps {
  profileData: DoctorProfileData;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ profileData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
        <div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">{profileData.total_patients}</h3>
          <p className="text-sm font-bold text-gray-500 mt-1">إجمالي المراجعين</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center"><User size={28} /></div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
        <div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">{profileData.completed_sessions}</h3>
          <p className="text-sm font-bold text-gray-500 mt-1">الاستشارات المكتملة</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center justify-center"><CalendarDays size={28} /></div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
        <div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">{profileData.rating}</h3>
          <p className="text-sm font-bold text-gray-500 mt-1">التقييم السريري</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 flex items-center justify-center"><Star size={28} /></div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
        <div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">{profileData.working_hours}</h3>
          <p className="text-sm font-bold text-gray-500 mt-1">ساعات الممارسة</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 flex items-center justify-center"><Clock size={28} /></div>
      </div>

    </div>
  );
};