import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, MessageCircle, FileText, UserPlus, Loader2 } from 'lucide-react';
import { PatientDetailsModal } from '../../components/doctor/patients/PatientDetailsModal';
import { AddPatientModal } from '../../components/doctor/patients/AddPatientModal';
import { doctorService } from '../../services/doctorService';
import { supabase } from '../../services/supabase';

export const Patients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('الكل');
  
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await doctorService.getDoctorPatients(user.id);
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [isAddModalOpen]);

  // دالة فحص حالة المراجع (متصل أو غير متصل) بناء على آخر ظهور last_seen
  const getOnlineStatus = (lastSeenString: string) => {
    if (!lastSeenString) return { label: 'غير متصل', isOnline: false };
    
    const lastSeen = new Date(lastSeenString);
    const now = new Date();
    
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 1000 / 60);
    
    if (diffInMinutes <= 5) {
      return { label: 'متصل مؤخراً', isOnline: true };
    }
    return { label: 'غير متصل', isOnline: false };
  };

  const filteredPatients = patients.filter(p => {
    const matchSearch = (p.name && p.name.includes(searchTerm)) || (p.phone && p.phone.includes(searchTerm));
    const statusInfo = getOnlineStatus(p.last_seen);
    const matchFilter = filter === 'الكل' || 
                        (filter === 'متصل مؤخراً' && statusInfo.isOnline) || 
                        (filter === 'غير متصل' && !statusInfo.isOnline);

    return matchSearch && matchFilter;
  });

  const handleOpenProfile = (patient: any) => {
    setSelectedPatient(patient);
    setIsDetailsModalOpen(true);
  };

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">السجلات الطبية للمراجعين</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">إدارة هويات المراجعين، التاريخ المرضي، والمتابعة السريرية</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm active:scale-95">
          <UserPlus size={20} /> فتح ملف مراجع جديد
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="ابحث باسم المراجع أو رقم السجل الخلوي..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-10 py-3 outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm shadow-inner" 
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Filter size={18} className="text-gray-400 shrink-0" />
          {['الكل', 'متصل مؤخراً', 'غير متصل'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors outline-none ${
                filter === f 
                  ? 'bg-[#00838F] text-white shadow-sm shadow-cyan-500/20' 
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 text-[#00838F] dark:text-cyan-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="font-bold text-gray-500 dark:text-gray-400">جاري مزامنة السجلات الطبية...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-5 border border-gray-100 dark:border-gray-700">
            <UserPlus size={36} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">لا توجد سجلات مطابقة</h3>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm max-w-md">لم يتم العثور على مراجعين بهوية التطابق الحالية، قم بدعوة المراجعين لربط حساباتهم بكود العيادة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => {
            const connection = getOnlineStatus(patient.last_seen);

            return (
              <div key={patient.id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#E0F7FA] dark:bg-cyan-900/30 text-[#00838F] dark:text-cyan-400 flex items-center justify-center text-xl font-black border border-cyan-100 dark:border-cyan-800/50 shadow-sm">
                      {patient.name ? patient.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white text-lg">{patient.name || 'مراجع مجهول الهوية'}</h3>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1" dir="ltr">{patient.phone || 'الرقم غير مدون'}</p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black border ${connection.isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}>
                    {connection.label}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6 flex-1 flex flex-col justify-center gap-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">التشخيص السريري</span>
                    <span className="text-sm font-black text-[#00838F] dark:text-cyan-400 truncate max-w-[150px]">{patient.diagnosis || 'لم يحدد مبدئياً'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenProfile(patient)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-50 dark:bg-cyan-900/20 text-[#00838F] dark:text-cyan-400 hover:bg-[#00838F] hover:text-white dark:hover:bg-[#00838F] dark:hover:text-white rounded-xl font-bold text-sm transition-colors border border-cyan-100 dark:border-cyan-800/50">
                    <FileText size={18} /> فتح السجل
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-sm transition-colors border border-blue-100 dark:border-blue-800/50">
                    <MessageCircle size={18} /> مراسلة
                  </button>
                  <button className="w-12 flex items-center justify-center py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors shrink-0 border border-emerald-100 dark:border-emerald-800/50">
                    <Phone size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PatientDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        patient={selectedPatient} 
        onRefresh={fetchPatients} 
      />
      <AddPatientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

    </div>
  );
};