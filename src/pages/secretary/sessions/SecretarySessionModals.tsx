import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, Info, Search, Calendar, User, UserCheck } from 'lucide-react'; 

export const SecretarySessionModals = ({
  isAddModalOpen, setIsAddModalOpen,
  isDetailsModalOpen, setIsDetailsModalOpen,
  isNotesModalOpen, setIsNotesModalOpen,
  selectedSession, patients = [], doctors = [], formData, setFormData, notesData, setNotesData,
  handleCreateSession, handleSaveNotes, editingData
}: any) => {

  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDoctorData, setSelectedDoctorData] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredPatients = patients.filter((p: any) => 
    (p.name || p.full_name || '').toLowerCase().includes(patientSearch.toLowerCase()) || 
    (p.phone || '').includes(patientSearch)
  );

  useEffect(() => {
    if (isAddModalOpen) {
      if (editingData) {
        const doc = doctors.find((d: any) => d.id === editingData.doctorId);
        setSelectedDoctorData(doc || null);
        setPatientSearch(editingData.patientName);
        setFormData({
          id: editingData.id,
          patientId: editingData.patientId,
          doctorId: editingData.doctorId,
          date: editingData.date,
          time: editingData.time,
          session_type: editingData.session_type || 'كشف',
          mode: editingData.mode || 'حضور بالعيادة',
          status: editingData.status,
          payment_status: editingData.payment_status
        });
      } else {
        setFormData({ id: '', patientId: '', doctorId: '', date: '', time: '', session_type: 'كشف', mode: 'حضور بالعيادة' });
        setPatientSearch('');
        setSelectedDoctorData(null);
      }
    }
  }, [editingData, isAddModalOpen, doctors]);

  const handlePatientSelect = (p: any) => {
    const doc = doctors.find((d: any) => d.id === p.doctor_id);
    setSelectedDoctorData(doc || null);
    setFormData({ ...formData, patientId: p.id, doctorId: p.doctor_id });
    setPatientSearch(`${p.name || p.full_name} - ${p.phone || ''}`);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (isoString: string) => {
    if (!isoString) return { date: '', time: '' };
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans" dir="rtl">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 animate-fade-in text-gray-900">
            
            <div className="flex justify-between items-center px-6 py-4 bg-[#00838F] text-white">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Calendar size={20} /> {editingData ? 'تعديل موعد الجلسة' : 'إضافة جلسة سريعة'}
              </h2>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-5">
              
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold mb-1.5 text-gray-700">البحث عن مريض</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    disabled={!!editingData}
                    placeholder="اكتب اسم المريض أو رقم الهاتف..." 
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-2.5 outline-none focus:border-[#00838F] font-bold text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>

                {showDropdown && !editingData && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl max-h-42 overflow-y-auto custom-scrollbar">
                    {filteredPatients.length === 0 ? (
                      <li className="p-3 text-center text-gray-500 font-bold text-sm">لا يوجد مريض</li>
                    ) : (
                      filteredPatients.map((p: any) => (
                        <li key={p.id} onClick={() => handlePatientSelect(p)} className="px-4 py-2.5 hover:bg-cyan-50 cursor-pointer border-b border-gray-50 transition-colors text-sm font-bold text-gray-800">
                          {p.name || p.full_name} <span className="text-xs text-gray-400 font-normal">({p.phone})</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">الطبيب المعالج (تلقائي)</label>
                <div className="relative">
                  <input type="text" disabled value={selectedDoctorData ? `د. ${selectedDoctorData.name || selectedDoctorData.full_name}` : ''} className="w-full bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-2.5 font-bold text-sm text-[#00838F] cursor-not-allowed" placeholder="اختر المريض أولاً" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">تاريخ الجلسة</label>
                  <input type="date" required value={formData.date || ''} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#00838F] font-bold text-sm" onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">الساعة</label>
                  <input type="time" required value={formData.time || ''} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#00838F] font-bold text-sm" onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-700">مكان/طريقة الجلسة</label>
                <select value={formData.mode || 'حضور بالعيادة'} onChange={e => setFormData({...formData, mode: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#00838F] font-bold text-sm">
                  <option value="حضور بالعيادة">حضور بالعيادة</option>
                  <option value="فيديو">أونلاين (فيديو)</option>
                  <option value="صوتية">مكالمة هاتفية</option>
                </select>
              </div>

              <div className="border border-cyan-100 bg-cyan-50/30 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-[#00838F]">نوع الحجز</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 text-sm">
                      <input type="radio" name="session_type" value="كشف" checked={formData.session_type === 'كشف'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="accent-[#00838F]" /> كشف جديد
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 text-sm">
                      <input type="radio" name="session_type" value="إعادة" checked={formData.session_type === 'إعادة'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="accent-[#00838F]" /> إعادة / متابعة
                    </label>
                  </div>
                </div>
                {selectedDoctorData && (
                  <div className="flex items-center justify-center gap-4 text-xs font-bold text-emerald-600 bg-white py-2 rounded-lg border border-emerald-100">
                    <span>$ الكشف: {selectedDoctorData.consultation_price || 0} ج.م</span>
                    <span className="text-gray-300">|</span>
                    <span>$ الإعادة: {selectedDoctorData.followup_price || 0} ج.م</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="submit" disabled={!formData.patientId || !formData.date || !formData.time} className="bg-[#56B5C2] hover:bg-[#4AA0AC] text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
                  حفظ الموعد
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors px-4">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. مودال تفاصيل الجلسة */}
      {isDetailsModalOpen && selectedSession && !isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-gray-900 font-sans" dir="rtl">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 animate-fade-in">
            <div className="bg-gray-50 px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-xl font-black text-[#00838F]">ملف الجلسة - {selectedSession.id?.slice(0,8)}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="hover:bg-gray-200 text-gray-500 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8">
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">المريض</p><p className="text-lg font-black">{selectedSession.patientName || '---'}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">الطبيب</p><p className="text-lg font-black text-[#00838F]">د. {selectedSession.doctorName || '---'}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">نوع الجلسة</p><p className="text-lg font-black">{selectedSession.session_type || 'كشف'}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">وقت الجلسة</p><p className="text-lg font-black" dir="ltr">{selectedSession.time}</p></div>
              </div>

              <h3 className="text-xl font-black mb-5 text-gray-800">الروشتة والتقارير</h3>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => setIsNotesModalOpen(true)} className="flex items-center justify-between p-5 rounded-2xl bg-cyan-50 border border-cyan-100 hover:bg-cyan-100 transition-colors shadow-sm">
                  <div className="flex items-center gap-3"><FileText className="text-[#00838F]" /><span className="font-bold text-[#00838F] text-lg">عرض تقرير الطبيب لهذه الجلسة</span></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. مودال قراءة التقرير */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-gray-900 font-sans" dir="rtl">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-gray-100 animate-fade-in">
            <div className="bg-cyan-50 px-6 py-5 flex justify-between items-center border-b border-cyan-100">
              <div className="flex items-center gap-3"><FileText className="text-[#00838F]" /><h2 className="text-xl font-black text-[#00838F]">تقرير الجلسة (نسخة السكرتارية)</h2></div>
              <button onClick={() => setIsNotesModalOpen(false)} className="text-cyan-600 hover:text-red-500 bg-white p-2 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="bg-cyan-50/50 border border-cyan-100 p-5 rounded-2xl mb-2">
                <label className="flex items-center gap-2 text-sm font-black text-[#00838F] mb-3">
                  <Info size={18} /> تعليمات وتوجيهات الطبيب للمريض
                </label>
                <div className="w-full bg-white border border-cyan-100 rounded-xl p-4 text-gray-900 font-medium text-sm min-h-[60px]">
                  {notesData.patientNotes || 'لا توجد تعليمات مسجلة.'}
                </div>
              </div>

              {['الأعراض والشكوى', 'أهداف الجلسة', 'التدخلات الطبية', 'التكليفات والواجبات', 'ملاحظات الطبيب (سرية)'].map((label, i) => {
                const keys = ['symptoms', 'goals', 'interventions', 'homework', 'extraNotes'];
                const key = keys[i];
                return (
                  <div key={key}>
                    <label className="block text-sm font-bold mb-2 text-gray-700">{label}</label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium text-sm min-h-[60px]">
                       {notesData[key as keyof typeof notesData] || '---'}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-5 bg-gray-50 flex justify-end">
              <button onClick={() => setIsNotesModalOpen(false)} className="px-6 py-3 rounded-xl font-bold bg-[#00838F] text-white">إغلاق التقرير</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};