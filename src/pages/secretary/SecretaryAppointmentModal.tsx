import React, { useState, useEffect } from 'react';
import { X, Calendar, User, UserCheck, Loader2, MapPin, DollarSign } from 'lucide-react';
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
        // بنجيب الدكاترة عشان ناخد أسمائهم وتسعيرتهم
        const { data: docs } = await supabase.from('doctors').select('*').eq('admin_id', adminId);
        setDoctors(docs || []);

        // بنجيب المرضى بتوع دكاترة المركز ده
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

  useEffect(() => {
    if (editingData) {
      const doc = doctors.find(d => d.id === editingData.doctorId);
      setSelectedDoctorData(doc || null);
      setFormData({
        id: editingData.id,
        patientId: editingData.patientId,
        doctorId: editingData.doctorId,
        date: editingData.date,
        time: editingData.time,
        session_type: editingData.session_type || 'كشف',
        mode: editingData.mode || 'حضور بالعيادة',
        consultationPrice: '', followupPrice: ''
      });
    } else {
      setFormData({ id: '', patientId: '', doctorId: '', date: '', time: '', session_type: 'كشف', mode: 'حضور بالعيادة', consultationPrice: '', followupPrice: '' });
      setSelectedDoctorData(null);
    }
  }, [editingData, isOpen, doctors]);

  // 🌟 الدالة السحرية: لما السكرتير يختار المريض، السيستم يسحب دكتوره وتسعيرته أتوماتيك!
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

  const handleSaveClick = async () => {
    let finalFees = 0;
    
    // حفظ التسعيرة لو الدكتور ملوش تسعيرة سابقة
    if (!selectedDoctorData?.consultation_price && formData.consultationPrice) {
      await supabase.from('doctors').update({
        consultation_price: Number(formData.consultationPrice),
        followup_price: Number(formData.followupPrice)
      }).eq('id', formData.doctorId);
      
      finalFees = formData.session_type === 'كشف' ? Number(formData.consultationPrice) : Number(formData.followupPrice);
    } else {
      // سحب التسعيرة المحفوظة مسبقاً
      finalFees = formData.session_type === 'كشف' ? Number(selectedDoctorData?.consultation_price || 0) : Number(selectedDoctorData?.followup_price || 0);
    }

    onSave({ ...formData, fees: finalFees });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 font-sans">
        
        <div className="flex justify-between items-center p-6 bg-[#00838F] text-white">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Calendar /> {editingData ? 'تعديل بيانات الحجز' : 'حجز موعد جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {loadingData ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00838F]" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* 🌟 المريض بيتم اختياره أولاً */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المريض</label>
                <div className="relative">
                  <select required value={formData.patientId} onChange={(e) => handlePatientSelect(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] font-bold text-sm cursor-pointer">
                    <option value="" disabled>-- اختر المريض --</option>
                    {patients.map((p) => <option key={p.id} value={p.id}>{p.name || p.full_name} ({p.phone || 'بدون رقم'})</option>)}
                  </select>
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {/* 🌟 حقل الدكتور بقى قراءة فقط وبيتعبى لوحده */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الطبيب المعالج (يتم تحديده تلقائياً)</label>
                <div className="relative">
                  <div className={`w-full border rounded-xl px-10 py-3 font-bold text-sm ${selectedDoctorData ? 'bg-cyan-50 border-cyan-200 text-[#00838F]' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                    {selectedDoctorData ? `د. ${selectedDoctorData.name || selectedDoctorData.full_name}` : 'اختر المريض أولاً'}
                  </div>
                  <UserCheck className={`absolute right-3 top-1/2 -translate-y-1/2 ${selectedDoctorData ? 'text-[#00838F]' : 'text-gray-400'}`} size={18} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الجلسة</label>
                <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00838F] text-sm font-bold" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">وقت الجلسة</label>
                <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00838F] text-sm font-bold" />
              </div>

              {/* مكان / طريقة الجلسة */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">مكان / طريقة الجلسة</label>
                <div className="relative">
                  <select required value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] font-bold text-sm">
                    <option value="حضور بالعيادة">حضور بالعيادة</option>
                    <option value="فيديو">أونلاين (فيديو)</option>
                    <option value="صوتية">مكالمة هاتفية</option>
                  </select>
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {/* التسعيرة الذكية بتظهر لو في دكتور متحدد */}
              {formData.doctorId && (
                <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-sm font-bold text-[#00838F] mb-3">نوع الحجز</label>
                  <div className="flex gap-6 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                      <input type="radio" name="type" value="كشف" checked={formData.session_type === 'كشف'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="text-[#00838F]" />
                      كشف جديد
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                      <input type="radio" name="type" value="إعادة" checked={formData.session_type === 'إعادة'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="text-[#00838F]" />
                      إعادة / متابعة
                    </label>
                  </div>

                  {!selectedDoctorData?.consultation_price && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-100 animate-fade-in">
                      <div>
                        <label className="block text-xs font-bold text-orange-600 mb-1">تسجيل سعر الكشف (لأول مرة)</label>
                        <input type="number" required value={formData.consultationPrice} onChange={e => setFormData({...formData, consultationPrice: e.target.value})} className="w-full border border-orange-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-orange-500" placeholder="مثال: 500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-orange-600 mb-1">تسجيل سعر الإعادة (لأول مرة)</label>
                        <input type="number" required value={formData.followupPrice} onChange={e => setFormData({...formData, followupPrice: e.target.value})} className="w-full border border-orange-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-orange-500" placeholder="مثال: 250" />
                      </div>
                    </div>
                  )}

                  {selectedDoctorData?.consultation_price && (
                    <div className="mt-2 text-sm font-bold text-emerald-600 flex gap-4 bg-white p-3 rounded-lg border border-emerald-100">
                      <span className="flex items-center gap-1"><DollarSign size={16}/> سعر الكشف: {selectedDoctorData.consultation_price} ج.م</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1"><DollarSign size={16}/> سعر الإعادة: {selectedDoctorData.followup_price} ج.م</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">إلغاء</button>
          <button 
            onClick={handleSaveClick} 
            disabled={!formData.patientId || !formData.doctorId || !formData.date || !formData.time}
            className="px-8 py-2.5 rounded-xl font-black text-white bg-[#00838F] hover:bg-[#006064] transition-colors shadow-md disabled:opacity-50"
          >
            حفظ الموعد
          </button>
        </div>

      </div>
    </div>
  );
};