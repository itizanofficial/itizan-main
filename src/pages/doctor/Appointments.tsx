import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; 
import { AppointmentTable } from '../../components/doctor/appointments/AppointmentTable';
import { AppointmentModal } from '../../components/doctor/appointments/AppointmentModal';
import { doctorService } from '../../services/doctorService';
import { supabase } from '../../services/supabase';

const calculateAge = (dobString: string) => {
  if (!dobString) return '---';
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const Appointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await doctorService.getAppointments(user.id);
      
      const formatted = (data || []).map((apt: any) => {
        const dateObj = apt.session_date ? new Date(apt.session_date) : new Date();
        const yyyyMmDd = dateObj.toLocaleDateString('en-CA'); 
        const hhMm = dateObj.toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);

        let arabicStatus = 'بانتظار التأكيد';
        if (apt.status === 'completed' || apt.status === 'confirmed' || apt.status === 'مؤكدة') arabicStatus = 'موعد مؤكد';
        if (apt.status === 'cancelled' || apt.status === 'ملغاة') arabicStatus = 'ملغي';
        if (apt.status === 'scheduled' || apt.status === 'مجدولة') arabicStatus = 'بانتظار التأكيد';
        if (apt.status === 'rescheduled' || apt.status === 'معدلة') arabicStatus = 'تم التعديل';

        return {
          id: apt.id,
          patientId: apt.patient?.id || apt.patient_id,
          patientName: apt.patient?.name || 'مريض غير مسجل',
          age: apt.patient?.dob ? calculateAge(apt.patient.dob) : '---', 
          phone: apt.patient?.phone || '---',
          date: yyyyMmDd,
          time: hhMm,
          type: apt.diagnosis || 'كشف عام', 
          mode: apt.session_type || 'حضور بالعيادة', 
          status: arabicStatus,
          rawStatus: apt.status
        };
      });

      setAppointments(formatted);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const subscription = supabase
      .channel('appointments_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchAppointments(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const filteredAppointments = appointments.filter(apt => {
    const matchSearch = (apt.patientName && apt.patientName.toLowerCase().includes(searchTerm.toLowerCase())) || 
                        (apt.phone && apt.phone.includes(searchTerm));
    const matchStatus = statusFilter === 'الكل' || apt.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const combinedDateTime = new Date(`${data.date}T${data.time}:00`).toISOString();

      const sessionPayload = {
        doctor_id: user.id,
        patient_id: data.patientId,
        session_date: combinedDateTime,
        session_type: data.mode,
        diagnosis: data.type, 
        status: data.id ? data.rawStatus : 'scheduled'
      };

      if (data.id) {
        await supabase.from('sessions').update(sessionPayload).eq('id', data.id);
        await doctorService.sendPatientNotification(data.patientId, 'تعديل موعد الحجز 🔄', `تم تعديل موعد جلستك ليكون يوم ${data.date} الساعة ${data.time}.`);
        toast.success('تم تعديل الحجز بنجاح.');
      } else {
        await supabase.from('sessions').insert([sessionPayload]);
        await doctorService.sendPatientNotification(data.patientId, 'تم حجز موعد جديد 📅', `تم حجز موعد جديد لك (${data.mode}) يوم ${data.date} الساعة ${data.time}.`);
        toast.success('تم حجز الموعد بنجاح.');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error('حصلت مشكلة أثناء الحفظ.');
    }
  };
  
  const handleDelete = async (id: any) => {
    toast((t) => (
      <div className="flex flex-col gap-2 font-sans" dir="rtl">
        <span className="font-bold text-gray-800">متأكد إنك عايز تلغي الحجز ده؟</span>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">تراجع</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await supabase.from('sessions').delete().eq('id', id);
                toast.success('تم إلغاء الحجز بنجاح.');
              } catch (error) {
                toast.error('تعذر إلغاء الحجز حالياً.');
              }
            }} 
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
          >
            تأكيد الإلغاء
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const handleRemind = async (apt: any) => {
    try {
      await doctorService.sendPatientNotification(apt.patientId, 'تذكير بموعد الجلسة 🔔', `بنفكرك بموعد جلستك الجاية يوم ${apt.date} الساعة ${apt.time}.`);
      toast.success('تم إرسال التذكير للمريض.');
    } catch (error) {
      toast.error('فشل إرسال التذكير.');
    }
  };

  const handleConfirmCall = async (apt: any) => {
    toast((t) => (
      <div className="flex flex-col gap-2 font-sans" dir="rtl">
        <span className="font-bold text-gray-800">تأكيد حجز المريض: {apt.patientName}؟</span>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">إلغاء</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                // 🌟 استخدام الدالة المدرعة من السيرفيس بدلاً من المناداة المباشرة
                await doctorService.updateSessionStatus(apt.id, 'confirmed');
                await doctorService.sendPatientNotification(apt.patientId, 'تم تأكيد حجزك ✅', `تم تأكيد موعد جلستك يوم ${apt.date} الساعة ${apt.time} بنجاح.`, 'system');
                toast.success('تم تأكيد الحجز بنجاح!');
              } catch (error: any) {
                console.error("❌ إيرور التأكيد:", error);
                toast.error('حدث خطأ أثناء التأكيد. المرجو مراجعة الصلاحيات.');
              }
            }} 
            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
          >
            تأكيد الحجز
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans text-gray-900 dark:text-white">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">إدارة الحجوزات</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">مراجعة وتأكيد حجوزات المرضى.</p>
        </div>
        <button onClick={() => { setEditingData(null); setIsModalOpen(true); }} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm active:scale-95">
          <Plus size={20} /> <span className="text-white">حجز جديد</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <div className="relative w-full lg:w-96">
            <input 
              type="text" 
              placeholder="ابحث باسم المريض أو رقم الموبايل..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-12 py-3 outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm shadow-inner" 
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 bg-white dark:bg-gray-900">
            <Filter size={18} className="text-gray-400 shrink-0" />
            {['الكل', 'موعد مؤكد', 'بانتظار التأكيد', 'تم التعديل'].map(filter => (
              <button 
                key={filter} 
                onClick={() => setStatusFilter(filter)} 
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors outline-none ${
                  statusFilter === filter 
                    ? 'bg-[#00838F] text-white shadow-sm shadow-cyan-500/20' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white dark:bg-gray-900">
            <Loader2 className="animate-spin text-[#00838F]" size={40} />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900">
            <AppointmentTable 
              appointments={filteredAppointments} 
              onEdit={(data: any) => { setEditingData(data); setIsModalOpen(true); }}
              onDelete={handleDelete}
              onRemind={handleRemind}
              onConfirmCall={handleConfirmCall}
            />
          </div>
        )}
      </div>

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        editingData={editingData} 
      />
    </div>
  );
};