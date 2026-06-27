import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, User, Activity, MapPin, Search } from 'lucide-react';
import { doctorService } from '../../../services/doctorService';
import { supabase } from '../../../services/supabase';

const calculateAge = (dobString: string) => {
  if (!dobString) return '---';
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) { age--; }
  return age;
};

export const AppointmentModal = ({ isOpen, onClose, onSave, editingData }: any) => {
  const [formData, setFormData] = useState({
    id: '', patientId: '', patientName: '', age: '', phone: '', date: '', time: '',
    type: '', // Diagnosis
    mode: 'حضور بالعيادة',
    session_type: 'كشف',
    rawStatus: 'scheduled',
    payment_status: 'unpaid'
  });

  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  
  // 🌟 حالات البحث
  const [searchQueryInput, setSearchQueryInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInvalid = !formData.patientId || !formData.date || !formData.time || !(formData.type || '').trim();

  useEffect(() => {
    const loadInitialData = async () => {
      if (!isOpen) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const list = await doctorService.getDoctorPatients(user.id);
          setMyPatients(list || []);
          const { data: docData } = await supabase.from('doctors').select('*').eq('id', user.id).single();
          setDoctorInfo(docData);
        }
      } catch (err) {
        console.error("Fetch data failed:", err);
      }
    };
    loadInitialData();
  }, [isOpen]);

  // قراءة الداتا في التعديل
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
          type: editingData.diagnosis || editingData.type || '',
          mode: editingData.mode || 'حضور بالعيادة',
          session_type: editingData.session_type || 'كشف',
          rawStatus: editingData.rawStatus || 'scheduled',
          payment_status: editingData.payment_status || 'unpaid'
        });
        setSearchQueryInput(editingData.patientName || '');
      } else {
        setFormData({ id: '', patientId: '', patientName: '', age: '', phone: '', date: '', time: '', type: '', mode: 'حضور بالعيادة', session_type: 'كشف', rawStatus: 'scheduled', payment_status: 'unpaid' });
        setSearchQueryInput('');
      }
    }
  }, [editingData, isOpen]);

  // إغلاق الدروب داون لو داس بره
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPatientsList = myPatients.filter((p: any) => 
    (p.name || p.full_name || '').toLowerCase().includes(searchQueryInput.toLowerCase())
  );

  const handlePatientSelect = (p: any) => {
    setFormData({
      ...formData,
      patientId: p.id,
      patientName: p.name || p.full_name,
      age: p.birth_date ? String(calculateAge(p.birth_date)) : '---',
      phone: p.phone || '---'
    });
    setSearchQueryInput(p.name || p.full_name);
    setIsDropdownOpen(false);
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    let fees = 0;
    if (doctorInfo) {
      fees = formData.session_type === 'كشف' ? Number(doctorInfo.consultation_price || 0) : Number(doctorInfo.followup_price || 0);
    }
    onSave({ ...formData, diagnosis: formData.type, admin_id: doctorInfo?.admin_id, fees: fees });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-visible border border-gray-100 dark:border-gray-800 font-sans flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center p-5 bg-[#00838F] text-white shrink-0 rounded-t-2xl">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Calendar size={20} /> {editingData ? 'تعديل بيانات الحجز' : 'حجز موعد جديد'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSaveClick} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          <div className="relative z-50" ref={dropdownRef}>
            <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">اسم المراجع</label>
            <div className="relative">
              <input
                type="text"
                required={!formData.patientId}
                disabled={!!editingData}
                placeholder="ابحث بالاسم عن المريض..."
                value={searchQueryInput}
                onChange={(e) => {
                  setSearchQueryInput(e.target.value);
                  setIsDropdownOpen(true);
                  if (e.target.value === '') setFormData({ ...formData, patientId: '', age: '', phone: '' });
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 pr-10 outline-none focus:border-[#00838F] text-sm font-bold disabled:bg-gray-50 disabled:text-gray-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

            {isDropdownOpen && !editingData && (
              <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[60] custom-scrollbar">
                {filteredPatientsList.length > 0 ? (
                  filteredPatientsList.map((p: any) => (
                    <div key={p.id} onClick={() => handlePatientSelect(p)} className="p-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700/50">
                      {p.name || p.full_name} <span className="text-xs text-gray-400 font-normal">({p.phone})</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center font-bold">لا يوجد مريض بهذا الاسم</div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">العمر</label>
              <input type="text" readOnly value={formData.age} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-500 cursor-not-allowed text-center font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">الموبايل</label>
              <input type="text" readOnly value={formData.phone} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-500 cursor-not-allowed text-center font-bold text-sm" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">تاريخ الجلسة</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none focus:border-[#00838F] text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">وقت الجلسة</label>
              <input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none focus:border-[#00838F] text-sm font-bold" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">مكان / طريقة الجلسة</label>
              <div className="relative">
                <select value={formData.mode} onChange={(e) => setFormData({ ...formData, mode: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none focus:border-[#00838F] font-bold text-sm appearance-none pr-8">
                  <option value="حضور بالعيادة">حضور بالعيادة</option>
                  <option value="فيديو">أونلاين (فيديو)</option>
                  <option value="صوتية">مكالمة هاتفية</option>
                </select>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">التشخيص المبدئي</label>
              <div className="relative">
                <input type="text" required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 pr-8 outline-none focus:border-[#00838F] text-sm font-bold" placeholder="مثال: جلسة CBT..." />
                <Activity className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          </div>

          <div className="border border-cyan-100 dark:border-gray-700 bg-cyan-50/30 dark:bg-gray-800/50 rounded-xl p-4 mt-2">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-[#00838F] dark:text-cyan-400">نوع الحجز</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                  <input type="radio" name="session_type" value="كشف" checked={formData.session_type === 'كشف'} onChange={e => setFormData({ ...formData, session_type: e.target.value })} className="accent-[#00838F] w-4 h-4" /> كشف جديد
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                  <input type="radio" name="session_type" value="إعادة" checked={formData.session_type === 'إعادة'} onChange={e => setFormData({ ...formData, session_type: e.target.value })} className="accent-[#00838F] w-4 h-4" /> إعادة / متابعة
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 py-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <span>$ سعر الكشف: {doctorInfo?.consultation_price || 0} ج.م</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>$ سعر الإعادة: {doctorInfo?.followup_price || 0} ج.م</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button type="submit" disabled={isInvalid} className="bg-[#56B5C2] hover:bg-[#4AA0AC] text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              حفظ الموعد
            </button>
            <button type="button" onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors px-4">إلغاء</button>
          </div>
        </form>

      </div>
    </div>
  );
};