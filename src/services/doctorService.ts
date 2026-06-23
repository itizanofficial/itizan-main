import { supabase } from './supabase';

export const doctorService = {
  
  // 1. لوجيك الداشبورد الرئيسية (الإحصائيات)
  getDashboardMetrics: async (doctorId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('patient_id, session_date, status') 
      .eq('doctor_id', doctorId);

    if (error) throw error;

    const activePatients = new Set(sessions?.map(s => s.patient_id)).size;
    const todaySessions = sessions?.filter(s => s.session_date && s.session_date.startsWith(today)).length || 0;
    const upcomingAppointments = sessions?.filter(s => s.status === 'scheduled' && s.session_date >= today).length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed' || s.status === 'confirmed' || s.status === 'مؤكدة').length || 0;

    return { activePatients, todaySessions, upcomingAppointments, completedSessions };
  },

  // 2. لوجيك صفحة الحجوزات (المواعيد)
  getAppointments: async (doctorId: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        status,
        session_type,
        diagnosis,
        patient:patients (id, name, dob, phone) 
      `) 
      .eq('doctor_id', doctorId)
      .order('session_date', { ascending: true }); 

    if (error) throw error;
    return data;
  },

  // 3. لوجيك إدارة الجلسة (تغيير الحالة)
  updateSessionStatus: async (sessionId: string, newStatus: 'scheduled' | 'completed' | 'cancelled' | 'confirmed') => {
    const { data, error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 4. إرسال إشعار للمريض
  sendPatientNotification: async (patientId: string, title: string, body: string, type: 'session' | 'system' = 'session') => {
    const { error } = await supabase.from('notifications').insert([{
      patient_id: patientId,
      title: title,
      body: body,
      type: type
    }]);
    if (error) throw error;
  },

  // 5. لوجيك كتابة الروشتة أو الملاحظات
  saveSessionNotes: async (sessionId: string, notes: string, recommendations: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .update({ 
        doctor_notes: notes, 
        status: 'completed'
      })
      .eq('id', sessionId);

    if (error) throw error;
    return data;
  },

  // 6. لوجيك إضافة مهمة يومية للمريض
  addPatientTask: async (patientId: string, doctorId: string, title: string, description: string) => {
    const { data, error } = await supabase
      .from('daily_tasks')
      .insert([{
        doctor_id: doctorId, patient_id: patientId, task_title: title, tasks_list: [description]
      }]);

    if (error) throw error;
    return data;
  },

  // 7. جلب مرضى الدكتور
  getDoctorPatients: async (doctorId: string) => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('doctor_id', doctorId); 

    if (error) throw error;
    return data;
  }
};