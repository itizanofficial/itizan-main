import { supabase } from './supabase';

export const sessionAdminService = {
  getSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("يجب تسجيل الدخول");

    const { data, error } = await supabase
      .from('sessions')
      .select(`*, patient:patients (id, name, dob, phone)`)
      .eq('doctor_id', user.id)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  getPatients: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.from('patients').select('id, name').eq('doctor_id', user.id);
    if (error) throw error;
    return data;
  },

  // دالة مساعدة لجلب بيانات الدكتور الحالي
  getDoctorData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('doctors').select('*').eq('id', user.id).single();
    return data;
  },

  // 🌟 الدالة الموحدة والذكية للحفظ والتعديل (تستقبل sessionData بالكامل)
  saveSession: async (sessionData: any) => { 
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { data: doctorInfo } = await supabase.from('doctors').select('*').eq('id', user.id).single();
      if (!doctorInfo) throw new Error("بيانات الطبيب غير متوفرة");

      const sessionDate = new Date(`${sessionData.date}T${sessionData.time}:00`).toISOString();

      // 🌟 تصحيح حساب التسعيرة بناءً على session_type الصحيح
      const fees = sessionData.session_type === 'كشف' 
        ? Number(doctorInfo.consultation_price || 0) 
        : Number(doctorInfo.followup_price || 0);

      // الباي لود الموحد للجدول
      const payload: any = {
        doctor_id: user.id,
        patient_id: sessionData.patientId,
        session_date: sessionDate,
        admin_id: doctorInfo.admin_id, 
        session_type: sessionData.session_type || 'كشف',
        mode: sessionData.mode || 'حضور بالعيادة',
        diagnosis: sessionData.type || sessionData.diagnosis || '' // ربط التشخيص المبدئي
      };

      if (sessionData.id) {
        // 🔄 وضع التعديل (Update)
        const { data: oldSession } = await supabase.from('sessions').select('*').eq('id', sessionData.id).single();
        
        // حماية الفلوس: تتحدث بس لو الجلسة لسه ملوش دفع مؤكد
        if (oldSession && oldSession.payment_status !== 'paid') {
          payload.fees = fees;
        }
        
        // الحفاظ على الحالة وحالة الدفع الحالية أثناء التعديل الزمني
        payload.status = sessionData.status || oldSession?.status || 'قيد الانتظار';
        payload.payment_status = sessionData.payment_status || oldSession?.payment_status || 'unpaid';

        const { error } = await supabase.from('sessions').update(payload).eq('id', sessionData.id);
        if (error) throw new Error(error.message);

        // إشعار التعديل للمريض
        await supabase.from('notifications').insert([{
          patient_id: sessionData.patientId,
          title: 'تعديل موعد الجلسة 🔄',
          body: `تم تعديل موعد جلستك ليكون يوم ${sessionData.date} الساعة ${sessionData.time}.`,
          type: 'session'
        }]);

      } else {
        // 🆕 وضع حجز جديد (Insert)
        payload.fees = fees;
        payload.status = 'قيد الانتظار'; 
        payload.payment_status = 'unpaid';
        payload.clinical_notes = {};

        const { error } = await supabase.from('sessions').insert([payload]);
        if (error) throw new Error(error.message);

        // تنبيه موعد جديد للمريض
        const d = new Date(sessionDate);
        const dateStr = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        await supabase.from('notifications').insert([{
          patient_id: sessionData.patientId,
          title: 'موعد جلسة جديد 📅',
          body: `تم حجز موعد مبدئي بتاريخ ${dateStr} الساعة ${timeStr}. يرجى تأكيد الحجز ودفع الرسوم في العيادة.`,
          type: 'session'
        }]);
      }
    } catch (err: any) { throw err; }
  },

  forceDeleteSession: async (sessionId: string) => {
    try {
      const { data, error } = await supabase.from('sessions').delete().eq('id', sessionId).select();
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error('لم يتم المسح بسبب صلاحيات الداتا بيز.');
    } catch (err: any) { throw err; }
  },

  markSessionAsMissed: async (sessionId: string, notes: string) => {
    try {
      const { data: sessionData, error: fetchError } = await supabase.from('sessions').select('patient_id').eq('id', sessionId).single();
      if (fetchError) throw new Error(fetchError.message);

      const { data: updatedData, error: updateError } = await supabase.from('sessions').update({ status: 'فائتة', clinical_notes: { patientNotes: notes } }).eq('id', sessionId).select();
      if (updateError) throw new Error(updateError.message);
      if (!updatedData || updatedData.length === 0) throw new Error('لم يتم التحديث بسبب صلاحيات الداتا بيز.');

      if (sessionData && notes.trim() !== '') {
        const { error: notifError } = await supabase.from('notifications').insert([{
          patient_id: sessionData.patient_id,
          title: 'تغيب عن موعد الجلسة ⚠️',
          body: notes,
          type: 'system'
        }]);
        if (notifError) throw new Error(notifError.message);
      }
    } catch (err: any) { throw err; }
  },

  saveClinicalNotes: async (sessionId: string, notes: any) => {
    try {
      const { error: sessionError } = await supabase.from('sessions').update({ clinical_notes: notes, status: 'مكتملة' }).eq('id', sessionId);
      if (sessionError) throw new Error(sessionError.message);

      if (notes.patientNotes && notes.patientNotes.trim() !== '') {
        const { data: sessionData } = await supabase.from('sessions').select('patient_id').eq('id', sessionId).single();
        if (sessionData) {
          await supabase.from('notifications').insert([{
            patient_id: sessionData.patient_id, title: 'التقرير الطبي والتعليمات', body: notes.patientNotes, type: 'system'
          }]);
        }
      }
    } catch (err: any) { throw err; }
  },

  sendReminder: async (patientId: string, date: string, time: string) => {
    try {
      const { error } = await supabase.from('notifications').insert([{
        patient_id: patientId, title: 'تذكير بموعد الجلسة', body: `نود تذكيركم بموعد الجلسة المؤكد بتاريخ ${date} في تمام الساعة ${time}.`, type: 'session'
      }]);
      if (error) throw new Error(error.message);
    } catch (err: any) { throw err; }
  }
};