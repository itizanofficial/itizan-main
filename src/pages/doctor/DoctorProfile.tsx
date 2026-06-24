import React, { useState, useEffect } from 'react';
import { User, Award, Clock, Shield, Edit, Save, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // 🌟 مكتبة الإشعارات
import { fetchDoctorProfile, updateDoctorProfile } from '../../services/doctorProfileService';
import type { DoctorProfileData } from '../../services/doctorProfileService';

import { ProfileHeader } from '../../components/doctor/profile/ProfileHeader';
import { PersonalInfo } from '../../components/doctor/profile/PersonalInfo';
import { ProfessionalInfo } from '../../components/doctor/profile/ProfessionalInfo';
import { ScheduleInfo } from '../../components/doctor/profile/ScheduleInfo';
import { SecurityInfo } from '../../components/doctor/profile/SecurityInfo';

export const DoctorProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'schedule' | 'security'>('personal');
  
  const [profileData, setProfileData] = useState<DoctorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDoctorProfile();
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error('تعذر جلب بيانات السجل المهني.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profileData) return;
    setSaving(true);
    try {
      const success = await updateDoctorProfile(profileData);
      if (success) {
        setIsEditing(false);
        toast.success('تم تحديث بيانات السجل المهني والسريري بنجاح.'); // 🌟 Toast احترافي
      } else {
        throw new Error('فشل التحديث');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء محاولة حفظ التغييرات، يرجى المحاولة لاحقاً.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadData(); 
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-[#00838F] dark:text-cyan-400">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-bold text-gray-500 dark:text-gray-400">جاري استحضار بيانات السجل المهني...</p>
    </div>
  );
  
  if (!profileData) return (
    <div className="text-center py-20 font-bold text-red-500 bg-red-50 dark:bg-red-950/20 rounded-3xl m-8 border border-red-100 dark:border-red-900/50">
      حدث خطأ في مزامنة بيانات الملف الشخصي، يرجى تحديث الصفحة.
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6 animate-fade-in pb-10 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">السجل المهني (البروفايل)</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">إدارة واعتماد هويتك الأكاديمية والسريرية على المنظومة</p>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-3">
            <button onClick={handleCancel} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-gray-300 dark:border-gray-600 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 text-sm">
              <X size={18} /> تراجع
            </button>
            <button onClick={handleSave} disabled={saving} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-colors shadow-md text-sm disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
              {saving ? 'جاري الاعتماد...' : 'اعتماد التحديثات'}
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm">
            <Edit size={18} /> تحديث البيانات
          </button>
        )}
      </div>

      <ProfileHeader profileData={profileData} isEditing={isEditing} setProfileData={setProfileData} />

      <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 p-2 flex flex-col md:flex-row gap-2 shadow-sm">
        <button onClick={() => setActiveTab('personal')} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'personal' ? 'bg-[#00838F] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><User size={18} /> المعلومات الشخصية </button>
        <button onClick={() => setActiveTab('professional')} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'professional' ? 'bg-[#00838F] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Award size={18} /> المعلومات المهنية</button>
        <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'schedule' ? 'bg-[#00838F] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Clock size={18} /> مواعيد العمل </button>
        <button onClick={() => setActiveTab('security')} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all outline-none ${activeTab === 'security' ? 'bg-[#00838F] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Shield size={18} />الأمان والخصوصية</button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-10 min-h-[400px]">
        {activeTab === 'personal' && <PersonalInfo profileData={profileData} setProfileData={setProfileData} isEditing={isEditing} />}
        {activeTab === 'professional' && <ProfessionalInfo profileData={profileData} setProfileData={setProfileData} isEditing={isEditing} />}
        {activeTab === 'schedule' && <ScheduleInfo profileData={profileData} setProfileData={setProfileData} isEditing={isEditing} />}
        {activeTab === 'security' && <SecurityInfo />}
      </div>

    </div>
  );
};