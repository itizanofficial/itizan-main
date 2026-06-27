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
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) { age--; }
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
        const timeStr = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });

        return {
          id: apt.id,
          patientId: apt.patient?.id || apt.patient_id,
          patientName: apt.patient?.name || apt.patient?.full_name || 'مريض غير مسجل',
          age: (apt.patient?.dob || apt.patient?.birth_date) ? calculateAge(apt.patient?.dob || apt.patient?.birth_date) : '---', 
          phone: apt.patient?.phone || '---',
          date: yyyyMmDd,
          time: timeStr,
          session_type: apt.session_type || 'كشف', 
          mode: apt.mode || 'حضور بالعيادة', 
          diagnosis: apt.diagnosis || '',
          status: apt.status,
          rawStatus: apt.status,
          payment_status: apt.payment_status || 'unpaid'
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
    
    const isPaidAndConfirmed = (apt.rawStatus === 'مؤكدة' || apt.rawStatus === 'confirmed' || apt.rawStatus === 'مكتملة') && apt.payment_status === 'paid';
    
    if (isPaidAndConfirmed && statusFilter !== 'مؤكد ومدفوع') {
      return false; // طرد للشاشة التشغيلية
    }

    const isPending = !isPaidAndConfirmed && apt.rawStatus !== 'ملغاة' && apt.rawStatus !== 'cancelled';
    
    let matchStatus = true;
    if (statusFilter === 'مؤكد ومدفوع') matchStatus = isPaidAndConfirmed;
    if (statusFilter === 'بانتظار الدفع/التأكيد') matchStatus = isPending;

    return matchSearch && matchStatus;
  });

  // 🌟 دالة الحفظ الصارمة لحماية الداتا بيز 🌟
  const handleSave = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doctorData } = await supabase.from('doctors').select('admin_id, consultation_price, followup_price').eq('id', user.id).single();
      const combinedDateTime = new Date(`${data.date}T${data.time}:00`).toISOString();

      const sessionPayload: any = {
        doctor_id: user.id,
        admin_id: doctorData?.admin_id, 
        patient_id: data.patientId,
        session_date: combinedDateTime,
        session_type: data.session_type || 'كشف',
        mode: data.mode || 'حضور بالعيادة',
        diagnosis: data.diagnosis || ''
      };

      if (data.id) {
        // حماية الفلوس في حالة التعديل
        const { data: oldSession } = await supabase.from('sessions').select('*').eq('id', data.id).single();
        if (oldSession && oldSession.payment_status !== 'paid') {
            sessionPayload.fees = data.fees;
        }

        await supabase.from('sessions').update(sessionPayload).eq('id', data.id);
        await doctorService.sendPatientNotification(data.patientId, 'تعديل موعد الحجز 🔄', `تم تعديل موعد جلستك ليكون يوم ${data.date} الساعة ${data.time}.`);
        toast.success('تم تعديل الحجز بنجاح.');
      } else {
        sessionPayload.fees = data.fees;
        sessionPayload.status = 'قيد الانتظار';
        sessionPayload.payment_status = 'unpaid';

        await supabase.from('sessions').insert([sessionPayload]);
        await doctorService.sendPatientNotification(data.patientId, 'تم حجز موعد جديد 📅', `تم حجز موعد مبدئي لك (${data.mode}) يوم ${data.date} الساعة ${data.time}. في انتظار تأكيد الدفع.`);
        toast.success('تم حجز الموعد المبدئي بنجاح.');
      }
      setIsModalOpen(false);
      fetchAppointments(); 

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
                fetchAppointments(); 
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
        <span className="font-bold text-gray-800">تأكيد مبدئي لحجز: {apt.patientName}؟</span>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">إلغاء</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await doctorService.updateSessionStatus(apt.id, 'confirmed');
                await doctorService.sendPatientNotification(apt.patientId, 'تأكيد مبدئي ✅', `تم الموافقة على الموعد يوم ${apt.date} الساعة ${apt.time} مبدئياً. يرجى إتمام الدفع لتأكيد الحجز النهائي.`, 'system');
                toast.success('تم التأكيد المبدئي بنجاح!');
                fetchAppointments(); 
              } catch (error: any) {
                toast.error('حدث خطأ أثناء التأكيد.');
              }
            }} 
            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
          >
            تأكيد مبدئي
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
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">متابعة حجوزات المراجعين مع الاستقبال.</p>
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
              placeholder="ابحث باسم المراجع أو رقم الموبايل..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-12 py-3 outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm shadow-inner" 
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 bg-white dark:bg-gray-900">
            <Filter size={18} className="text-gray-400 shrink-0" />
            {['الكل', 'مؤكد ومدفوع', 'بانتظار الدفع/التأكيد'].map(filter => (
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