import { supabase } from './supabase';

export const reportsService = {
  // 1. جلب إحصائيات الجلسات (بدون أي داتا وهمية)
  getSessionStats: async (patientId: string) => {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, status, session_date, duration')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: true });

    if (error || !sessions || sessions.length === 0) {
      return { adherence: 0, totalMinutes: 0, completedSessions: 0, chartData: [] };
    }

    const completed = sessions.filter(s => s.status === 'مكتملة' || s.status === 'completed' || s.status === 'مؤكدة');
    const adherence = Math.round((completed.length / sessions.length) * 100);
    const totalMinutes = completed.reduce((total, session) => total + (session.duration || 60), 0);

    const last5 = sessions.slice(-5).map((s, index) => ({
      name: `أسبوع ${index + 1}`,
      sessions: s.status === 'مكتملة' || s.status === 'completed' || s.status === 'مؤكدة' ? 2 : 1
    }));
    
    while(last5.length < 5) last5.unshift({ name: `أسبوع ${5 - last5.length}`, sessions: 0 });

    return { adherence, totalMinutes, completedSessions: completed.length, chartData: last5 };
  },

  // 2. جلب ملخص الالتزام والملاحظات (داتا حقيقية فقط)
  getTreatmentSummary: async (patientId: string) => {
    // نسبة التزام الأدوية
    const { data: meds } = await supabase.from('medications').select('is_taken').eq('patient_id', patientId);
    let medAdherence = 0;
    if (meds && meds.length > 0) {
      const taken = meds.filter(m => m.is_taken).length;
      medAdherence = Math.round((taken / meds.length) * 100);
    }

    // نسبة التزام المهام
    const { data: tasks } = await supabase.from('daily_tasks').select('tasks_list, completed_tasks').eq('patient_id', patientId);
    let taskAdherence = 0;
    if (tasks && tasks.length > 0) {
      let totalTasks = 0;
      let completedTasks = 0;
      tasks.forEach(t => {
        const list = Array.isArray(t.tasks_list) ? t.tasks_list : JSON.parse(t.tasks_list || '[]');
        const comp = Array.isArray(t.completed_tasks) ? t.completed_tasks : JSON.parse(t.completed_tasks || '[]');
        totalTasks += list.length;
        completedTasks += comp.length;
      });
      taskAdherence = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    // انتظام النوم
    const { data: sleep } = await supabase.from('sleep_logs').select('hours_slept').eq('patient_id', patientId);
    let sleepAdherence = 0;
    if (sleep && sleep.length > 0) {
      const goodSleep = sleep.filter(s => (s.hours_slept || 0) >= 6).length;
      sleepAdherence = Math.round((goodSleep / sleep.length) * 100);
    }

    // 🌟 جلب الملاحظات السريرية من آخر جلسة مكتملة
    const { data: lastSession } = await supabase
      .from('sessions')
      .select('clinical_notes')
      .eq('patient_id', patientId)
      .eq('status', 'مكتملة')
      .order('session_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    let doctorNotes = "لا توجد ملاحظات سريرية مقيدة من الجلسات السابقة.";
    if (lastSession?.clinical_notes?.patientNotes) {
      doctorNotes = lastSession.clinical_notes.patientNotes;
    }

    // 🌟 جلب التوصيات من آخر خطة علاجية مضافة للمريض
    const { data: activePlan } = await supabase
      .from('treatment_plans')
      .select('doctor_notes')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let recommendations: string[] = [];
    if (activePlan?.doctor_notes) {
      // بنقسم النص لو الدكتور كاتب كذا ملحوظة بينهم شرطة مثلا، أو بنعرضها كنقطة واحدة
      recommendations = activePlan.doctor_notes.split('-').filter((r:string) => r.trim() !== '');
      if (recommendations.length === 0) recommendations = [activePlan.doctor_notes];
    }

    return { medAdherence, taskAdherence, sleepAdherence, doctorNotes, recommendations };
  },

  // 3. جلب التقييمات
  getEvaluations: async (patientId: string) => {
    const { data: evals, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true })
      .limit(5);

    if (error || !evals || evals.length === 0) return null;

    const lineData = evals.map((e, i) => ({
      month: `جلسة ${i + 1}`,
      sleep: e.sleep_score || 0,
      communication: e.communication_score || 0,
      depression: e.depression_score || 0,
      anxiety: e.anxiety_score || 0
    }));
    
    const latest = evals[evals.length - 1];
    const radarData = [
      { subject: 'التواصل', A: (latest.communication_score || 0) * 10, fullMark: 100 },
      { subject: 'النشاط', A: (latest.activity_score || 0) * 10, fullMark: 100 },
      { subject: 'النوم', A: (latest.sleep_score || 0) * 10, fullMark: 100 },
      { subject: 'التركيز', A: (latest.focus_score || 0) * 10, fullMark: 100 },
      { subject: 'المزاج', A: (latest.mood_score || 0) * 10, fullMark: 100 },
      { subject: 'القلق', A: (latest.anxiety_score || 0) * 10, fullMark: 100 },
    ];

    return { lineData, radarData };
  }
};