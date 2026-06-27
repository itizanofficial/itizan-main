import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import { sessionAdminService } from '../../services/sessionAdminService';
import toast from 'react-hot-toast';

import { SessionStats } from '../../components/doctor/sessions/SessionStats';
import { SessionTable } from '../../components/doctor/sessions/SessionTable';
import { SessionModals } from '../../components/doctor/sessions/SessionModals';
import { ActiveSessionRoom } from '../../components/doctor/sessions/ActiveSessionRoom';

export const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null); // 🌟 لجلب أسعار الدكتور
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  const [activeRoomSession, setActiveRoomSession] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [editingData, setEditingData] = useState<any>(null);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '' });
  const [missedModal, setMissedModal] = useState({ isOpen: false, id: '', note: 'تغيب المريض عن الحضور في الموعد المحدد دون إبلاغ مسبق.' });

  const [formData, setFormData] = useState({ id: '', patientId: '', date: '', time: '', type: '', mode: 'حضور بالعيادة', session_type: 'كشف' });
  const [notesData, setNotesData] = useState({ symptoms: '', goals: '', interventions: '', homework: '', extraNotes: '', patientNotes: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      // 🌟 نفس الكود بتاعك اللي كان شغال 100%
      const data = await sessionAdminService.getSessions();
      const pats = await sessionAdminService.getPatients();
      const docInfo = await sessionAdminService.getDoctorData();
      
      setPatients(pats || []);
      setDoctorInfo(docInfo || null);

      const smartlySorted = (data || []).sort((a: any, b: any) => {
        const isACompleted = a.status === 'مكتملة' || a.status === 'completed' || a.status === 'فائتة' || a.status === 'missed';
        const isBCompleted = b.status === 'مكتملة' || b.status === 'completed' || b.status === 'فائتة' || b.status === 'missed';
        if (isACompleted && !isBCompleted) return 1;  
        if (!isACompleted && isBCompleted) return -1; 
        return new Date(a.session_date).getTime() - new Date(b.session_date).getTime();
      });

      setSessions(smartlySorted);
    } catch (error: any) {
      toast.error(`تعذر تحميل الجلسات`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 🌟 نفس الفلتر الصارم بتاعك
  const filteredSessions = sessions.filter(s => {
    const isPaid = s.payment_status === 'paid';
    const isApprovedStatus = s.status === 'مؤكدة' || s.status === 'confirmed' || s.status === 'مكتملة' || s.status === 'completed' || s.status === 'فائتة' || s.status === 'missed';

    if (!isPaid || !isApprovedStatus) return false;

    const matchSearch = s.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.session_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let currentStatus = 'مؤكدة';
    if (s.status === 'مكتملة' || s.status === 'completed' || s.status === 'فائتة' || s.status === 'missed') currentStatus = 'مكتملة'; 

    const matchStatus = statusFilter === 'الكل' || currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayCount = sessions.filter(s => s.session_date?.startsWith(today) && (s.status === 'مؤكدة' || s.status === 'confirmed') && s.payment_status === 'paid').length;
  const completedCount = sessions.filter(s => s.status === 'مكتملة' || s.status === 'completed').length;

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sessionAdminService.saveSession(formData);
      setIsAddModalOpen(false);
      setEditingData(null);
      toast.success(formData.id ? 'تم تعديل الموعد بنجاح' : 'تم حجز الجلسة المبدئية بنجاح!');
      loadData(); 
    } catch (error: any) {
      toast.error(`تعذر الحجز`);
    }
  };

  const executeDelete = async () => {
    try {
      await sessionAdminService.forceDeleteSession(deleteModal.id);
      toast.success('تم مسح الجلسة بنجاح 🗑️');
      setDeleteModal({ isOpen: false, id: '' });
      loadData();
    } catch (error: any) {
      toast.error(`حدث خطأ أثناء المسح`);
    }
  };

  const executeMissed = async () => {
    if (!missedModal.note.trim()) { toast.error('يرجى إدخال ملاحظة الغياب أولاً!'); return; }
    try {
      await sessionAdminService.markSessionAsMissed(missedModal.id, missedModal.note);
      toast.success('تم تسجيل الغياب ❌');
      setMissedModal({ isOpen: false, id: '', note: '' });
      loadData();
    } catch (error: any) {
      toast.error(`حدث خطأ`);
    }
  };

  const handleRemind = async (session: any) => {
    try {
      const d = new Date(session.session_date);
      const dateStr = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      await sessionAdminService.sendReminder(session.patient_id, dateStr, timeStr);
      toast.success('تم إرسال التذكير بنجاح 🔔');
    } catch (error: any) {
      toast.error(`تعذر إرسال التذكير`);
    }
  };

  const handleSaveNotes = async (sessionId: string, customNotes: any) => {
    try {
      await sessionAdminService.saveClinicalNotes(sessionId, customNotes);
      toast.success('تم إنهاء الجلسة وحفظ التقرير ✅');
      setActiveRoomSession(null); 
      setIsNotesModalOpen(false);
      setIsDetailsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(`تعذر حفظ التقرير`);
    }
  };

  const openDetails = (session: any) => {
    setSelectedSession(session);
    if (session.clinical_notes) {
      setNotesData({
        symptoms: session.clinical_notes.symptoms || '', goals: session.clinical_notes.goals || '', interventions: session.clinical_notes.interventions || '', homework: session.clinical_notes.homework || '', extraNotes: session.clinical_notes.extraNotes || '', patientNotes: session.clinical_notes.patientNotes || ''
      });
    } else {
      setNotesData({ symptoms: '', goals: '', interventions: '', homework: '', extraNotes: '', patientNotes: '' });
    }
    setIsDetailsModalOpen(true);
  };

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans text-gray-900 dark:text-white relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">إدارة الجلسات</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">عرض الجلسات المؤكدة وإدارة التقارير للعيادة</p>
        </div>
        {!activeRoomSession && (
          <button onClick={() => { setEditingData(null); setIsAddModalOpen(true); }} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm">
            <Plus size={20} /> حجز جلسة جديدة
          </button>
        )}
      </div>

      {activeRoomSession ? (
        <ActiveSessionRoom session={activeRoomSession} onLeave={() => setActiveRoomSession(null)} onSaveNotes={handleSaveNotes} />
      ) : (
        <>
          <SessionStats todayCount={todayCount} completedCount={completedCount} />
          
          {/* 🌟 الدارك مود للفلتر وتوحيد الألوان */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <div className="relative w-full md:w-1/3">
              <input type="text" placeholder="ابحث في الجلسات المؤكدة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 text-sm font-bold transition-all" />
              <Search size={18} className="absolute right-4 top-3.5 text-gray-400" />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <Filter size={18} className="text-gray-400 shrink-0" />
              {['الكل', 'مؤكدة', 'مكتملة'].map(filter => (
                <button 
                  key={filter} onClick={() => setStatusFilter(filter)} 
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors outline-none ${statusFilter === filter ? 'bg-[#00838F] text-white shadow-sm shadow-cyan-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mt-6">
            <SessionTable 
              sessions={filteredSessions} 
              loading={loading} 
              onOpenDetails={openDetails} 
              onEdit={(data: any) => { 
                setEditingData(data); 
                setFormData({
                  id: data.id, patientId: data.patient_id || data.patientId, 
                  date: data.session_date ? data.session_date.split('T')[0] : '', 
                  time: data.session_date ? new Date(data.session_date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '',
                  mode: data.mode || 'حضور بالعيادة', session_type: data.session_type || 'كشف', type: data.diagnosis || ''
                }); 
                setIsAddModalOpen(true); 
              }}
              onForceDelete={(id: string) => setDeleteModal({ isOpen: true, id })}
              onJoinRoom={(session: any) => setActiveRoomSession(session)} 
              onRemind={handleRemind} 
              onMarkMissed={(session: any) => setMissedModal({ isOpen: true, id: session.id, note: missedModal.note })}
            />
          </div>
        </>
      )}

      <SessionModals 
        isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} isDetailsModalOpen={isDetailsModalOpen} setIsDetailsModalOpen={setIsDetailsModalOpen} isNotesModalOpen={isNotesModalOpen} setIsNotesModalOpen={setIsNotesModalOpen} selectedSession={selectedSession} patients={patients} doctorInfo={doctorInfo} formData={formData} setFormData={setFormData} notesData={notesData} setNotesData={setNotesData} handleCreateSession={handleCreateSession} editingData={editingData} handleSaveNotes={() => handleSaveNotes(selectedSession.id, notesData)}
      />
      {missedModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl p-6 border dark:border-gray-800">
            <h3 className="text-xl font-black mb-4">تسجيل غياب المريض</h3>
            <textarea className="w-full bg-gray-50 dark:bg-gray-800 border rounded-xl p-3 h-24 text-sm font-bold outline-none focus:border-red-500" value={missedModal.note} onChange={(e) => setMissedModal(prev => ({ ...prev, note: e.target.value }))} />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMissedModal({ isOpen: false, id: '', note: 'تغيب المريض عن الحضور.' })} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl font-bold">تراجع</button>
              <button onClick={executeMissed} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">اعتماد الغياب</button>
            </div>
          </div>
        </div>
      )}  

      {/* 🌟 مودال المسح */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500"><AlertTriangle size={32} /></div>
              <div><h3 className="text-xl font-black text-gray-900 dark:text-white">مسح الجلسة نهائياً</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-bold">هل أنت متأكد من مسح الجلسة؟</p></div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setDeleteModal({ isOpen: false, id: '' })} className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold">تراجع</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/30">نعم، احذف فوراً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};