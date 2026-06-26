import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle2, Plus, Search, Loader2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { secretaryService } from '../../services/secretaryService';
import { supabase } from '../../services/supabase';
import { SecretaryAppointmentTable } from '../secretary/SecretaryAppointmentTable';
import { SecretaryAppointmentModal } from '../secretary/SecretaryAppointmentModal';

export const SecretaryReservations = () => {
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, todayRevenue: 0 });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [editingData, setEditingData] = useState<any>(null);

  const loadData = async () => {
    try {
      const currentAdminId = await secretaryService.getCurrentAdminId();
      if (!currentAdminId) return;
      setAdminId(currentAdminId);

      const statsData = await secretaryService.getReservationStats(currentAdminId);
      setStats(statsData);

      const resData = await secretaryService.getAllReservations(currentAdminId);
      
      const formatted = (resData || []).map((apt: any) => ({
        id: apt.id,
        patientId: apt.patient_id,
        doctorId: apt.doctor_id,
        patientName: apt.patient?.name || apt.patient?.full_name || 'مريض غير مسجل',
        phone: apt.patient?.phone || '---',
        doctorName: apt.doctor?.name || apt.doctor?.full_name || '---',
        date: apt.session_date ? new Date(apt.session_date).toLocaleDateString('en-CA') : '',
        time: apt.session_date ? new Date(apt.session_date).toLocaleTimeString('en-US', { hour12: false }).substring(0, 5) : '',
        session_type: apt.session_type || 'كشف',
        fees: apt.fees || 0,
        payment_status: apt.payment_status || 'unpaid',
        status: apt.status,
      }));

      setAppointments(formatted);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 تشغيل الـ Realtime عشان أي حجز من الدكتور أو المريض يسمّع فوراً عند السكرتير
  useEffect(() => { 
    loadData(); 

    const channel = supabase
      .channel('sessions_realtime_change')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadData(); // يعمل تحديث فوراً للأرقام والجدول
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConfirmPayment = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await secretaryService.confirmPaymentAndSession(sessionId);
      toast.success('تم تأكيد الدفع بنجاح وزاد إجمالي التحصيل! 💰✅');
      await loadData(); // 🌟 إعادة تحميل الداتا فوراً عشان الأرقام تزيد
    } catch (error) {
      toast.error("حدث خطأ أثناء التأكيد");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveModal = async (data: any) => {
    try {
      const combinedDateTime = new Date(`${data.date}T${data.time}:00`).toISOString();
      const payload = {
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        admin_id: adminId,
        session_date: combinedDateTime,
        session_type: data.session_type,
        fees: data.fees,
        status: data.id ? data.status : 'قيد الانتظار',
        payment_status: data.id ? data.payment_status : 'unpaid'
      };

      if (data.id) {
        await supabase.from('sessions').update(payload).eq('id', data.id);
        toast.success('تم التعديل بنجاح');
      } else {
        await supabase.from('sessions').insert([payload]);
        toast.success('تم الحجز بنجاح وفي انتظار الدفع التوجيهي');
      }
      loadData();
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('sessions').delete().eq('id', id);
    toast.success('تم الإلغاء بنجاح');
    loadData();
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.patientName.includes(searchQuery) || apt.phone.includes(searchQuery) || apt.doctorName.includes(searchQuery)
  );

  return (
    <div className="flex-1 bg-gray-50/50 dark:bg-gray-900 p-8 overflow-y-auto animate-fade-in font-sans" dir="rtl">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">إدارة الحجوزات والخزينة</h1>
          <p className="text-sm font-bold text-gray-500">متابعة عمليات الدفع الفوري وتأكيد الجلسات</p>
        </div>
        <button onClick={() => { setEditingData(null); setIsModalOpen(true); }} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl font-bold flex gap-2">
          <Plus size={20} /> حجز جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border shadow-sm flex justify-between">
          <div><h3 className="text-3xl font-black">{stats.total}</h3><p className="text-sm font-bold text-gray-500">الحجوزات</p></div>
          <div className="w-12 h-12 bg-cyan-50 text-[#00838F] rounded-full flex items-center justify-center"><CalendarDays /></div>
        </div>
        
        {/* 🌟 كارت التحصيل المالي الذكي لايف */}
        <div className="bg-white rounded-3xl p-6 border border-b-4 border-b-emerald-500 shadow-sm flex justify-between">
          <div><h3 className="text-3xl font-black text-emerald-600">{stats.todayRevenue} ج.م</h3><p className="text-sm font-bold text-gray-500">إجمالي خزينة المركز</p></div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Wallet /></div>
        </div>

        <div className="bg-white rounded-3xl p-6 border shadow-sm flex justify-between">
          <div><h3 className="text-3xl font-black text-orange-500">{stats.pending}</h3><p className="text-sm font-bold text-gray-500">بانتظار الدفع</p></div>
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center"><Clock /></div>
        </div>
        <div className="bg-white rounded-3xl p-6 border shadow-sm flex justify-between">
          <div><h3 className="text-3xl font-black text-green-500">{stats.confirmed}</h3><p className="text-sm font-bold text-gray-500">تم التأكيد والدفع</p></div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center"><CheckCircle2 /></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex gap-4">
          <div className="relative w-96">
            <input type="text" placeholder="بحث باسم المريض أو الطبيب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-12 py-3 font-bold outline-none focus:border-[#00838F]" />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        {loading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#00838F]" size={40}/></div> : 
          <SecretaryAppointmentTable 
            appointments={filteredAppointments} 
            onConfirmPayment={handleConfirmPayment}
            actionLoading={actionLoading}
            onEdit={(data: any) => { setEditingData(data); setIsModalOpen(true); }}
            onDelete={handleDelete}
            onRemind={() => toast.success('تم إرسال التذكير')}
          />
        }
      </div>

      <SecretaryAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} adminId={adminId} onSave={handleSaveModal} editingData={editingData} />
    </div>
  );
};