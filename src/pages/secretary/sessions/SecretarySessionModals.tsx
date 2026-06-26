import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, Info, Search } from 'lucide-react'; 

export const SecretarySessionModals = ({
  isAddModalOpen, setIsAddModalOpen,
  isDetailsModalOpen, setIsDetailsModalOpen,
  isNotesModalOpen, setIsNotesModalOpen,
  selectedSession, patients, formData, setFormData, notesData, setNotesData,
  handleCreateSession, handleSaveNotes
}: any) => {

  // 🌟 State للبحث في المرضى
  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredPatients = patients.filter((p: any) => 
    p.name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.phone?.includes(patientSearch)
  );

  // لقفل القائمة عند الضغط خارجها
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
      {/* 1. مودال إضافة الجلسة (للسكرتير) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans" dir="rtl">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative animate-fade-in text-gray-900 border border-gray-100">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 left-6 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-full"><X size={20} /></button>
            <h2 className="text-2xl font-black text-[#00838F] mb-6">إضافة جلسة سريعة</h2>
            
            <form onSubmit={handleCreateSession} className="space-y-5">
              
              {/* 🌟 قائمة منسدلة قابلة للبحث (Searchable Dropdown) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-bold mb-2 text-gray-700">البحث عن مريض</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="اكتب اسم المريض أو رقم الهاتف..." 
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3.5 outline-none focus:border-[#00838F] font-bold text-sm"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>

                {showDropdown && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-2 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <li className="p-4 text-center text-gray-500 font-bold text-sm">لا يوجد مريض بهذا الاسم</li>
                    ) : (
                      filteredPatients.map((p: any) => (
                        <li 
                          key={p.id} 
                          onClick={() => {
                            setFormData({...formData, patientId: p.id, doctorId: p.doctor_id});
                            setPatientSearch(`${p.name} - ${p.phone}`);
                            setShowDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-cyan-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="font-bold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.phone}</div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-gray-700">تاريخ الجلسة</label>
                  <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#00838F] font-bold text-sm" onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-gray-700">الساعة</label>
                  <input type="time" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#00838F] font-bold text-sm" onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">مكان/طريقة الجلسة</label>
                <select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#00838F] font-bold text-sm">
                  <option value="حضور بالعيادة">حضور بالعيادة</option>
                  <option value="مكالمة فيديو">أونلاين (فيديو)</option>
                  <option value="مكالمة صوتية">مكالمة هاتفية</option>
                </select>
              </div>

              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                <label className="block text-sm font-bold text-[#00838F] mb-3">نوع الحجز</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 text-sm">
                    <input type="radio" name="session_type" value="كشف" checked={formData.session_type === 'كشف'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="text-[#00838F]" />
                    كشف جديد
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 text-sm">
                    <input type="radio" name="session_type" value="إعادة" checked={formData.session_type === 'إعادة'} onChange={e => setFormData({...formData, session_type: e.target.value})} className="text-[#00838F]" />
                    إعادة / متابعة
                  </label>
                </div>
              </div>

              <button type="submit" disabled={!formData.patientId} className="w-full bg-[#00838F] hover:bg-[#006064] text-white py-4 rounded-2xl font-black mt-2 transition-colors shadow-md disabled:opacity-50">حفظ الموعد كمدفوع ومؤكد</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. مودال تفاصيل الجلسة (للسكرتير) */}
      {isDetailsModalOpen && selectedSession && !isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-gray-900 font-sans" dir="rtl">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 animate-fade-in">
            <div className="bg-gray-50 px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-xl font-black text-[#00838F]">ملف الجلسة - {selectedSession.id?.slice(0,8)}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="hover:bg-gray-200 text-gray-500 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8">
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">المريض</p><p className="text-lg font-black">{selectedSession.patient?.name || '---'}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">الطبيب</p><p className="text-lg font-black text-[#00838F]">د. {selectedSession.doctor?.name || '---'}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">نوع الجلسة</p><p className="text-lg font-black">{selectedSession.session_type || 'كشف'}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">وقت الجلسة</p><p className="text-lg font-black" dir="ltr">{formatDate(selectedSession.session_date).time}</p></div>
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

      {/* 3. مودال قراءة التقرير (للسكرتير - قراءة فقط غالباً) */}
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