import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import { secretaryService } from '../../services/secretaryService';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

import { SecretarySessionTable } from '../secretary/sessions/SecretarySessionTable';
import { SecretarySessionModals } from '../secretary/sessions/SecretarySessionModals';

export const SecretaryDailySessions = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [adminId, setAdminId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '' });

  const [formData, setFormData] = useState({ patientId: '', doctorId: '', date: '', time: '', mode: 'حضور بالعيادة', session_type: 'كشف' });
  const [notesData, setNotesData] = useState({ symptoms: '', goals: '', interventions: '', homework: '', extraNotes: '', patientNotes: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const currentAdminId = await secretaryService.getCurrentAdminId();
      if (!currentAdminId) return;
      setAdminId(currentAdminId);

      // جلب المرضى المرتبطين بدكاترة المركز فقط
      const { data: docs } = await supabase.from('doctors').select('id').eq('admin_id', currentAdminId);
      const docIds = docs?.map(d => d.id) || [];

      if (docIds.length > 0) {
        const { data: pats } = await supabase.from('patients').select('*').in('doctor_id', docIds);
        setPatients(pats || []);
      }

      // جلب الجلسات
      const data = await secretaryService.getAllReservations(currentAdminId);
      setSessions(data || []);
    } catch (error: any) {
      toast.error(`تعذر تحميل الجلسات`);
    } finally {
      setLoading(false);
    }
  };

  // تفعيل الريل تايم لقفل الدائرة لايف فوراً
  useEffect(() => { 
    loadData(); 
    const channel = supabase
      .channel('daily_sessions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 🌟 فلترة صارمة جداً: تاريخ اليوم + (payment_status === 'paid' و status === 'مؤكدة' أو مكتملة)
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  const filteredSessions = sessions.filter(s => {
    const isToday = s.session_date?.includes(todayStr);
    const isApprovedAndPaid = (s.status === 'مؤكدة' || s.status === 'مكتملة' || s.status === 'completed') && s.payment_status === 'paid';
    
    if (!isToday || !isApprovedAndPaid) return false;

    const matchSearch = s.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let currentStatus = (s.status === 'مكتملة' || s.status === 'completed') ? 'مكتملة' : 'مؤكدة';
    const matchStatus = statusFilter === 'الكل' || currentStatus === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const combinedDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();
      
      // جلب تسعيرة الدكتور المختار أوتوماتيكياً
      const { data: doc } = await supabase.from('doctors').select('*').eq('id', formData.doctorId).single();
      const fees = formData.session_type === 'كشف' ? Number(doc?.consultation_price || 0) : Number(doc?.followup_price || 0);

      const payload = {
        patient_id: formData.patientId,
        doctor_id: formData.doctorId,
        admin_id: adminId,
        session_date: combinedDateTime,
        mode: formData.mode,
        session_type: formData.session_type,
        status: 'مؤكدة', // طالما السكرتير عملها من شاشة التشغيل اليومية فهي كاش ومدفوعة فوراً
        payment_status: 'paid',
        fees: fees
      };

      await supabase.from('sessions').insert([payload]);
      
      setIsAddModalOpen(false);
      setFormData({ patientId: '', doctorId: '', date: '', time: '', mode: 'حضور بالعيادة', session_type: 'كشف' });
      toast.success('تم إضافة الجلسة كمدفوعة ومؤكدة بنجاح ✅');
      loadData(); 
    } catch (error: any) {
      toast.error(`تعذر الحجز`);
    }
  };

  const executeDelete = async () => {
    try {
      await supabase.from('sessions').delete().eq('id', deleteModal.id);
      toast.success('تم مسح الجلسة بنجاح 🗑️');
      setDeleteModal({ isOpen: false, id: '' });
      loadData();
    } catch (error: any) {
      toast.error('حدث خطأ أثناء المسح');
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
    <div dir="rtl" className="space-y-6 animate-fade-in p-8 font-sans text-gray-900 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00838F]">غرفة تشغيل جلسات اليوم</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">تتبع حركة المرضى المدفوعين والمؤكدين لليوم فقط</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm">
          <Plus size={20} /> إضافة حجز عاجل (مدفوع)
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
        <div className="relative w-full md:w-1/3">
          <input type="text" placeholder="ابحث باسم المريض أو الطبيب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          <Search size={18} className="absolute right-4 top-3.5 text-gray-400" />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter size={18} className="text-gray-400 shrink-0" />
          {['الكل', 'مؤكدة', 'مكتملة'].map(filter => (
            <button key={filter} onClick={() => setStatusFilter(filter)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${statusFilter === filter ? 'bg-[#00838F] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden mt-6">
        <SecretarySessionTable 
          sessions={filteredSessions} 
          loading={loading} 
          onOpenDetails={openDetails} 
          onForceDelete={(id: string) => setDeleteModal({ isOpen: true, id })} 
        />
      </div>

      <SecretarySessionModals 
        isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} isDetailsModalOpen={isDetailsModalOpen} setIsDetailsModalOpen={setIsDetailsModalOpen} isNotesModalOpen={isNotesModalOpen} setIsNotesModalOpen={setIsNotesModalOpen} selectedSession={selectedSession} patients={patients} formData={formData} setFormData={setFormData} notesData={notesData} setNotesData={setNotesData} handleCreateSession={handleCreateSession}
      />

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 border border-gray-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500"><AlertTriangle size={32} /></div>
              <div>
                <h3 className="text-xl font-black text-gray-900">إلغاء الجلسة نهائياً</h3>
                <p className="text-sm text-gray-500 mt-2 font-bold">هل أنت متأكد من مسح هذه الجلسة من جدول اليوم؟</p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setDeleteModal({ isOpen: false, id: '' })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">تراجع</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/30">نعم، احذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};