import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Loader2 } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const ProgressChart: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاكاة جلب قراءات تقييم الحالة (Score) من الجلسات السابقة
    const fetchProgress = async () => {
      setLoading(true);
      setTimeout(() => {
        setData([
          { session: 'جلسة 1', score: 30 },
          { session: 'جلسة 2', score: 45 },
          { session: 'جلسة 3', score: 40 },
          { session: 'جلسة 4', score: 60 },
          { session: 'جلسة 5', score: 75 },
          { session: 'جلسة 6', score: 85 },
        ]);
        setLoading(false);
      }, 800);
    };

    if (patientId) fetchProgress();
  }, [patientId]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm w-full flex flex-col h-[400px] animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
          <Target className="text-[#00838F]" size={20} /> مؤشر التحسن السلوكي والمعرفي
        </h3>
      </div>
      
      <div className="flex-1 w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#00838F]" size={32} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00838F" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00838F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#374151" strokeDasharray="4 4" opacity={0.1} />
              <XAxis dataKey="session" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} />
              <YAxis fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1F2937', color: '#fff', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="score" stroke="#00838F" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};