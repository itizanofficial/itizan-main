import { supabase } from './supabase';

export const sessionAdminService = {
  getSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("يجب تسجيل الدخول");

    // 🌟 هنشيل فلتر الداتا بيز الصارم من هنا، لأننا بنفلتر في الفرونت إند
    // عشان نسمح بظهور الجلسات "المكتملة" و "الفائتة" في التاريخ
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

  // 🌟 خلينا الدالة تستقبل sessionData بس عشان متضربش مع شاشة الدكتور
  createSession: async (sessionData: any) => { 
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      // 🌟 هنجيب بيانات الدكتور من جوه الدالة أوتوماتيك
      const { data: doctorInfo } = await supabase.from('doctors').select('*').eq('id', user.id).single();
      if (!doctorInfo) throw new Error("بيانات الطبيب غير متوفرة");

      const sessionDate = new Date(`${sessionData.date}T${sessionData.time}:00`).toISOString();

      // 🌟 حساب التسعيرة ديناميكياً
      const fees = sessionData.type === 'كشف' 
        ? Number(doctorInfo.consultation_price || 0) 
        : Number(doctorInfo.followup_price || 0);

      const payload = {
        doctor_id: user.id,
        patient_id: sessionData.patientId,
        session_date: sessionDate,
        admin_id: doctorInfo.admin_id, // عشان السكرتير يشوفه
        session_type: sessionData.type,
        mode: sessionData.mode || 'حضور بالعيادة',
        fees: fees,
        status: 'قيد الانتظار', 
        payment_status: 'unpaid', 
        clinical_notes: {}
      };

      const { error } = await supabase.from('sessions').insert([payload]);
      if (error) throw new Error(error.message);

      const d = new Date(sessionDate);
      const dateStr = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      // تنبيه للمريض
      const { error: notifError } = await supabase.from('notifications').insert([{
        patient_id: sessionData.patientId,
        title: 'موعد جلسة جديد 📅',
        body: `تم حجز موعد مبدئي بتاريخ ${dateStr} الساعة ${timeStr}. يرجى تأكيد الحجز ودفع الرسوم في العيادة.`,
        type: 'session'
      }]);
      if (notifError) throw new Error(notifError.message);
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