import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportsService } from '../../../services/reportsService';

export const AdherenceStats: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ adherence: 0, totalMinutes: 0, completedSessions: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessionStats = async () => {
      setLoading(true);
      try {
        const result = await reportsService.getSessionStats(patientId);
        setStats({ adherence: result.adherence, totalMinutes: result.totalMinutes, completedSessions: result.completedSessions });
        setChartData(result.chartData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchSessionStats();
  }, [patientId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00838F]" size={32} /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-[#00838F]" size={20} />
        <h3 className="text-lg font-black text-gray-800 dark:text-white">نظرة عامة على الجلسات</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-black text-[#00838F]">{stats.adherence}%</h3>
            <p className="text-sm font-bold text-gray-500 mt-1">نسبة الالتزام</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-[#00838F] flex items-center justify-center border border-cyan-100"><Activity size={24} /></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalMinutes}</h3>
            <p className="text-sm font-bold text-gray-500 mt-1">إجمالي الدقائق</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center border border-blue-100"><Clock size={24} /></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.completedSessions}</h3>
            <p className="text-sm font-bold text-gray-500 mt-1">جلسات مكتملة</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center border border-emerald-100"><CheckCircle2 size={24} /></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm mt-6 h-64">
        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-6 text-center">توزيع الجلسات (5 أسابيع الأخيرة)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6B7280' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip cursor={{ fill: 'rgba(0, 131, 143, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold', textAlign:'right' }} />
            <Bar dataKey="sessions" fill="#00838F" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};