import React from 'react';
import { User, Phone, Building, Globe } from 'lucide-react';
import type { DoctorProfileData } from '../../../services/doctorProfileService';

interface PersonalInfoProps {
  profileData: DoctorProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<DoctorProfileData | null>>;
  isEditing: boolean;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ profileData, setProfileData, isEditing }) => {
  const handleChange = (field: keyof DoctorProfileData, value: string) => {
    setProfileData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const renderField = (label: string, field: keyof DoctorProfileData, placeholder: string, isLtr = false) => (
    <div>
      <span className="block text-xs font-bold text-gray-500 mb-1.5">{label}</span>
      {isEditing ? (
        <input 
          type="text" 
          dir={isLtr ? "ltr" : "rtl"}
          value={profileData[field] as string || ''} 
          onChange={(e) => handleChange(field, e.target.value)} 
          placeholder={placeholder}
          className={`w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all ${isLtr ? 'text-left font-sans' : ''}`}
        />
      ) : (
        <span className="font-black text-gray-900 dark:text-white block mt-1" dir={isLtr ? "ltr" : "rtl"}>
          {profileData[field] as string || <span className="text-gray-400 font-bold text-xs">غير مدون بالسجل</span>}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* البيانات الأساسية */}
      <div>
        <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center gap-2 mb-6">
          <User size={20} /> الهوية المهنية والأكاديمية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          {renderField('الاسم الكامل', 'full_name', 'مثال: أ.د. طارق الحبيب')}
          {renderField('المسمى الوظيفي', 'title', 'مثال: استشاري أول الطب النفسي')}
          {renderField('التخصص ', 'specialty', 'مثال: الطب النفسي الدوائي والعلاج المعرفي')}
          {renderField('رقم ترخيص مزاولة المهنة', 'license_number', 'مثال: MOH-PSY-10293', true)}
          {renderField('سنوات الممارسة السريرية', 'experience_years', 'مثال: 12 عاماً')}
        </div>
        
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <span className="block text-xs font-bold text-gray-500 mb-2">نبذة مهنية (Bio)</span>
          {isEditing ? (
             <textarea 
               value={profileData.bio || ''} 
               onChange={(e) => handleChange('bio', e.target.value)} 
               rows={4}
               placeholder="اكتب نبذة توضح التدرج الأكاديمي، الاهتمامات البحثية، والخبرات السريرية..."
               className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 transition-all resize-none"
             />
          ) : (
            <p className="font-bold text-gray-800 dark:text-gray-200 leading-relaxed text-sm mt-2">
              {profileData.bio || <span className="text-gray-400">لم يتم إدراج نبذة مهنية في السجل السريري.</span>}
            </p>
          )}
        </div>
      </div>

      {/* بيانات الاتصال */}
      <div>
        <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center gap-2 mb-6">
          <Phone size={20} /> قنوات التواصل الرسمية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          {renderField('رقم الهاتف המعتمد', 'phone', 'مثال: +201001234567', true)}
          {renderField('البريد الإلكتروني المهني', 'email', 'مثال: doctor@hospital.com', true)}
          {renderField('منطقة الممارسة (المدينة)', 'city', 'مثال: القاهرة')}
          {renderField('عنوان المراسلة', 'address', 'مثال: 15 شارع البطل أحمد عبد العزيز، المهندسين')}
        </div>
      </div>

      {/* العيادة والتواجد الميداني */}
      <div>
        <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center gap-2 mb-6">
          <Building size={20} /> التواجد الميداني والمؤسسة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          {renderField('اسم المنشأة الطبية / العيادة', 'clinic_name', 'مثال: مركز اتزان للطب النفسي')}
          {renderField('مقر المنشأة', 'clinic_address', 'مثال: مبنى العيادات التخصصية، الطابق الثالث')}
        </div>
      </div>
      
    </div>
  );
};