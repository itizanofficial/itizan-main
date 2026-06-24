import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';
import type { DoctorProfileData } from '../../../services/doctorProfileService';

interface ScheduleInfoProps {
  profileData: DoctorProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<DoctorProfileData | null>>;
  isEditing: boolean;
}

const DEFAULT_SCHEDULE = [
  { day: 'الأحد', time: '', type: 'off' as const },
  { day: 'الإثنين', time: '', type: 'off' as const },
  { day: 'الثلاثاء', time: '', type: 'off' as const },
  { day: 'الأربعاء', time: '', type: 'off' as const },
  { day: 'الخميس', time: '', type: 'off' as const },
  { day: 'الجمعة', time: '', type: 'off' as const },
  { day: 'السبت', time: '', type: 'off' as const },
];

export const ScheduleInfo: React.FC<ScheduleInfoProps> = ({ profileData, setProfileData, isEditing }) => {
  
  const scheduleToRender = (profileData?.schedule && profileData.schedule.length === 7) 
    ? profileData.schedule 
    : DEFAULT_SCHEDULE;

  useEffect(() => {
    if (!profileData?.schedule || profileData.schedule.length !== 7) {
      setProfileData(prev => prev ? { ...prev, schedule: DEFAULT_SCHEDULE } : prev);
    }
  }, []);

  const handleTimeChange = (index: number, newTime: string) => {
    setProfileData(prev => {
      if (!prev) return prev;
      const newSchedule = [...scheduleToRender];
      newSchedule[index].time = newTime;
      return { ...prev, schedule: newSchedule };
    });
  };

  const handleTypeChange = (index: number, newType: 'work' | 'off') => {
    setProfileData(prev => {
      if (!prev) return prev;
      const newSchedule = [...scheduleToRender];
      newSchedule[index].type = newType;
      newSchedule[index].time = newType === 'off' ? 'إجازة' : '09:00 - 17:00';
      return { ...prev, schedule: newSchedule };
    });
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center justify-center gap-2 mb-8">
        <Clock size={22} /> الجدول الزمني للمناوبات
      </h3>
      
      {isEditing && (
        <div className="text-center text-[#00838F] bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800 p-4 rounded-xl font-bold text-sm mb-6 flex items-center justify-center gap-2">
مواعيد العمل الاسبوعية         </div>
      )}

      <div className="space-y-3">
        {scheduleToRender.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row justify-between items-center p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl gap-4 shadow-sm hover:border-[#00838F]/30 transition-colors">
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <span className="font-black text-gray-900 dark:text-white text-lg w-20">{item.day}</span>
              
              {isEditing && (
                <select
                  value={item.type}
                  onChange={(e) => handleTypeChange(idx, e.target.value as 'work' | 'off')}
                  className={`px-4 py-2.5 rounded-xl font-bold outline-none cursor-pointer border transition-colors ${
                    item.type === 'work' 
                      ? 'bg-cyan-50 text-[#00838F] border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800' 
                      : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-900/30'
                  }`}
                >
                  <option value="off">يوم راحة</option>
                  <option value="work">يوم عمل</option>
                </select>
              )}
            </div>

            {isEditing && item.type === 'work' ? (
              <input 
                type="text" 
                dir="ltr"
                value={item.time} 
                onChange={(e) => handleTimeChange(idx, e.target.value)}
                placeholder="مثال: 09:00 - 17:00"
                className="w-full sm:w-56 text-center border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-2.5 font-black text-[#00838F] dark:text-cyan-400 focus:outline-none focus:border-[#00838F] transition-colors"
              />
            ) : (
              item.type === 'work' ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-5 py-2 rounded-xl font-bold flex items-center gap-2" dir="ltr">
                  <Clock size={16} /> {item.time || '09:00 - 17:00'}
                </span>
              ) : (
                <span className="bg-red-50 text-red-600 border border-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 px-8 py-2 rounded-xl font-black">
                  راحة
                </span>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};