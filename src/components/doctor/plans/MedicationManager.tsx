import React, { useState, useEffect } from 'react';
import { Pill, Calendar, Trash2, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الـ Toasts
import { supabase } from '../../../services/supabase';

interface MedicationManagerProps {
  patientId: string;
}

export const MedicationManager: React.FC<MedicationManagerProps> = ({ patientId }) => {
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  
  const [activities, setActivities] = useState({ video: false, pdf: false, tasks: false });

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('medications').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
      if (error) throw error;
      setMeds(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchMedications();
  }, [patientId]);

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedActivities = [];
      if (activities.video) selectedActivities.push('video');
      if (activities.pdf) selectedActivities.push('pdf');
      if (activities.tasks) selectedActivities.push('tasks');

      const { error } = await supabase.from('medications').insert([{
        patient_id: patientId,
        med_name: medName.trim(),
        dosage: dosage.trim() || null,
        start_date: startDate,
        end_date: endDate || null,
        doctor_notes: doctorNotes.trim() || null,
        accompanying_activities: selectedActivities 
      }]);

      if (error) throw error;

      setMedName(''); setDosage(''); setEndDate(''); setDoctorNotes('');
      setActivities({ video: false, pdf: false, tasks: false });
      fetchMedications();
      
      toast.success('تم تدوين الوصفة الدوائية في السجل بنجاح.'); // 🌟 Toast
    } catch (err) {
      console.error(err);
      toast.error('تعذر حفظ الوصفة، يرجى التحقق من الاتصال.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeds = async (id: string) => {
    // 🌟 حذف مباشر مع إشعار احترافي
    try {
      await supabase.from('medications').delete().eq('id', id);
      setMeds(meds.filter(m => m.id !== id));
      toast.success('تم إيقاف الدواء وإزالته من السجل النشط.');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الإزالة.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <form onSubmit={handleAddMed} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#00838F] dark:text-cyan-400">
          <Plus size={20} /> تدوين وصفة طبية (روشتة سريرية)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">اسم العقار العلمي/التجاري</label>
            <div className="relative">
              <input type="text" required value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="مثال: Escitalopram 10mg" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
              <Pill size={18} className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الجرعة وآلية الاستخدام</label>
            <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="مثال: قرص واحد يومياً بعد الإفطار" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ بدء العلاج</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ إيقاف العلاج (اختياري)</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">محاذير وتوجيهات الطبيب</label>
            <div className="relative">
              <input type="text" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="مثال: يمنع الإيقاف المفاجئ للعقار لتجنب الأعراض الانسحابية..." className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
              <AlertCircle size={18} className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="mb-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">اقترانات دوائية سلوكية (اختياري)</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
              <input type="checkbox" checked={activities.video} onChange={(e) => setActivities({...activities, video: e.target.checked})} className="w-4 h-4 accent-[#00838F]" />
              محتوى مرئي داعم
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
              <input type="checkbox" checked={activities.pdf} onChange={(e) => setActivities({...activities, pdf: e.target.checked})} className="w-4 h-4 accent-[#00838F]" />
              نشرة تثقيفية مقروءة
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
              <input type="checkbox" checked={activities.tasks} onChange={(e) => setActivities({...activities, tasks: e.target.checked})} className="w-4 h-4 accent-[#00838F]" />
              تكليفات سلوكية مرافقة
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button type="submit" disabled={isSubmitting} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm disabled:opacity-50">
            {isSubmitting ? 'جاري التدوين...' : 'اعتماد وحفظ الوصفة الدوائية'}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
          <Pill size={20} className="text-[#00838F]" /> السجل الدوائي النشط
        </h3>

        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold">جاري تحميل السجلات الدوائية...</div>
        ) : meds.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
            السجل الدوائي فارغ. لا توجد عقاقير طبية موصوفة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meds.map(med => (
              <div key={med.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <button onClick={() => handleDeleteMeds(med.id)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="إيقاف العلاج وإزالته"><Trash2 size={18} /></button>
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-[#00838F] dark:text-cyan-400"><Pill size={22} /></div>
                  <div className="text-right flex-1">
                    <h4 className="font-black text-gray-900 dark:text-white text-base">{med.med_name}</h4>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">💊 الجرعة: {med.dosage || 'حسب التوجيهات السريرية'}</p>
                    
                    {med.accompanying_activities && med.accompanying_activities.length > 0 && (
                       <div className="flex gap-2 flex-wrap mt-2">
                         {med.accompanying_activities.includes('video') && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-100">فيديو مدعم</span>}
                         {med.accompanying_activities.includes('pdf') && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold border border-red-100">نشرة PDF</span>}
                         {med.accompanying_activities.includes('tasks') && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold border border-green-100">مهام سلوكية</span>}
                       </div>
                    )}

                    {med.doctor_notes && (
                      <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-2 rounded-lg border border-amber-100/30 font-bold mt-3 leading-relaxed">
                        ⚠️ {med.doctor_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};