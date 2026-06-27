import { supabase } from './supabase';

export const secretaryService = {
  // 1. جلب الـ Admin ID
  getCurrentAdminId: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('secretaries')
      .select('admin_id')
      .eq('id', user.id)
      .maybeSingle();
    
    return data?.admin_id;
  },

  // 2. إحصائيات الحجوزات 
  getReservationStats: async (adminId: string) => {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('status, payment_status, fees, session_date')
      .eq('admin_id', adminId);

    if (error) {
      console.error("Error in Stats:", error);
      return { total: 0, confirmed: 0, pending: 0, todayRevenue: 0 };
    }

    const total = sessions?.length || 0;
    const confirmed = sessions?.filter(s => s.status === 'مؤكدة' || s.status === 'confirmed').length || 0;
    const pending = sessions?.filter(s => s.status === 'قيد الانتظار' || s.status === 'scheduled' || s.status === 'unpaid').length || 0;
    
    const todayRevenue = sessions?.reduce((sum, s) => {
      if (s.payment_status === 'paid') {
        const fee = Number(s.fees);
        return sum + (isNaN(fee) ? 0 : fee);
      }
      return sum;
    }, 0) || 0;

    return { total, confirmed, pending, todayRevenue };
  },

  // 3. جلب كل الحجوزات
  getAllReservations: async (adminId: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`*, patient:patients(*), doctor:doctors(*)`)
      .eq('admin_id', adminId)
      .order('session_date', { ascending: false });

    if (error) return [];
    return data;
  },

  // 4. تأكيد الدفع
  confirmPaymentAndSession: async (sessionId: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .update({ payment_status: 'paid', status: 'مؤكدة' })
      .eq('id', sessionId)
      .select();

    if (error) throw error;
    return data;
  },

  // 🌟 5. الدالة المنقذة: حفظ وتعديل الجلسة (خاصة بالسكرتير)
  saveSession: async (sessionData: any, adminId: string) => {
    try {
      const sessionDate = new Date(`${sessionData.date}T${sessionData.time}:00`).toISOString();

      // الداتا الأساسية اللي مسموح تتبعت للداتا بيز
      const payload: any = {
        patient_id: sessionData.patientId,
        doctor_id: sessionData.doctorId,
        admin_id: adminId, // 🌟 مستحيل يبقى NULL تاني
        session_date: sessionDate,
        session_type: sessionData.session_type || 'كشف',
        mode: sessionData.mode || 'حضور بالعيادة',
      };

      if (sessionData.id) {
        // 🔄 وضع التعديل (Edit)
        // بنجيب الجلسة القديمة الأول عشان نحمي الفلوس لو كانت اتدفعت
        const { data: oldSession } = await supabase.from('sessions').select('*').eq('id', sessionData.id).single();
        
        if (oldSession && oldSession.payment_status !== 'paid') {
          payload.fees = sessionData.fees; // نحدث الفلوس بس لو لسه متدفعتش
        }

        const { error } = await supabase.from('sessions').update(payload).eq('id', sessionData.id);
        if (error) throw error;

      } else {
        // 🆕 وضع حجز جديد (Create)
        payload.fees = sessionData.fees;
        payload.status = 'قيد الانتظار';
        payload.payment_status = 'unpaid';
        payload.clinical_notes = {};

        const { error } = await supabase.from('sessions').insert([payload]);
        if (error) throw error;
      }
    } catch (error: any) {
      throw error;
    }
  }, // <--- دي الفاصلة اللي كانت ناقصة وعاملة الإيرور 🌟

  // 🌟 دالة تقفيل اليومية وإرسال التقرير
  closeDailyReport: async (adminId: string, date: string, revenue: number, sessionsCount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('غير مصرح لك بإجراء هذه العملية');

    const { error } = await supabase.from('daily_reports').insert([{
      admin_id: adminId,
      report_date: date,
      total_revenue: revenue,
      total_sessions: sessionsCount,
      closed_by: user.id
    }]);

    if (error) {
      // لو السكرتير داس تقفيل وهو متقفل قبل كده
      if (error.code === '23505') throw new Error('تم تقفيل يومية هذا التاريخ مسبقاً! 🔒');
      throw new Error(error.message);
    }
    
    return true;
  }

};