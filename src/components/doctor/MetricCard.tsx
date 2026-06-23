import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  bgLight: string;
  circleColorLight: string;
  textColorLight: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, bgLight, circleColorLight, textColorLight }) => {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-6 h-40 flex flex-col items-center justify-center text-center shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md cursor-default border border-gray-50 dark:border-gray-800 ${bgLight} dark:bg-gray-800`}>
      
      {/* الدائرة الجمالية في الخلفية */}
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-50 dark:opacity-10 ${circleColorLight}`}></div>
      
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${circleColorLight} ${textColorLight} dark:bg-gray-700 dark:text-white shadow-sm`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <h3 className={`text-4xl font-black ${textColorLight} dark:text-white tracking-tight`}>{value}</h3>
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{title}</p>
      </div>
      
    </div>
  );
};