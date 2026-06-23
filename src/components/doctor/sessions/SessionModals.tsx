import React from 'react';
import { X, FileText, Heart, BrainCircuit, Activity as Pulse, Info } from 'lucide-react'; 

export const SessionModals = ({
  isAddModalOpen, setIsAddModalOpen,
  isDetailsModalOpen, setIsDetailsModalOpen,
  isNotesModalOpen, setIsNotesModalOpen,
  selectedSession, patients, formData, setFormData, notesData, setNotesData,
  handleCreateSession, handleSaveNotes
}: any) => {

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
      {/* 1. مودال الجدولة (الحجز المباشر من العيادة) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans" dir="rtl">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative animate-fade-in text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 left-6 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-800 p-2 rounded-full"><X size={20} /></button>
            <h2 className="text-2xl font-black text-[#00838F] dark:text-cyan-400 mb-6">حجز جلسة جديدة</h2>
            
            <form onSubmit={handleCreateSession} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">ملف المريض</label>
                <select required className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm cursor-pointer" onChange={e => setFormData({...formData, patientId: e.target.value})}>
                  <option value="">-- اختار المريض --</option>
                  {patients.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">تاريخ الجلسة</label>
                  <input type="date" required className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm cursor-pointer" onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">الساعة</label>
                  <input type="time" required className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm cursor-pointer" onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">مكان/نوع الجلسة</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm cursor-pointer">
                  <option value="حضور بالعيادة">حضور بالعيادة</option>
                  <option value="مكالمة فيديو">أونلاين (فيديو)</option>
                  <option value="مكالمة صوتية">مكالمة هاتفية</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#00838F] hover:bg-[#006064] text-white py-4 rounded-2xl font-black mt-2 transition-colors shadow-md">حفظ الموعد</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. مودال تفاصيل الجلسة */}
      {isDetailsModalOpen && selectedSession && !isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-gray-900 dark:text-white font-sans" dir="rtl">
          <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-fade-in">
            <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-black text-[#00838F] dark:text-cyan-400">ملف الجلسة - {selectedSession.id?.slice(0,8)}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">اسم المريض</p><p className="text-lg font-black">{selectedSession.patient?.name}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">نوع الجلسة</p><p className="text-lg font-black">{selectedSession.session_type}</p></div>
                <div className="text-center"><p className="text-xs font-bold text-gray-400 mb-1.5">وقت الجلسة</p><p className="text-lg font-black" dir="ltr">{formatDate(selectedSession.session_date).date} <span className="text-[#00838F]">{formatDate(selectedSession.session_date).time}</span></p></div>
                
                {/* 🌟 عرض مدة الجلسة الفعلية لو كانت محفوظة */}
                {selectedSession.clinical_notes?.actualDuration && (
                  <div className="text-center"><p className="text-xs font-bold text-emerald-500 mb-1.5">مدة الجلسة الفعلية</p><p className="text-lg font-black text-emerald-600">{selectedSession.clinical_notes.actualDuration} د</p></div>
                )}
              </div>

              <h3 className="text-xl font-black mb-5 text-gray-800 dark:text-white">الروشتة والتقارير</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setIsNotesModalOpen(true)} className="flex items-center justify-between p-5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors shadow-sm">
                  <div className="flex items-center gap-3"><FileText className="text-[#00838F]" /><span className="font-bold text-[#00838F] dark:text-cyan-300 text-lg">كتابة / عرض التقرير</span></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. مودال ملخص الجلسة الشامل */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-gray-900 dark:text-white font-sans" dir="rtl">
          <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-gray-100 dark:border-gray-800 animate-fade-in">
            <div className="bg-cyan-50 dark:bg-cyan-950/40 px-6 py-5 flex justify-between items-center border-b border-cyan-100 dark:border-cyan-900/50">
              <div className="flex items-center gap-3"><FileText className="text-[#00838F]" /><h2 className="text-xl font-black text-[#00838F] dark:text-cyan-300">التقرير والروشتة</h2></div>
              <button onClick={() => setIsNotesModalOpen(false)} className="text-cyan-600 hover:text-red-500 transition-colors bg-white dark:bg-cyan-900 p-2 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              
              <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50 p-5 rounded-2xl mb-2">
                <label className="flex items-center gap-2 text-sm font-black text-[#00838F] dark:text-cyan-300 mb-3">
                  <Info size={18} /> تعليمات وتوجيهات (هتتبعت للمريض في التطبيق)
                </label>
                <textarea 
                  rows={3} 
                  value={notesData.patientNotes || ''} 
                  onChange={e => setNotesData({...notesData, patientNotes: e.target.value})} 
                  className="w-full bg-white dark:bg-gray-800 border border-cyan-200 dark:border-cyan-700/50 rounded-xl p-4 focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none resize-none text-gray-900 dark:text-white font-medium text-sm transition-all" 
                  placeholder="اكتب التوجيهات الطبية أو المهام المطلوبة من المريض..." 
                />
              </div>

              {['الأعراض والشكوى', 'أهداف الجلسة', 'التدخلات الطبية', 'التكليفات والواجبات', 'ملاحظات الطبيب (سرية)'].map((label, i) => {
                const keys = ['symptoms', 'goals', 'interventions', 'homework', 'extraNotes'];
                const key = keys[i];
                return (
                  <div key={key}>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{label}</label>
                    <textarea 
                      rows={3} 
                      value={notesData[key]} 
                      onChange={e => setNotesData({...notesData, [key]: e.target.value})} 
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:bg-white focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none resize-none text-gray-900 dark:text-white transition-all font-medium text-sm" 
                      placeholder={`اكتب ${label}...`} 
                    />
                  </div>
                );
              })}
            </div>

            <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsNotesModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">إلغاء</button>
              <button onClick={handleSaveNotes} className="px-8 py-3 rounded-xl font-black bg-[#00838F] hover:bg-[#006064] text-white transition-colors shadow-lg shadow-cyan-500/30">حفظ التقرير وإرساله</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};