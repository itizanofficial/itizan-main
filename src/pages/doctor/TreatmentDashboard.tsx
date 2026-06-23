import React, { useState, useEffect } from 'react';
import { Users, Activity, Pill, Video, CheckSquare, Moon, Search } from 'lucide-react';

// 🌟 استيراد السيرفيس اللي لسه منظفينه بدل الاستعلام المباشر القديم
import { treatmentPlanService } from '../../services/treatmentPlanService'; 

// استيراد الـ 5 مكونات السحرية من مجلد الـ plans
import { DailyTasksManager } from '../../components/doctor/plans/DailyTasksManager';
import { SleepManager } from '../../components/doctor/plans/SleepManager';
import { MedicationManager } from '../../components/doctor/plans/MedicationManager';
import { ContentAssigner } from '../../components/doctor/plans/ContentAssigner';
import { TreatmentTimeline } from '../../components/doctor/plans/TreatmentTimeline';

export const TreatmentDashboard: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 استخدام الدالة الجديدة لجلب مرضى الطبيب الحالي فقط من جدول patients
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const data = await treatmentPlanService.searchDoctorPatients('');
        setPatients(data || []);
      } catch (error) {
        console.error("خطأ في جلب المرضى:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const tabs = [
    { id: 'tasks', label: 'المهام والتكرار', icon: CheckSquare },
    { id: 'sleep', label: 'متابعة النوم', icon: Moon },
    { id: 'meds', label: 'الأدوية والوصفات', icon: Pill },
    { id: 'content', label: 'المحتوى العلاجي', icon: Video },
    { id: 'timeline', label: 'الخطة الزمنية', icon: Activity },
  ];

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans text-gray-900 dark:text-white">
      
      <div>
        <h1 className="text-3xl font-black text-[#00838F] dark:text-cyan-400">لوحة التحكم في الخطة العلاجية</h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">إدارة الأدوية، المهام اليومية، النوم، والمحتوى المخصص لكل مريض</p>
      </div>

      {/* 1. قسم اختيار المريض */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="text-[#00838F]" size={20} /> 1. اختر المريض لبدء تفصيل خطته
        </h2>
        
        <div className="relative mb-4 w-full md:w-1/2">
          <input 
            type="text" 
            placeholder="ابحث عن مريض بالاسم..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-[#00838F] text-sm font-bold" 
          />
          <Search size={18} className="absolute right-4 top-3.5 text-gray-400" />
        </div>

        {isLoading ? (
            <div className="text-center py-4 text-gray-500 font-bold text-sm">جاري تحميل قائمة مرضاك...</div>
        ) : filteredPatients.length === 0 ? (
            <div className="text-center py-4 text-gray-500 font-bold text-sm">لا يوجد مرضى متاحين حالياً.</div>
        ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {filteredPatients.map(patient => (
                <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`flex items-center gap-3 min-w-[220px] p-3 rounded-2xl border transition-all ${
                    selectedPatient?.id === patient.id 
                    ? 'bg-[#00838F]/10 border-[#00838F] shadow-sm' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#00838F]/50'
                }`}
                >
                <img src={patient.avatar_url || 'https://via.placeholder.com/40'} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div className="text-right">
                    <p className={`text-sm font-bold ${selectedPatient?.id === patient.id ? 'text-[#00838F] dark:text-cyan-400' : 'text-gray-800 dark:text-gray-200'}`}>{patient.name}</p>
                    <p className="text-xs text-gray-400 font-bold">ملف رقم: {patient.id.slice(0,5)}</p>
                </div>
                </button>
            ))}
            </div>
        )}
      </div>

      {/* 2. مساحة العمل النشطة */}
      {selectedPatient ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px]">
          
          <div className="flex overflow-x-auto bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-[#00838F] text-[#00838F] dark:text-cyan-400 bg-white dark:bg-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
             {/* 🌟 استدعاء المكونات الحقيقية المربوطة بالداتا بيز مباشرة */}
             {activeTab === 'tasks' && <DailyTasksManager patientId={selectedPatient.id} />}
             {activeTab === 'sleep' && <SleepManager patientId={selectedPatient.id} />}
             {activeTab === 'meds' && <MedicationManager patientId={selectedPatient.id} />}
             {activeTab === 'content' && <ContentAssigner patientId={selectedPatient.id} />}
             {activeTab === 'timeline' && <TreatmentTimeline patientId={selectedPatient.id} />}
          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-10 flex flex-col items-center justify-center text-center opacity-70">
          <Search size={48} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-500">يرجى تحديد مريض من القائمة بالأعلى</h3>
          <p className="text-gray-400 mt-2 text-sm">لعرض وتفصيل الخطة العلاجية والمهام اليومية والأدوية المخصصة له</p>
        </div>
      )}

    </div>
  );
};