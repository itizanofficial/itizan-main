import React, { useState, useEffect } from 'react';
import { Search, UserPlus, QrCode, Trash2, Loader2, Phone, Calendar, User } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { secretaryService } from '../../services/secretaryService';
import toast from 'react-hot-toast';
import { SecretaryAddPatientModal } from '../secretary/patients/SecretaryAddPatientModal';

export const SecretaryPatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentAdminId = await secretaryService.getCurrentAdminId();
      if (!currentAdminId) return;

      const { data: docs } = await supabase.from('doctors').select('*').eq('admin_id', currentAdminId);
      setDoctors(docs || []);
      const docIds = docs?.map(d => d.id) || [];

      if (docIds.length > 0) {
        // 🌟 بنجيب المريض ومعاه بيانات دكتوره
        const { data: pats } = await supabase
          .from('patients')
          .select('*, doctor:doctors(*)')
          .in('doctor_id', docIds)
          .order('created_at', { ascending: false });
        setPatients(pats || []);
      } else {
        setPatients([]);
      }
    } catch (error) {
      toast.error('تعذر تحميل بيانات المرضى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من مسح هذا المريض نهائياً؟')) return;
    try {
      await supabase.from('patients').delete().eq('id', id);
      toast.success('تم مسح المريض بنجاح 🗑️');
      loadData();
    } catch (error) {
      toast.error('حدث خطأ أثناء المسح');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.phone?.includes(searchQuery) ||
    p.patient_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in p-8 font-sans text-gray-900 bg-gray-50/50 min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00838F]">سجل مرضى المركز</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">إجمالي المرضى: {patients.length} مريض مسجل</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm">
          <UserPlus size={20} /> إضافة مريض جديد
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 flex justify-between items-center mt-6">
        <div className="relative w-full md:w-1/2">
          <input type="text" placeholder="ابحث بالاسم، الكود، أو رقم الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" />
          <Search size={18} className="absolute right-4 top-3.5 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00838F]" size={40} /></div>
      ) : filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <User size={64} className="mb-4 opacity-20" />
          <p className="font-bold text-lg">لا يوجد مرضى مسجلين حتى الآن.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {/* 🌟 كروت المرضى الشيك 🌟 */}
          {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              
              <div className="absolute top-0 right-0 w-2 h-full bg-[#00838F] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-cyan-50 text-[#00838F] flex items-center justify-center font-black text-xl border border-cyan-100 shadow-sm overflow-hidden">
                    {patient.avatar_url || patient.image ? (
                       <img src={patient.avatar_url || patient.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      patient.name?.charAt(0) || 'م'
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">{patient.name || patient.full_name}</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black tracking-widest mt-1" dir="ltr">
                      <QrCode size={12} className="text-[#00838F]"/> {patient.patient_code || '---'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50/50 rounded-xl p-4 border border-gray-50">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><User size={16}/></div>
                  <span className="text-[#00838F]">طبيب: د. {patient.doctor?.name || patient.doctor?.full_name || '---'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Phone size={16}/></div>
                  <span dir="ltr">{patient.phone || 'غير مسجل'}</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                <button onClick={() => handleDelete(patient.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={16} /> مسح الملف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SecretaryAddPatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        doctors={doctors}
        onSuccess={loadData}
      />
    </div>
  );
};