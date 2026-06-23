import React, { useState, useEffect } from 'react';
import { Video, FileText, Link, Trash2, Plus, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الـ Toasts
import { supabase } from '../../../services/supabase';

interface ContentAssignerProps {
  patientId: string;
}

export const ContentAssigner: React.FC<ContentAssignerProps> = ({ patientId }) => {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('video');
  const [duration, setDuration] = useState('');
  const [url, setUrl] = useState('');

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_content')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchContent();
  }, [patientId]);

  const handleAssignContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('patient_content').insert([{
        patient_id: patientId,
        title: title.trim(),
        content_type: contentType,
        duration: duration.trim() || null,
        content_url: url.trim()
      }]);

      if (error) throw error;
      
      toast.success('تمت إضافة المادة العلاجية إلى حساب المريض بنجاح!'); // 🌟 Toast
      
      setTitle('');
      setDuration('');
      setUrl('');
      fetchContent();
    } catch (err) {
      console.error(err);
      toast.error('تعذر رفع المحتوى، يرجى مراجعة الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    // 🌟 استبدال window.confirm المزعجة بـ Toast ذكي واستجابة فورية
    try {
      await supabase.from('patient_content').delete().eq('id', id);
      setContents(contents.filter(c => c.id !== id));
      toast.success('تم إزالة المحتوى من سجل المريض.');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حذف الملف.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={handleAssignContent} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#00838F] dark:text-cyan-400">
          <Plus size={20} /> إدراج خطة علاجية (مرئية / مقروءة) للمريض
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">عنوان المادة (يظهر في تطبيق المريض)</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تمارين الاسترخاء العضلي العميق (CBT)" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نوع المحتوى العلاجي</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold cursor-pointer">
              <option value="video">📽️ جلسة مسجلة / مقطع فيديو تعليمي</option>
              <option value="pdf">📄 ملف قراءة / واجبات علاجية (PDF)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المدة التقديرية للإنجاز</label>
            <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="مثال: 15 دقيقة / 5 صفحات" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">رابط الاستضافة (URL)</label>
            <div className="relative">
              <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold left-0" />
              <Link size={18} className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button type="submit" disabled={isSubmitting} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm disabled:opacity-50">
            {isSubmitting ? 'جاري الرفع للشبكة...' : 'اعتماد ونشر المادة للمريض'}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
          <Video size={20} className="text-[#00838F]" /> الأرشيف العلاجي المتاح للمريض
        </h3>

        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold">جاري المزامنة مع قاعدة البيانات...</div>
        ) : contents.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
            السجل التثقيفي فارغ. لم يتم إسناد أي مواد علاجية لهذا المريض.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contents.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${item.content_type === 'video' ? 'bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'}`}>
                    {item.content_type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="text-right">
                    <h4 className="font-black text-sm text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 font-bold">⏱️ المدة: {item.duration || 'غير محددة'} | التصنيف: {item.content_type === 'video' ? 'محتوى مرئي' : 'محتوى مقروء'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-2">
                  <a href={item.content_url} target="_blank" rel="noreferrer" className="text-[#00838F] hover:bg-cyan-50 p-1.5 rounded-lg transition-colors" title="استعراض المادة">
                    <PlayCircle size={20} />
                  </a>
                  <button onClick={() => handleDeleteContent(item.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="إلغاء التخصيص">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};