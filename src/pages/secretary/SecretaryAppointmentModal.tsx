import React, { useState, useEffect } from 'react';
import { X, Calendar, User, UserCheck, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const SecretaryAppointmentModal = ({ isOpen, onClose, onSave, editingData, adminId }: any) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedDoctorData, setSelectedDoctorData] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: '', patientId: '', doctorId: '', date: '', time: '',
    session_type: 'كشف', mode: 'حضور بالعيادة',
    consultationPrice: '', followupPrice: ''
  });

  useEffect(() => {
    if (isOpen && adminId) {
      const fetchData = async () => {
        setLoadingData(true);
        const { data: docs } = await supabase.from('doctors').select('*').eq('admin_id', adminId);
        setDoctors(docs || []);

        const docIds = docs?.map(d => d.id) || [];
        if (docIds.length > 0) {
          const { data: pats } = await supabase.from('patients').select('*').in('doctor_id', docIds);
          setPatients(pats || []);
        }
        setLoadingData(false);
      };
      fetchData();
    }
  }, [isOpen, adminId]);

  // 🌟 هنا قراءة الداتا القديمة صح للتعديل
  useEffect(() => {
    if (isOpen && !loadingData) {
      if (editingData) {
        const doc = doctors.find(d => d.id === (editingData.doctor_id || editingData.doctorId));
        setSelectedDoctorData(doc || null);
        
        // استخراج التاريخ والوقت من session_date لو موجود
        let parsedDate = editingData.date;
        let parsedTime = editingData.time;
        if (editingData.session_date) {
            parsedDate = editingData.session_date.split('T')[0];
            parsedTime = new Date(editingData.session_date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        }

        setFormData({
          id: editingData.id,
          patientId: editingData.patient_id || editingData.patientId,
          doctorId: editingData.doctor_id || editingData.doctorId,
          date: parsedDate,
          time: parsedTime,
          session_type: editingData.session_type || 'كشف',
          mode: editingData.mode || 'حضور بالعيادة',
          consultationPrice: '', followupPrice: ''
        });
      } else {
        setFormData({ id: '', patientId: '', doctorId: '', date: '', time: '', session_type: 'كشف', mode: 'حضور بالعيادة', consultationPrice: '', followupPrice: '' });
        setSelectedDoctorData(null);
      }
    }
  }, [editingData, isOpen, doctors, loadingData]);

  const handlePatientSelect = (patId: string) => {
    const selectedPat = patients.find(p => p.id === patId);
    if (selectedPat) {
      const docId = selectedPat.doctor_id;
      const doc = doctors.find(d => d.id === docId);
      setSelectedDoctorData(doc || null);
      setFormData({ ...formData, patientId: patId, doctorId: docId });
    } else {
      setSelectedDoctorData(null);
      setFormData({ ...formData, patientId: '', doctorId: '' });
    }
  };

  const handleSaveClick = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalFees = 0;
    
    if (!selectedDoctorData?.consultation_price && formData.consultationPrice) {
      // حفظ التسعيرة لو أول مرة
      await supabase.from('doctors').update({
        consultation_price: Number(formData.consultationPrice),
        followup_price: Number(formData.followupPrice)
      }).eq('id', formData.doctorId);
      
      finalFees = formData.session_type === 'كشف' ? Number(formData.consultationPrice) : Number(formData.followupPrice);
    } else {
      // سحب التسعيرة المحفوظة
      finalFees = formData.session_type === 'كشف' ? Number(selectedDoctorData?.consultation_price || 0) : Number(selectedDoctorData?.followup_price || 0);
    }

    // 🌟 نبعت الداتا للأب (اللي هيكلم secretaryService.saveSession)
    onSave({ ...formData, fees: finalFees });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 font-sans">
        
        {/* الهيدر زي الديزاين */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#00838F] text-white">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Calendar size={20} /> {editingData ? 'تعديل موعد الجلسة' : 'حجز موعد جديد'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSaveClick} className="p-6 space-y-5">
          {loadingData ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00838F]" size={32} /></div>
          ) : (
            <>
              {/* الصف الأول */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">المريض</label>
                  <div className="relative">
                    <select required disabled={!!editingData} value={formData.patientId} onChange={(e) => handlePatientSelect(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#00838F] font-bold text-sm appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-500">
                      <option value="" disabled>-- اختر المريض --</option>
                      {patients.map((p) => <option key={p.id} value={p.id}>{p.name || p.full_name}</option>)}
                    </select>
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">الطبيب المعالج (يتم تحديده تلقائياً)</label>
                  <div className="relative">
                    <input type="text" disabled value={selectedDoctorData ? `د. ${selectedDoctorData.name || selectedDoctorData.full_name}` : ''} className="w-full bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-2.5 font-bold text-sm text-[#00838F] outline-none cursor-not-allowed" placeholder="اختر المريض أولاً" />
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00838F]" size={16} />
                  </div>
                </div>
              </div>

              {/* الصف الثاني */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ الجلسة</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#00838F] text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">وقت الجلسة</label>
                  <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#00838F] text-sm font-bold" />
                </div>
              </div>

              {/* مكان الجلسة */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">مكان / طريقة الجلسة</label>
                <div className="relative">
                  <select required value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#00838F] font-bold text-sm appearance-none">
                    <option value="حضور بالعيادة">حضور بالعيادة</option>
                    <option value="فيديو">أونلاين (فيديو)</option>
                    <option value="صوتية">مكالمة هاتفية</option>
                  </select>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              {/* بوكس نوع الحجز والأسعار */}
              {formData.doctorId && (
                <div className="border border-cyan-100 bg-cyan-50/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-[#00838F]">نوع الحجز</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700">
                        <input type="radio" name="session_type" value="كشف" checked={formData.session_type === 'كشف'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="accent-[#00838F] w-4 h-4" /> كشف جديد
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700">
                        <input type="radio" name="session_type" value="إعادة" checked={formData.session_type === 'إعادة'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="accent-[#00838F] w-4 h-4" /> إعادة / متابعة
                      </label>
                    </div>
                  </div>

                  {!selectedDoctorData?.consultation_price ? (
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-cyan-100">
                      <div>
                        <label className="block text-xs font-bold text-orange-600 mb-1">تسجيل سعر الكشف</label>
                        <input type="number" required value={formData.consultationPrice} onChange={e => setFormData({...formData, consultationPrice: e.target.value})} className="w-full border border-orange-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-orange-500 text-sm" placeholder="مثال: 500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-orange-600 mb-1">تسجيل سعر الإعادة</label>
                        <input type="number" required value={formData.followupPrice} onChange={e => setFormData({...formData, followupPrice: e.target.value})} className="w-full border border-orange-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-orange-500 text-sm" placeholder="مثال: 250" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-emerald-600 bg-white py-2.5 rounded-lg border border-emerald-100">
                      <span>$ سعر الكشف: {selectedDoctorData.consultation_price} ج.م</span>
                      <span className="text-gray-300">|</span>
                      <span>$ سعر الإعادة: {selectedDoctorData.followup_price} ج.م</span>
                    </div>
                  )}
                </div>
              )}

              {/* الأزرار */}
              <div className="flex items-center justify-between pt-2">
                <button type="submit" disabled={!formData.patientId || !formData.doctorId || !formData.date || !formData.time} className="bg-[#56B5C2] hover:bg-[#4AA0AC] text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
                  حفظ الموعد
                </button>
                <button type="button" onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors px-4">
                  إلغاء
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};