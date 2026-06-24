import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Activity, Video, Loader2 } from 'lucide-react';
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
    id: '',
    patientId: '',
    patientName: '', 
    age: '', 
    phone: '', 
    date: '', 
    time: '', 
    type: '', 
    mode: 'حضور بالعيادة',
    rawStatus: 'scheduled'
  });

  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    const loadDoctorPatients = async () => {
      if (!isOpen) return;
      try {
        setLoadingPatients(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const list = await doctorService.getDoctorPatients(user.id);
          setMyPatients(list || []);
        }
      } catch (err) {
        console.error("Fetch patients failed:", err);
      } finally {
        setLoadingPatients(false);
      }
    };
    loadDoctorPatients();
  }, [isOpen]);

  useEffect(() => {
    if (editingData) {
      setFormData(editingData);
    } else {
      setFormData({ 
        id: '', patientId: '', patientName: '', age: '', phone: '', date: '', time: '', 
        type: '', 
        mode: 'حضور بالعيادة', rawStatus: 'scheduled'
      });
    }
  }, [editingData, isOpen]);

  const handlePatientSelect = (patientId: string) => {
    const selected = myPatients.find(p => p.id === patientId);
    if (selected) {
      setFormData({
        ...formData,
        patientId: selected.id,
        patientName: selected.name,
        age: selected.birth_date ? String(calculateAge(selected.birth_date)) : '---', 
        phone: selected.phone || '---'
      });
    } else {
      setFormData({ ...formData, patientId: '', patientName: '', age: '', phone: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-[#00838F]" /> {editingData ? 'تعديل بيانات الحجز' : 'حجز موعد جديد'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body (Form) */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">اسم المراجع</label>
              <div className="relative">
                {loadingPatients ? (
                  <div className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-400 flex items-center gap-2 text-xs font-bold">
                    <Loader2 size={14} className="animate-spin text-[#00838F]" /> جاري تحميل المرضى...
                  </div>
                ) : (
                  <select value={formData.patientId} onChange={(e) => handlePatientSelect(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] dark:text-white appearance-none font-bold text-sm cursor-pointer" disabled={!!editingData}>
                    <option value="">-- اختر المراجع من القائمة --</option>
                    {myPatients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <div className="flex gap-4">
               <div className="w-1/3">
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">العمر</label>
                 <input type="text" readOnly value={formData.age} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none text-gray-500 cursor-not-allowed text-center font-bold" />
               </div>
               <div className="flex-1">
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">رقم الموبايل</label>
                 <input type="text" readOnly value={formData.phone} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none text-gray-500 cursor-not-allowed text-center font-bold" dir="ltr" />
               </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ الجلسة</label>
              <div className="relative">
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] dark:text-white text-sm font-bold cursor-pointer" />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00838F]" size={18} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">وقت الجلسة</label>
              <div className="relative">
                <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] dark:text-white text-sm font-bold cursor-pointer" />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00838F]" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نوع الجلسة (المكان)</label>
              <div className="relative">
                <select value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] dark:text-white appearance-none font-bold text-sm cursor-pointer">
                  <option value="حضور بالعيادة">حضور بالعيادة</option>
                  <option value="فيديو">أونلاين (فيديو)</option>
                  <option value="صوتية">مكالمة هاتفية</option>
                </select>
                <Video className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نوع الكشف / التشخيص المبدئي</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] dark:text-white text-sm font-bold" 
                  placeholder="مثال: جلسة متابعة، كشف جديد، CBT..." 
                />
                <Activity className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-end">
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">إلغاء</button>
            <button 
              onClick={() => { onSave(formData); onClose(); }} 
              disabled={!formData.patientId || !formData.date || !formData.time || !formData.type.trim()}
              className={`px-8 py-2.5 rounded-xl font-black text-white bg-[#00838F] hover:bg-[#006064] transition-colors shadow-md ${(!formData.patientId || !formData.date || !formData.time || !formData.type.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              حفظ الموعد
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};