import React, { useState } from 'react';
import { Award, CheckCircle, Plus, X } from 'lucide-react';
import type { DoctorProfileData } from '../../../services/doctorProfileService';

interface ProfessionalInfoProps {
  profileData: DoctorProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<DoctorProfileData | null>>;
  isEditing: boolean;
}

export const ProfessionalInfo: React.FC<ProfessionalInfoProps> = ({ profileData, setProfileData, isEditing }) => {
  const [newQual, setNewQual] = useState('');
  const [newCert, setNewCert] = useState('');

  const handleAdd = (field: 'qualifications' | 'certificates', value: string, setter: any) => {
    if (!value.trim()) return;
    setProfileData(prev => prev ? { ...prev, [field]: [...(prev[field] || []), value.trim()] } : prev);
    setter('');
  };

  const handleRemove = (field: 'qualifications' | 'certificates', index: number) => {
    setProfileData(prev => {
      if (!prev) return prev;
      const updated = [...(prev[field] || [])];
      updated.splice(index, 1);
      return { ...prev, [field]: updated };
    });
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-4xl mx-auto">
      
      {/* المؤهلات الأكاديمية */}
      <div>
        <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center justify-center gap-2 mb-6">
          <Award size={22} /> المؤهلات الأكاديمية والدرجات العلمية
        </h3>
        
        {isEditing && (
          <div className="flex gap-2 mb-4">
            <input 
              value={newQual} 
              onChange={(e) => setNewQual(e.target.value)} 
              placeholder="مثال: الزمالة السعودية للطب النفسي - 2018" 
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all" 
            />
            <button 
              onClick={() => handleAdd('qualifications', newQual, setNewQual)} 
              className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-1 transition-colors shadow-sm"
            >
              <Plus size={18}/> إدراج السجل
            </button>
          </div>
        )}

        <div className="space-y-3">
          {(!profileData.qualifications || profileData.qualifications.length === 0) && !isEditing && (
             <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 font-bold text-sm">
               لم يتم إدراج مؤهلات أكاديمية في السجل حتى الآن.
             </div>
          )}
          {profileData.qualifications?.map((qual, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-4 text-center font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 relative group">
              <span className="w-2 h-2 rounded-full bg-[#00838F]"></span> {qual}
              {isEditing && (
                <button onClick={() => handleRemove('qualifications', idx)} className="absolute left-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <X size={18}/>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* الشهادات والتراخيص السريرية */}
      <div>
        <h3 className="text-[#00838F] dark:text-cyan-400 font-black flex items-center justify-center gap-2 mb-6">
          <CheckCircle size={22} /> التراخيص السريرية والدورات المعتمدة
        </h3>
        
        {isEditing && (
          <div className="flex gap-2 mb-4">
            <input 
              value={newCert} 
              onChange={(e) => setNewCert(e.target.value)} 
              placeholder="مثال: رخصة ممارسة العلاج المعرفي السلوكي (CBT) - 2020" 
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all" 
            />
            <button 
              onClick={() => handleAdd('certificates', newCert, setNewCert)} 
              className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-1 transition-colors shadow-sm"
            >
              <Plus size={18}/> إدراج السجل
            </button>
          </div>
        )}

        <div className="space-y-3">
          {(!profileData.certificates || profileData.certificates.length === 0) && !isEditing && (
             <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 font-bold text-sm">
               لم يتم إدراج شهادات سريرية أو تراخيص في السجل حتى الآن.
             </div>
          )}
          {profileData.certificates?.map((cert, idx) => (
            <div key={idx} className="bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30 rounded-2xl p-4 text-center font-bold text-[#00838F] dark:text-cyan-400 flex items-center justify-center gap-2 relative">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span> {cert}
              {isEditing && (
                <button onClick={() => handleRemove('certificates', idx)} className="absolute left-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <X size={18}/>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};