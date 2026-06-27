import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { secretaryService } from '../../services/secretaryService';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

import { SecretarySessionTable } from '../secretary/sessions/SecretarySessionTable';
import { SecretarySessionModals } from '../secretary/sessions/SecretarySessionModals';

export const SecretaryDailySessions = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [adminId, setAdminId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '' });

  // 🌟 ضفنا status و payment_status عشان التايب سكريبت ميزعلش
  const [formData, setFormData] = useState({ 
    id: '', patientId: '', doctorId: '', date: '', time: '', 
    mode: 'حضور بالعيادة', session_type: 'كشف', status: '', payment_status: '' 
  });
  const [notesData, setNotesData] = useState({ symptoms: '', goals: '', interventions: '', homework: '', extraNotes: '', patientNotes: '' });

  const loadData = async () => {
    try {
      const currentAdminId = await secretaryService.getCurrentAdminId();
      if (!currentAdminId) return;
      setAdminId(currentAdminId);

      // جلب الدكاترة (شلنا متغير docs اللي ملوش لازمة)
      const { data: allDocs } = await supabase.from('doctors').select('*').eq('admin_id', currentAdminId);
      setDoctors(allDocs || []);

      const docIds = allDocs?.map(d => d.id) || [];

      if (docIds.length > 0) {
        const { data: pats } = await supabase.from('patients').select('*').in('doctor_id', docIds);
        setPatients(pats || []);
      }

      // جلب الجلسات
      const data = await secretaryService.getAllReservations(currentAdminId);
      
      const formatted = (data || []).map((apt: any) => ({
        id: apt.id,
        patientId: apt.patient_id,
        doctorId: apt.doctor_id,
        patientName: apt.patient?.name || apt.patient?.full_name || 'مريض غير مسجل',
        phone: apt.patient?.phone || '---',
        doctorName: apt.doctor?.name || apt.doctor?.full_name || '---',
        date: apt.session_date ? apt.session_date.split('T')[0] : '',
        time: apt.session_date ? new Date(apt.session_date).toLocaleTimeString('en-US', { hour12: false }).substring(0, 5) : '',
        mode: apt.mode || 'حضور بالعيادة',
        session_type: apt.session_type || 'كشف',
        fees: apt.fees || 0,
        payment_status: apt.payment_status || 'unpaid',
        status: apt.status,
        clinical_notes: apt.clinical_notes || {}
      }));

      setSessions(formatted);
    } catch (error: any) {
      toast.error(`تعذر تحميل البيانات`);
    } finally { // 🌟 صلحنا الخطأ الإملائي هنا وبقت finally
      setLoading(false);
    }
  };

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

  const todayStr = new Date().toLocaleDateString('en-CA');
  
  const filteredSessions = sessions.filter(s => {
    const isToday = s.date === todayStr;
    const isApprovedAndPaid = (s.status === 'مؤكدة' || s.status === 'مكتملة' || s.status === 'completed') && s.payment_status === 'paid';
    
    if (!isToday || !isApprovedAndPaid) return false;

    const matchSearch = s.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let currentStatus = (s.status === 'مكتملة' || s.status === 'completed') ? 'مكتملة' : 'مؤكدة';
    const matchStatus = statusFilter === 'الكل' || currentStatus === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const doctorStatsChart = doctors.map((doc: any) => {
    const docTodaySessions = sessions.filter(s => s.doctorId === doc.id && s.date === todayStr && s.payment_status === 'paid');
    return {
      id: doc.id,
      name: doc.name || doc.full_name,
      total: docTodaySessions.length,
      completed: docTodaySessions.filter(s => s.status === 'مكتملة' || s.status === 'completed').length,
    };
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await secretaryService.saveSession({
        ...formData,
        status: formData.id ? formData.status : 'مؤكدة',
        payment_status: formData.id ? formData.payment_status : 'paid'
      }, adminId);

      if (!formData.id) {
        const { data: lastSession } = await supabase.from('sessions')
          .select('id').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(1).single();
        if (lastSession) {
          await secretaryService.confirmPaymentAndSession(lastSession.id);
        }
      }

      setIsAddModalOpen(false);
      setEditingData(null);
      toast.success(formData.id ? 'تم تعديل الموعد بنجاح 🔄' : 'تم إضافة الحجز العاجل كمدفوع ومؤكد ✅');
      loadData(); 
    } catch (error: any) {
      toast.error(`حدث خطأ أثناء الحفظ`);
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
          <p className="text-sm font-bold text-gray-500 mt-1">تتبع حركة المرضى المدفوعين والمؤكدين لليوم فقط</p>
        </div>
        <button onClick={() => { setEditingData(null); setFormData({ id: '', patientId: '', doctorId: '', date: '', time: '', mode: 'حضور بالعيادة', session_type: 'كشف', status: '', payment_status: '' }); setIsAddModalOpen(true); }} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm">
          <Plus size={20} /> إضافة حجز عاجل (مدفوع)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {doctorStatsChart.map((d: any) => (
          <div key={d.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-black text-gray-800 text-base">د. {d.name}</h4>
              <p className="text-xs text-gray-400 font-bold">جلسات اليوم الإجمالية</p>
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-cyan-50 text-[#00838F] px-3 py-1.5 rounded-xl"><span className="block text-lg font-black">{d.total}</span><span className="text-[10px] font-bold">مؤكدة</span></div>
              <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-xl"><span className="block text-lg font-black">{d.completed}</span><span className="text-[10px] font-bold">مكتملة</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
        <div className="relative w-full md:w-1/3">
          <input type="text" placeholder="ابحث باسم المريض أو الطبيب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          <Search size={18} className="absolute right-4 top-3.5 text-gray-400" />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
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
          onEdit={(data: any) => { 
            setEditingData(data); 
            setFormData({
              id: data.id, 
              patientId: data.patientId, 
              doctorId: data.doctorId, 
              date: data.date, 
              time: data.time, 
              mode: data.mode, 
              session_type: data.session_type, 
              status: data.status, 
              payment_status: data.payment_status
            }); 
            setIsAddModalOpen(true); 
          }}
          onForceDelete={(id: string) => setDeleteModal({ isOpen: true, id })} 
        />
      </div>

      <SecretarySessionModals 
        isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} isDetailsModalOpen={isDetailsModalOpen} setIsDetailsModalOpen={setIsDetailsModalOpen} isNotesModalOpen={isNotesModalOpen} setIsNotesModalOpen={setIsNotesModalOpen} selectedSession={selectedSession} patients={patients} doctors={doctors} formData={formData} setFormData={setFormData} notesData={notesData} setNotesData={setNotesData} handleCreateSession={handleCreateSession} editingData={editingData}
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