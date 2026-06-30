import React, { useState, useEffect } from 'react';
import { Activity, Plus, Trash2, Calendar, RefreshCw, X, CheckCircle2, GitCommit, AlignRight } from 'lucide-react';
import toast from 'react-hot-toast'; 
import { supabase } from '../../../services/supabase';

interface TreatmentTimelineProps {
  patientId: string;
}

export const TreatmentTimeline: React.FC<TreatmentTimelineProps> = ({ patientId }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [planType, setPlanType] = useState('monthly'); 
  const [planTitle, setPlanTitle] = useState(''); 
  const [stepInput, setStepInput] = useState('');
  const [stepsList, setStepsList] = useState<string[]>([]);
  
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [repeatCount, setRepeatCount] = useState(1);
  const [doctorNotes, setDoctorNotes] = useState(''); 

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 التعديل السحري: تفعيل الـ Realtime Listening هنا عشان يسمع عند الدكتور فوراً
  useEffect(() => {
    if (patientId) {
      fetchPlans();

      const subscription = supabase
        .channel(`realtime_treatment_plans_${patientId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'treatment_plans', 
          filter: `patient_id=eq.${patientId}` 
        }, () => {
          fetchPlans(); // إعادة جلب البيانات لايڤ في ثانية أول ما المريض يضغط في الموبايل
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [patientId]);

  const addStepToList = () => {
    if (stepInput.trim() !== '') {
      setStepsList([...stepsList, stepInput.trim()]);
      setStepInput('');
    }
  };

  const removeStepFromList = (indexToRemove: number) => {
    setStepsList(stepsList.filter((_, index) => index !== indexToRemove));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stepsList.length === 0) {
      toast.error('يرجى إدراج مرحلة علاجية واحدة على الأقل في الخطة.'); 
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
          toast.error("تاريخ البداية غير صالح.");
          setIsSubmitting(false);
          return;
      }

      const end = new Date(start);
      const daysToAdd = planType === 'monthly' ? (30 * repeatCount) : (7 * repeatCount);
      end.setDate(start.getDate() + daysToAdd);

      const endDateStr = end.toISOString().split('T')[0];

      const payload = {
        patient_id: patientId,
        doctor_id: user?.id,
        plan_type: planType,
        plan_title: planTitle.trim() || (planType === 'monthly' ? 'خطة علاجية شهرية' : 'خطة علاجية أسبوعية'),
        steps_list: stepsList,
        completed_tasks: [], // بيبدأ مصفوفة فاضية عشان الدوائر تطلع بيضاء
        start_date: startDate,
        end_date: endDateStr,
        doctor_notes: doctorNotes.trim() || null 
      };

      const { error } = await supabase.from('treatment_plans').insert([payload]);
      if (error) throw error;

      setPlanTitle('');
      setStepsList([]);
      setRepeatCount(1);
      setDoctorNotes(''); 
      fetchPlans();
      toast.success('تم اعتماد الخطة السريرية للمريض بنجاح.'); 
    } catch (err: any) {
      console.error(err);
      toast.error('تعذر حفظ الخطة، تأكد من صحة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await supabase.from('treatment_plans').delete().eq('id', id);
      setPlans(plans.filter(p => p.id !== id));
      toast.success('تم إيقاف الخطة العلاجية بنجاح.');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء محاولة الإلغاء.');
    }
  };

  const getExpectedEndDate = () => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return "تاريخ غير صالح";
    
    const daysToAdd = planType === 'monthly' ? (30 * repeatCount) : (7 * repeatCount);
    start.setDate(start.getDate() + daysToAdd);
    return start.toLocaleDateString('ar-EG');
  };

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans text-gray-900 dark:text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">الهندسة الزمنية للخطة</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">بناء وتقسيم البروتوكول العلاجي مرحلياً للمراجع.</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#00838F] dark:text-cyan-400">
          <GitCommit size={20} /> هندسة الخطة العلاجية (مرحلياً)
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الإطار الزمني للخطة</label>
                <select value={planType} onChange={(e) => setPlanType(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold cursor-pointer">
                  <option value="monthly">تقسيم شهري</option>
                  <option value="weekly">تقسيم أسبوعي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المسمى التعريفي للمرحلة</label>
                <input type="text" required value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder="مثال: الشهر التأسيسي الأول..." className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">أهداف الخطة (بالترتيب السريري)</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStepToList(); } }}
                  placeholder="مثال: التعرض التدريجي للمثيرات..." 
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold"
                />
                <button type="button" onClick={addStepToList} className="bg-[#00838F] hover:bg-[#006064] text-white px-4 rounded-xl transition-colors flex items-center justify-center">
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                {stepsList.length === 0 ? (
                  <span className="text-xs text-gray-400 font-bold">أدرج الخطوات لتظهر بشكل متسلسل للمريض...</span>
                ) : (
                  stepsList.map((step, index) => (
                    <div key={index} className="flex items-center justify-between bg-cyan-50 dark:bg-cyan-900/30 text-[#00838F] dark:text-cyan-400 px-3 py-2 rounded-lg text-sm font-bold border border-cyan-100 dark:border-cyan-800">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#00838F] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                        {step}
                      </div>
                      <button onClick={() => removeStepFromList(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ الاعتماد</label>
              <div className="relative">
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold cursor-pointer" />
                <Calendar size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                دورة التكرار ({planType === 'monthly' ? 'عدد الأشهر' : 'عدد الأسابيع'})
              </label>
              <div className="relative">
                <input type="number" min="1" max="24" required value={repeatCount} onChange={(e) => setRepeatCount(parseInt(e.target.value) || 1)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
                <RefreshCw size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 font-bold mt-2">
                التقييم المستهدف سيكون في: {getExpectedEndDate()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ملاحظات سريرية (تظهر للمريض)</label>
              <div className="relative">
                <input type="text" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="مثال: يُنصح بالانتقال بين المراحل تدريجياً لضمان الاستجابة..." className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
                <AlignRight size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleSavePlan} disabled={isSubmitting || stepsList.length === 0} className="bg-[#00838F] hover:bg-[#006064] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
            {isSubmitting ? 'جاري الاعتماد...' : 'تأكيد الخطة وإرسال الإشعار'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
          <Activity size={20} className="text-[#00838F]" /> المسار العلاجي المعتمد (كما يظهر للمراجع)
        </h3>

        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold">جاري المزامنة...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
            لم يتم تفعيل أي بروتوكول علاجي زمني لهذا المريض حتى الآن.
          </div>
        ) : (
          <div className="space-y-6">
            {plans.map(plan => {
              const steps = plan.steps_list || [];
              const isMonthly = plan.plan_type === 'monthly';

              return (
                <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700/50 pb-4">
                    <div>
                      <h4 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                        {plan.plan_title}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isMonthly ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {isMonthly ? 'بروتوكول شهري' : 'بروتوكول أسبوعي'}
                        </span>
                      </h4>
                      <div className="flex gap-4 text-xs font-bold text-gray-400 mt-2">
                        <span> بداية التطبيق: {new Date(plan.start_date).toLocaleDateString('ar-EG')}</span>
                        <span> موعد التقييم: {new Date(plan.end_date).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeletePlan(plan.id)} className="text-red-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {plan.doctor_notes && (
                    <div className="mb-6 bg-cyan-50 dark:bg-cyan-950/20 p-3 rounded-xl border border-cyan-100 dark:border-cyan-900/50 text-sm font-bold text-[#00838F] dark:text-cyan-400">
                      📝 إرشادات سريرية: {plan.doctor_notes}
                    </div>
                  )}

                  <div className="flex items-start w-full overflow-x-auto custom-scrollbar pb-4 pt-2 px-2">
                    {steps.map((step: string, idx: number) => {
                      const isStepDone = plan.completed_tasks && plan.completed_tasks.some((t: string) => t.startsWith(step + '|'));
                      
                      return (
                        <React.Fragment key={idx}>
                          <div className="flex flex-col items-center min-w-[80px] group relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold z-10 border-2 transition-all duration-300 ${
                              isStepDone 
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30' 
                                : 'bg-white dark:bg-gray-800 text-[#00838F] dark:text-cyan-400 border-[#00838F] dark:border-cyan-400'
                            }`}>
                              {isStepDone ? <CheckCircle2 size={18} /> : <span>{idx + 1}</span>}
                            </div>
                            <span className={`text-xs font-bold text-center mt-3 max-w-[100px] leading-tight ${
                              isStepDone ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-70' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {step}
                            </span>
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`flex-1 h-1 mt-3.5 -mx-2 z-0 min-w-[40px] transition-colors ${
                              isStepDone ? 'bg-emerald-500/50' : 'bg-gray-200 dark:bg-gray-700'
                            }`}></div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};