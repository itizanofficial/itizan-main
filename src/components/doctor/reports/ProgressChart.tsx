import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportsService } from '../../../services/reportsService';

export const ProgressChart: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [lineData, setLineData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvaluations = async () => {
      setLoading(true);
      try {
        const result = await reportsService.getEvaluations(patientId);
        if (result) {
          setLineData(result.lineData);
          setRadarData(result.radarData);
        } else {
          throw new Error('No Data');
        }
      } catch (err) {
        // 🌟 تصفير كامل للشارت (بدون داتا وهمية) ليعكس الواقع
        setLineData([
          { month: 'لا توجد تقييمات', sleep: 0, communication: 0, depression: 0, anxiety: 0 }
        ]);
        setRadarData([
          { subject: 'التواصل', A: 0, fullMark: 100 },
          { subject: 'النشاط', A: 0, fullMark: 100 },
          { subject: 'النوم', A: 0, fullMark: 100 },
          { subject: 'التركيز', A: 0, fullMark: 100 },
          { subject: 'المزاج', A: 0, fullMark: 100 },
          { subject: 'القلق', A: 0, fullMark: 100 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchEvaluations();
  }, [patientId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00838F]" size={32} /></div>;

  return (
    <div className="space-y-6 animate-fade-in mt-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-[#00838F]" size={20} />
        <h3 className="text-lg font-black text-gray-800 dark:text-white">التقدم السلوكي (تقييمات فعلية)</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm h-80 flex flex-col">
          <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 text-center">مؤشرات التحسن الشهرية</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold', textAlign:'right' }} />
              <Line type="monotone" dataKey="communication" name="التواصل" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="sleep" name="النوم" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="depression" name="الاكتئاب" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="anxiety" name="القلق" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm h-80 flex flex-col">
          <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 text-center">تقييم الحالة الراهنة</h4>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="التقييم" dataKey="A" stroke="#00838F" fill="#00BCD4" fillOpacity={0.5} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold', textAlign:'right' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};