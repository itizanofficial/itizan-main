import { supabase } from './supabase';

export const doctorService = {
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

  getAppointments: async (doctorId: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`id, session_date, status, session_type, diagnosis, mode, payment_status, patient:patients (id, name, dob, phone)`) 
      .eq('doctor_id', doctorId)
      .order('session_date', { ascending: true }); 

    if (error) throw error;
    return data;
  },

  updateSessionStatus: async (sessionId: string, newStatus: 'scheduled' | 'completed' | 'cancelled' | 'confirmed') => {
    const { data, error } = await supabase.from('sessions').update({ status: newStatus }).eq('id', sessionId).select().single();
    if (error) throw error;
    return data;
  },

  sendPatientNotification: async (patientId: string, title: string, body: string, type: 'session' | 'system' = 'session') => {
    const { error } = await supabase.from('notifications').insert([{ patient_id: patientId, title, body, type }]);
    if (error) throw error;
  },

  addPatientTask: async (patientId: string, doctorId: string, title: string, description: string) => {
    const { data, error } = await supabase.from('daily_tasks').insert([{ doctor_id: doctorId, patient_id: patientId, task_title: title, tasks_list: [description] }]);
    if (error) throw error;
    return data;
  },

  getDoctorPatients: async (doctorId: string) => {
    const { data, error } = await supabase.from('patients').select('*').eq('doctor_id', doctorId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  updatePatientDiagnosis: async (patientId: string, diagnosis: string) => {
    const { data, error } = await supabase.from('patients').update({ diagnosis: diagnosis }).eq('id', patientId);
    if (error) throw error;
    return data;
  },

  getCurrentDoctorCode: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: doctor, error } = await supabase.from('doctors').select('doctor_code').eq('id', user.id).maybeSingle();
    if (error) throw error;

    if (doctor && doctor.doctor_code) return doctor.doctor_code;

    const newCode = user.id.slice(0, 8).toUpperCase();
    const { error: upsertError } = await supabase.from('doctors').upsert({ id: user.id, doctor_code: newCode });
    if (upsertError) throw upsertError;

    return newCode;
  }
};