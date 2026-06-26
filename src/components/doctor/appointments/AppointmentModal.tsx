import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Activity, Video, Loader2, MapPin } from 'lucide-react';
import { doctorService } from '../../../services/doctorService';
import { supabase } from '../../../services/supabase';

const calculateAge = (dobString: string) => {
  if (!dobString) return '---';
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const AppointmentModal = ({ isOpen, onClose, onSave, editingData }: any) => {
  const [formData, setFormData] = useState({
    id: '', patientId: '', patientName: '', age: '', phone: '', date: '', time: '',
    type: '', // التشخيص
    mode: 'حضور بالعيادة',
    session_type: 'كشف',
    rawStatus: 'scheduled',
    payment_status: 'unpaid'
  });

  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // 🌟 الحل الجذري للإيرور: متغير آمن للفحص
  const isInvalid = !formData.patientId || !formData.date || !formData.time || !(formData.type || '').trim();

  useEffect(() => {
    const loadInitialData = async () => {
      if (!isOpen) return;
      try {
        setLoadingPatients(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const list = await doctorService.getDoctorPatients(user.id);
          setMyPatients(list || []);
          const { data: docData } = await supabase.from('doctors').select('*').eq('id', user.id).single();
          setDoctorInfo(docData);
        }
      } catch (err) {
        console.error("Fetch data failed:", err);
      } finally {
        setLoadingPatients(false);
      }
    };
    loadInitialData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setFormData({
          id: editingData.id || '',
          patientId: editingData.patientId || '',
          patientName: editingData.patientName || '',
          age: editingData.age || '',
          phone: editingData.phone || '',
          date: editingData.date || '',
          time: editingData.time || '',
          type: editingData.diagnosis || editingData.type || '', // ربط التشخيص
          mode: editingData.mode || 'حضور بالعيادة',
          session_type: editingData.session_type || 'كشف',
          rawStatus: editingData.rawStatus || 'scheduled',
          payment_status: editingData.payment_status || 'unpaid'
        });
      } else {
        // إعادة تعيين للفورم عند الحجز الجديد
        setFormData({
          id: '', patientId: '', patientName: '', age: '', phone: '', date: '', time: '',
          type: '', mode: 'حضور بالعيادة', session_type: 'كشف', rawStatus: 'scheduled', payment_status: 'unpaid'
        });
      }
    }
  }, [editingData, isOpen]);

  const handlePatientSelect = (patientId: string) => {
    const selected = myPatients.find(p => p.id === patientId);
    if (selected) {
      setFormData({
        ...formData,
        patientId: selected.id,
        patientName: selected.name || selected.full_name,
        age: selected.birth_date ? String(calculateAge(selected.birth_date)) : '---',
        phone: selected.phone || '---'
      });
    }
  };

  const handleSaveClick = () => {
    let fees = 0;
    if (doctorInfo) {
      fees = formData.session_type === 'كشف'
        ? Number(doctorInfo.consultation_price || 0)
        : Number(doctorInfo.followup_price || 0);
    }

    onSave({
      ...formData,
      diagnosis: formData.type, // بنبعت الـ type كـ diagnosis للـ parent
      admin_id: doctorInfo?.admin_id,
      fees: fees
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 font-sans">

        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-[#00838F] text-white">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Calendar size={20} /> {editingData ? 'تعديل بيانات الحجز' : 'حجز موعد جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">اسم المراجع</label>
              <div className="relative">
                <select value={formData.patientId} onChange={(e) => handlePatientSelect(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] font-bold text-sm cursor-pointer" disabled={!!editingData}>
                  <option value="" disabled>-- اختر المراجع --</option>
                  {myPatients.map((p) => (<option key={p.id} value={p.id}>{p.name || p.full_name}</option>))}
                </select>
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/3"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">العمر</label><input type="text" readOnly value={formData.age} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed text-center font-bold" /></div>
              <div className="flex-1"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الموبايل</label><input type="text" readOnly value={formData.phone} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed text-center font-bold" dir="ltr" /></div>
            </div>

            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ الجلسة</label><div className="relative"><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] text-sm font-bold" /><Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00838F]" size={18} /></div></div>
            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">وقت الجلسة</label><div className="relative"><input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] text-sm font-bold" /><Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00838F]" size={18} /></div></div>
            
            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">مكان / طريقة الجلسة</label><div className="relative"><select value={formData.mode} onChange={(e) => setFormData({ ...formData, mode: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] font-bold text-sm"><option value="حضور بالعيادة">حضور بالعيادة</option><option value="فيديو">أونلاين (فيديو)</option><option value="صوتية">مكالمة هاتفية</option></select><MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /></div></div>
            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">التشخيص المبدئي</label><div className="relative"><input type="text" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] text-sm font-bold" placeholder="مثال: جلسة CBT..." /><Activity className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /></div></div>

            <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-bold text-[#00838F] mb-3">نوع الحجز</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700"><input type="radio" name="session_type" value="كشف" checked={formData.session_type === 'كشف'} onChange={e => setFormData({ ...formData, session_type: e.target.value })} className="text-[#00838F]" /> كشف جديد</label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700"><input type="radio" name="session_type" value="إعادة" checked={formData.session_type === 'إعادة'} onChange={e => setFormData({ ...formData, session_type: e.target.value })} className="text-[#00838F]" /> إعادة / متابعة</label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">إلغاء</button>
            <button onClick={handleSaveClick} disabled={isInvalid} className={`px-8 py-2.5 rounded-xl font-black text-white bg-[#00838F] hover:bg-[#006064] transition-colors shadow-md ${isInvalid ? 'opacity-50 cursor-not-allowed' : ''}`}>حفظ الموعد</button>
          </div>
        </div>

      </div>
    </div>
  );
};