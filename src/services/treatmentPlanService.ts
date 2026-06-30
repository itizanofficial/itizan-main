import { supabase } from './supabase';

export const treatmentPlanService = {
  
  async getCurrentDoctorId() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('يرجى تسجيل الدخول أولاً');
    return user.id;
  },

  // 1. جلب وبحث مرضى الطبيب الحالي
  async searchDoctorPatients(searchQuery: string = '') {
    try {
      const doctorId = await this.getCurrentDoctorId();
      let query = supabase.from('patients').select('*').eq('doctor_id', doctorId);

      if (searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("❌ إيرور في جلب مرضى الطبيب:", e);
      return [];
    }
  },

  // ==========================
  // 🌟 المهام اليومية (Daily Tasks)
  // ==========================
  async getDailyTasks(patientId: string) {
    const { data, error } = await supabase.from('daily_tasks').select('*').eq('patient_id', patientId).order('start_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createDailyPlan(patientId: string, planData: any) {
    try {
      const doctorId = await this.getCurrentDoctorId();
      
      const payload = {
        patient_id: patientId,
        doctor_id: doctorId,
        task_title: 'خطة أنشطة متعددة', 
        tasks_list: Array.isArray(planData.tasksList) ? planData.tasksList : [],
        completed_tasks: [], // 🌟 المهام المنجزة تبدأ فارغة
        doctor_notes: planData.doctorNotes || null,
        start_date: planData.startDate || new Date().toISOString().split('T')[0],
        end_date: planData.endDate ? planData.endDate : null
      };

      const { error } = await supabase.from('daily_tasks').insert([payload]);
      if (error) throw error;
    } catch (error: any) {
      console.error("❌ إيرور حفظ المهام اليومية:", error.message);
      throw error;
    }
  },

  async deleteDailyPlan(taskId: string) {
    const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  // ==========================
  // 🌟 سجلات النوم (Sleep Logs)
  // ==========================
  async getSleepLogs(patientId: string) {
    const { data, error } = await supabase.from('sleep_logs').select('*').eq('patient_id', patientId).order('log_date', { ascending: false }).limit(7);
    if (error) throw error;
    return data || [];
  },

  async saveSleepNote(patientId: string, noteText: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: existingLog } = await supabase.from('sleep_logs').select('id').eq('patient_id', patientId).eq('log_date', todayStr).maybeSingle();

    if (existingLog) {
      const { error } = await supabase.from('sleep_logs').update({ doctor_note: noteText }).eq('id', existingLog.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('sleep_logs').insert([{ patient_id: patientId, log_date: todayStr, doctor_note: noteText, hours_slept: 0 }]);
      if (error) throw error;
    }
  },

  // ==========================
  // 🌟 الأدوية والروشتات (Medications)
  // ==========================
  async getMedications(patientId: string) {
    const { data, error } = await supabase.from('medications').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createMedication(patientId: string, medData: any) {
    try {
      const payload = {
        patient_id: patientId,
        med_name: medData.medName,
        dosage: medData.dosage || null,
        start_date: medData.startDate || new Date().toISOString().split('T')[0],
        end_date: medData.endDate ? medData.endDate : null,
        is_taken: false, // 🌟 تصفير الدواء
        doctor_notes: medData.doctorNotes || null
      };

      const { error } = await supabase.from('medications').insert([payload]);
      if (error) throw error;
    } catch (error: any) {
      console.error("❌ إيرور حفظ الدواء:", error.message);
      throw error;
    }
  },

  async deleteMedication(id: string) {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================
  // 🌟 المحتوى التثقيفي (Patient Content)
  // ==========================
  async getPatientContent(patientId: string) {
    const { data, error } = await supabase.from('patient_content').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createPatientContent(patientId: string, contentData: any) {
    const payload = {
      patient_id: patientId,
      title: contentData.title,
      content_type: contentData.contentType,
      duration: contentData.duration || null,
      content_url: contentData.url
    };
    const { error } = await supabase.from('patient_content').insert([payload]);
    if (error) throw error;
  },

  async deletePatientContent(id: string) {
    const { error } = await supabase.from('patient_content').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================
  // 🌟 خطط العلاج الشهرية (Treatment Plans)
  // ==========================
  async getTreatmentPlans(patientId: string) {
    const { data, error } = await supabase.from('treatment_plans').select('*').eq('patient_id', patientId).order('start_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createTreatmentPlan(patientId: string, planData: any) {
    try {
      const doctorId = await this.getCurrentDoctorId();
      
      const payload = {
        patient_id: patientId,
        doctor_id: doctorId,
        plan_type: planData.planType || 'monthly',
        plan_title: planData.planTitle || 'خطة علاجية',
        steps_list: Array.isArray(planData.stepsList) ? planData.stepsList : [],
        // 🌟 التعديل السحري هنا: ضفنا completed_tasks عشان الدكتور يتابع تقدم الخطة الشهرية لايف زي المهام
        completed_tasks: [], 
        start_date: planData.startDate || new Date().toISOString().split('T')[0],
        end_date: planData.endDate ? planData.endDate : null,
        doctor_notes: planData.doctorNotes || null
      };

      const { error } = await supabase.from('treatment_plans').insert([payload]);
      if (error) throw error;
    } catch (error: any) {
      console.error("❌ إيرور حفظ خطة العلاج:", error.message);
      throw error;
    }
  },

  async deleteTreatmentPlan(id: string) {
    const { error } = await supabase.from('treatment_plans').delete().eq('id', id);
    if (error) throw error;
  }
};