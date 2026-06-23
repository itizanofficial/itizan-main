import React, { useState, useEffect } from 'react';
import { Moon, Calendar, MessageSquare, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الإشعارات الشيك
import { supabase } from '../../../services/supabase';

interface SleepManagerProps {
  patientId: string;
}

export const SleepManager: React.FC<SleepManagerProps> = ({ patientId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchSleepLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('log_date', { ascending: false })
        .limit(7); 

      if (error) throw error;
      setLogs(data || []);
      
      if (data && data.length > 0) {
        setNoteText(data[0].doctor_note || '');
      } else {
        setNoteText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchSleepLogs();
  }, [patientId]);

  const handleSaveSleepNote = async () => {
    setIsSavingNote(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const { data: existingLog } = await supabase
        .from('sleep_logs')
        .select('id')
        .eq('patient_id', patientId)
        .eq('log_date', todayStr)
        .maybeSingle();

      if (existingLog) {
        await supabase
          .from('sleep_logs')
          .update({ doctor_note: noteText.trim() })
          .eq('id', existingLog.id);
      } else {
        await supabase
          .from('sleep_logs')
          .insert([{ patient_id: patientId, log_date: todayStr, doctor_note: noteText.trim(), hours_slept: 0 }]);
      }

      toast.success('تم تحديث التوجيهات السريرية للنوم بنجاح.'); // 🌟 Toast احترافي
      fetchSleepLogs();
    } catch (err) {
      console.error(err);
      toast.error('تعذر حفظ التوجيهات، يرجى التحقق من الخادم.');
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* توجيهات وملاحظات الدكتور المخصصة */}
        <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold mb-3 flex items-center gap-2 text-[#00838F] dark:text-cyan-400">
              <MessageSquare size={18} /> توجيهات طب النوم السلوكي
            </h3>
            <p className="text-xs text-gray-400 font-bold mb-4">هذه الإرشادات ستظهر للمراجع مباشرة داخل واجهة التتبع في تطبيقه الشخصي.</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="مثال: يُنصح بتجنب المنبهات (الكافيين) بعد الساعة 4 مساءً، وتثبيت مواعيد الاستيقاظ لضبط الإيقاع اليومي (Circadian Rhythm)..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:border-[#00838F] text-sm font-bold h-44 resize-none"
            />
          </div>
          <button
            onClick={handleSaveSleepNote}
            disabled={isSavingNote}
            className="w-full mt-4 bg-[#00838F] hover:bg-[#006064] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
          >
            {isSavingNote ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            اعتماد التوجيهات
          </button>
        </div>

        {/* جدول تتبع نوم المريض لآخر 7 أيام */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-md font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <Moon size={18} className="text-[#00838F]" /> المؤشرات الحيوية للنوم (آخر 7 أيام)
          </h3>
          
          {loading ? (
            <div className="text-center py-10 text-gray-500 font-bold">جاري المزامنة مع بيانات المريض...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
              لم يقم المريض بتسجيل أي قراءات لساعات النوم خلال هذا الأسبوع.
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
                  <tr>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4 text-center">ساعات النوم المسجلة</th>
                    <th className="p-4">التقييم السريري</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 border-gray-50 dark:border-gray-800/50">
                      <td className="p-4 flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(log.log_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </td>
                      <td className="p-4 text-center font-black text-gray-900 dark:text-white">
                        {log.hours_slept > 0 ? `${log.hours_slept} ساعات` : 'قراءة مفقودة'}
                      </td>
                      <td className="p-4">
                        {log.hours_slept >= 7 && log.hours_slept <= 9 ? (
                          <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md text-xs">معدل نوم صحي</span>
                        ) : log.hours_slept > 0 ? (
                          <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md text-xs">اضطراب في المعدل</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};