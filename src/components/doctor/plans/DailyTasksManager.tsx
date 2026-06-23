import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus, RefreshCw, AlignRight, ListChecks, X, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الإشعارات الشيك
import { supabase } from '../../../services/supabase';

interface DailyTasksManagerProps {
  patientId: string;
}

export const DailyTasksManager: React.FC<DailyTasksManagerProps> = ({ patientId }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskInput, setTaskInput] = useState(''); 
  const [tasksList, setTasksList] = useState<string[]>([]); 
  const [doctorNotes, setDoctorNotes] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [repeatDays, setRepeatDays] = useState(1);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchTasks();
  }, [patientId]);

  const addSingleTaskToList = () => {
    if (taskInput.trim() !== '') {
      setTasksList([...tasksList, taskInput.trim()]);
      setTaskInput(''); 
    }
  };

  const removeTaskFromList = (indexToRemove: number) => {
    setTasksList(tasksList.filter((_, index) => index !== indexToRemove));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tasksList.length === 0) {
      toast.error('يرجى إدراج نشاط علاجي واحد على الأقل قبل الاعتماد.'); // 🌟 Toast شيك
      return;
    }

    setIsSubmitting(true);
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + (repeatDays - 1)); 
      const endDateStr = end.toISOString().split('T')[0];

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('daily_tasks').insert([{
        patient_id: patientId,
        doctor_id: user?.id, 
        task_title: 'خطة أنشطة متعددة', 
        tasks_list: tasksList, 
        doctor_notes: doctorNotes.trim() || null,
        start_date: startDate,
        end_date: endDateStr
      }]);

      if (error) throw error;

      setTasksList([]);
      setDoctorNotes('');
      setRepeatDays(1);
      fetchTasks();
      toast.success('تم اعتماد البرنامج السلوكي للمريض بنجاح.'); // 🌟 إشعار احترافي
    } catch (err: any) {
      console.error('Error adding task:', err);
      toast.error('تعذر مزامنة الخطة العلاجية، يرجى التحقق من الخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (taskId: string) => {
    // 🌟 استبدال نافذة المتصفح المزعجة برد فعل فوري و Toast
    try {
      await supabase.from('daily_tasks').delete().eq('id', taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('تم إيقاف وإزالة الخطة من سجل المريض.');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('حدث خطأ أثناء الحذف.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#00838F] dark:text-cyan-400">
          <ListChecks size={20} /> بناء البرنامج السلوكي والوظيفي
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          <div className="space-y-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">المهام / الأنشطة المجدولة</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSingleTaskToList(); } }}
                placeholder="مثال: جلسة استرخاء عضلي متدرج (PMR)" 
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold"
              />
              <button 
                type="button" 
                onClick={addSingleTaskToList}
                className="bg-[#00838F] hover:bg-[#006064] text-white px-4 rounded-xl transition-colors flex items-center justify-center"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 min-h-[40px]">
              {tasksList.length === 0 ? (
                <span className="text-xs text-gray-400 font-bold">لم يتم إدراج أي نشاط في المسودة الحالية...</span>
              ) : (
                tasksList.map((task, index) => (
                  <span key={index} className="flex items-center gap-1.5 bg-cyan-50 dark:bg-cyan-900/30 text-[#00838F] dark:text-cyan-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-cyan-100 dark:border-cyan-800">
                    {task}
                    <button onClick={() => removeTaskFromList(index)} className="hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ بدء البرنامج</label>
                <div className="relative">
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
                  <Calendar size={18} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">فترة المتابعة (أيام)</label>
                <div className="relative">
                  <input type="number" min="1" max="365" required value={repeatDays} onChange={(e) => setRepeatDays(parseInt(e.target.value) || 1)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
                  <RefreshCw size={18} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">إرشادات سريرية للمريض</label>
              <div className="relative">
                <input type="text" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="مثال: تُنفذ الأنشطة في بيئة خالية من المشتتات..." className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
                <AlignRight size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleSavePlan} 
            disabled={isSubmitting || tasksList.length === 0}
            className="bg-[#00838F] hover:bg-[#006064] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? 'جاري الاعتماد...' : 'تثبيت البرنامج العلاجي'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
          <Calendar size={20} className="text-[#00838F]" /> الأرشيف والبرامج الفعّالة
        </h3>

        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold">جاري تحميل السجلات...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
            السجل السلوكي فارغ. لم يتم إدراج برامج حالية لهذا المريض.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(plan => {
              const end = new Date(plan.end_date).getTime();
              const today = new Date().getTime();
              const isFinished = end < today - (24 * 60 * 60 * 1000); 

              const displayTasks = plan.tasks_list && plan.tasks_list.length > 0 ? plan.tasks_list : [plan.title];

              return (
                <div key={plan.id} className={`bg-white dark:bg-gray-800 rounded-3xl p-5 border shadow-sm relative transition-all ${isFinished ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-gray-100 dark:border-gray-700'}`}>
                  
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <ListChecks size={20} className="text-[#00838F]" /> قائمة المهام المعتمدة:
                    </h4>
                    <button onClick={() => handleDeletePlan(plan.id)} className="text-gray-300 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg" title="إلغاء الخطة">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-6 pl-2">
                    {displayTasks.map((t: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center border-2 border-[#00838F] bg-[#00838F]">
                          <CheckSquare size={14} className="text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">{t}</span>
                      </div>
                    ))}
                  </div>

                  {plan.doctor_notes ? (
                    <div className="bg-[#00838F] text-white p-3 rounded-xl text-center text-sm font-bold shadow-md">
                      إرشادات: {plan.doctor_notes}
                    </div>
                  ) : (
                    <div className="bg-[#00838F] text-white p-3 rounded-xl text-center text-sm font-bold shadow-md opacity-50 cursor-default">
                      لا توجد إرشادات سريرية إضافية
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-gray-400 mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> البداية: {new Date(plan.start_date).toLocaleDateString('ar-EG')}</span>
                    <span className="flex items-center gap-1"><RefreshCw size={12} /> النهاية: {new Date(plan.end_date).toLocaleDateString('ar-EG')}</span>
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