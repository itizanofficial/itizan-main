import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle2, Plus, Search, Loader2, Wallet, ClipboardCheck } from 'lucide-react';
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

  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);

  // 🌟 دالة مساعدة لإرسال الإشعارات للمريض
  const sendNotification = async (patientId: string, title: string, body: string, type: string) => {
    if (!patientId) return;
    try {
      await supabase.from('notifications').insert([{
        patient_id: patientId,
        title,
        body,
        type,
        is_read: false
      }]);
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const loadData = async () => {
    try {
      const currentAdminId = await secretaryService.getCurrentAdminId();
      if (!currentAdminId) return;
      setAdminId(currentAdminId);

      const resData = await secretaryService.getAllReservations(currentAdminId);
      
      let total = 0; let confirmed = 0; let pending = 0; let shiftRevenue = 0;
      
      const formatted = (resData || []).map((apt: any) => {
        total++;
        if (apt.payment_status === 'paid' || apt.status === 'confirmed' || apt.status === 'مؤكدة') {
          confirmed++;
        } else {
          pending++;
        }

        if (apt.payment_status === 'paid' && !apt.shift_closed) {
          shiftRevenue += Number(apt.fees || 0);
        }

        return {
          id: apt.id,
          patientId: apt.patient_id,
          doctorId: apt.doctor_id,
          patientName: apt.patient?.name || apt.patient?.full_name || 'مريض غير مسجل',
          phone: apt.patient?.phone || '---',
          doctorName: apt.doctor?.name || apt.doctor?.full_name || '---',
          date: apt.session_date ? new Date(apt.session_date).toLocaleDateString('en-CA') : '',
          time: apt.session_date ? new Date(apt.session_date).toLocaleTimeString('en-US', { hour12: false }).substring(0, 5) : '',
          mode: apt.mode || 'حضور بالعيادة',
          session_type: apt.session_type || 'كشف',
          fees: apt.fees || 0,
          payment_status: apt.payment_status || 'unpaid',
          status: apt.status,
          shift_closed: apt.shift_closed
        };
      });

      setStats({ total, confirmed, pending, todayRevenue: shiftRevenue });
      setAppointments(formatted);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
    const channel = supabase.channel('sessions_realtime_change').on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => { loadData(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // 🌟 تعديل: تأكيد الدفع وإرسال إشعار للمريض
  const handleConfirmPayment = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await secretaryService.confirmPaymentAndSession(sessionId);
      
      // جلب الـ patientId من الـ state عشان نبعتله الإشعار
      const targetAppointment = appointments.find(apt => apt.id === sessionId);
      if (targetAppointment && targetAppointment.patientId) {
        await sendNotification(
          targetAppointment.patientId,
          'تم تأكيد الحجز والدفع ✅',
          'تم تأكيد جلستك بنجاح، الطبيب بانتظارك في الموعد المحدد.',
          'payment_confirmed'
        );
      }

      toast.success('تم تأكيد الدفع بنجاح وزاد إجمالي التحصيل! 💰✅');
      await loadData(); 
    } catch (error) { 
      toast.error("حدث خطأ أثناء التأكيد"); 
    } finally { 
      setActionLoading(null); 
    }
  };

  // 🌟 تعديل: الحفظ المبدئي وإرسال إشعار بالدفع
  const handleSaveModal = async (data: any) => {
    try {
      if (!adminId) return;
      await secretaryService.saveSession(data, adminId);
      
      if (data.patient_id && !data.id) {
        // إشعار بالحجز الجديد فقط (مش التعديل)
        await sendNotification(
          data.patient_id,
          'تم تسجيل حجزك مبدئياً 📅',
          'يرجى الدفع لتأكيد موعد الجلسة نهائياً.',
          'new_booking'
        );
      }

      toast.success(data.id ? 'تم تعديل الجلسة بنجاح 🔄' : 'تم الحجز بنجاح، في انتظار الدفع! 📅');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) { 
      toast.error(err.message || 'حدث خطأ أثناء الحفظ'); 
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('sessions').delete().eq('id', id);
      toast.success('تم الإلغاء بنجاح 🗑️');
      loadData();
    } catch (err: any) { toast.error('حدث خطأ أثناء الإلغاء'); }
  };

  // 🌟 إضافة: زر التذكير يرسل إشعار فعلي للداتابيز
  const handleRemindPatient = async (sessionId: string) => {
    const targetAppointment = appointments.find(apt => apt.id === sessionId);
    if (targetAppointment && targetAppointment.patientId) {
      await sendNotification(
        targetAppointment.patientId,
        'تذكير بتأكيد الجلسة ',
        'يرجى المبادرة بدفع رسوم الجلسة لتأكيد موعدك قبل الإلغاء.',
        'reminder'
      );
      toast.success('تم إرسال التذكير للمريض بنجاح 🔔');
    } else {
      toast.error('لم يتم العثور على بيانات المريض');
    }
  };

  const handleCloseDailyReport = async () => {
    if (stats.todayRevenue === 0) {
      toast.error('الخزينة فارغة بالفعل! لا يوجد إيرادات لتقفيلها.');
      setIsCloseDayModalOpen(false);
      return;
    }
    
    setIsClosingDay(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const todayStr = new Date().toLocaleDateString('en-CA');
      
      await supabase.from('daily_reports').insert([{
        admin_id: adminId,
        secretary_id: user?.id,
        report_date: todayStr,
        total_revenue: stats.todayRevenue,
        confirmed_sessions: stats.confirmed
      }]);

      await supabase.from('sessions')
        .update({ shift_closed: true })
        .eq('admin_id', adminId)
        .eq('payment_status', 'paid')
        .eq('shift_closed', false);

      toast.success('تم تقفيل الخزينة وتصفير الإيرادات لبدء وردية جديدة! 📜✅');
      setIsCloseDayModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء تقفيل اليومية');
    } finally {
      setIsClosingDay(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => apt.patientName.includes(searchQuery) || apt.phone.includes(searchQuery) || apt.doctorName.includes(searchQuery));

  return (
    <div className="flex-1 bg-gray-50/50 dark:bg-gray-900 p-8 overflow-y-auto animate-fade-in font-sans" dir="rtl">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">إدارة الحجوزات والخزينة</h1>
          <p className="text-sm font-bold text-gray-500">متابعة عمليات الدفع الفوري وتأكيد الجلسات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCloseDayModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold flex gap-2 transition-colors shadow-sm">
            <ClipboardCheck size={20} /> تقفيل الخزينة
          </button>
          
          <button onClick={() => { setEditingData(null); setIsModalOpen(true); }} className="bg-[#00838F] hover:bg-[#006064] text-white px-5 py-3 rounded-xl font-bold flex gap-2 transition-colors shadow-sm">
            <Plus size={20} /> حجز جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border shadow-sm flex justify-between">
          <div><h3 className="text-3xl font-black">{stats.total}</h3><p className="text-sm font-bold text-gray-500">الحجوزات</p></div>
          <div className="w-12 h-12 bg-cyan-50 text-[#00838F] rounded-full flex items-center justify-center"><CalendarDays /></div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-b-4 border-b-emerald-500 shadow-sm flex justify-between transform transition-all hover:scale-105">
          <div><h3 className="text-3xl font-black text-emerald-600">{stats.todayRevenue} ج.م</h3><p className="text-sm font-bold text-gray-500">خزينة الوردية الحالية</p></div>
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
            onRemind={handleRemindPatient} // 🌟 تمرير الدالة الجديدة للزرار
          />
        }
      </div>

      <SecretaryAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} adminId={adminId} onSave={handleSaveModal} editingData={editingData} />

      {isCloseDayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 border border-gray-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <ClipboardCheck size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">تقفيل الخزينة وإرسال التقرير</h3>
                <p className="text-sm text-gray-500 mt-2 font-bold leading-relaxed">
                  سيتم تصفير خزينة الوردية الحالية وإرسال الآتي للمدير:<br/>
                  <span className="text-emerald-600 text-lg">إجمالي التحصيل: {stats.todayRevenue} ج.م</span><br/>
                  <span className="text-[#00838F]">الجلسات المؤكدة: {stats.confirmed} جلسة</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsCloseDayModalOpen(false)} disabled={isClosingDay} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors">تراجع</button>
              <button onClick={handleCloseDailyReport} disabled={isClosingDay} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-colors flex items-center justify-center gap-2">
                {isClosingDay ? <Loader2 size={18} className="animate-spin" /> : 'اعتماد وتصفير الخزينة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};