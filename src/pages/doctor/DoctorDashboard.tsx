import React, { useEffect, useState } from 'react';
import { Users, CalendarDays, Brain, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { doctorService } from '../../services/doctorService';

import { MetricCard } from '../../components/doctor/MetricCard';
import { DoctorTopCharts } from '../../components/doctor/DoctorTopCharts';
import { DoctorProgressChart } from '../../components/doctor/DoctorProgressChart';

export const DoctorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    activePatients: 0,
    completedSessions: 0,
    todaySessions: 0,
    upcomingAppointments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const data = await doctorService.getDashboardMetrics(user.id);
        setMetrics(data);

      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans">
      
      {/* 1. الكروت الإحصائية الحية الموحدة الهوية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="المراجعين النشطين" value={isLoading ? "..." : metrics.activePatients} icon={Users} bgLight="bg-[#FFF3E0]" circleColorLight="bg-[#FFE0B2]" textColorLight="text-[#E65100]" />
        <MetricCard title="الجلسات المكتملة" value={isLoading ? "..." : metrics.completedSessions} icon={CheckCircle} bgLight="bg-[#E8F5E9]" circleColorLight="bg-[#C8E6C9]" textColorLight="text-[#2E7D32]" />
        <MetricCard title="جلسات اليوم" value={isLoading ? "..." : metrics.todaySessions} icon={Brain} bgLight="bg-[#F3E5F5]" circleColorLight="bg-[#E1BEE7]" textColorLight="text-[#7B1FA2]" />
        <MetricCard title="الحجوزات الفادمة" value={isLoading ? "..." : metrics.upcomingAppointments} icon={CalendarDays} bgLight="bg-[#E0F7FA]" circleColorLight="bg-[#B2EBF2]" textColorLight="text-[#00838F]" />
      </div>

      {/* 2. التحليلات الديموغرافية وجدول المواعيد المباشر */}
      <DoctorTopCharts />

      {/* 3. مؤشر الأداء السريري وتقدم الحالات */}
      <DoctorProgressChart />
      
    </div>
  );
};