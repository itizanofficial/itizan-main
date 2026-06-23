import React, { useState } from 'react';
import { Mail, Shield, Award, Camera, Loader2 } from 'lucide-react';
import { uploadDoctorAvatar, updateDoctorProfile } from '../../../services/doctorProfileService';
import type { DoctorProfileData } from '../../../services/doctorProfileService';

interface ProfileHeaderProps {
  profileData: DoctorProfileData;
  isEditing: boolean;
  setProfileData: React.Dispatch<React.SetStateAction<DoctorProfileData | null>>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileData, isEditing, setProfileData }) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    const imageUrl = await uploadDoctorAvatar(file);
    
    if (imageUrl) {
      setProfileData(prev => prev ? { ...prev, avatar_url: imageUrl } : prev);
      await updateDoctorProfile({ avatar_url: imageUrl });
    } else {
      alert("تعذر رفع الصورة، تأكد من إعدادات التخزين.");
    }
    setUploading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-[#E0F7FA] dark:bg-cyan-900/30 text-[#00838F] dark:text-cyan-400 flex items-center justify-center text-4xl font-black shadow-inner border border-cyan-100 dark:border-cyan-800 overflow-hidden">
          {uploading ? (
            <Loader2 className="animate-spin" size={30} />
          ) : profileData.avatar_url ? (
            <img src={profileData.avatar_url} alt="Doctor" className="w-full h-full object-cover" />
          ) : (
            profileData.full_name ? profileData.full_name.charAt(0) : 'د'
          )}
        </div>
        {isEditing && (
          <label className="absolute -bottom-2 -right-2 bg-[#00838F] text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-[#006064] transition-colors">
            <Camera size={16} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="flex-1 text-center md:text-right">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{profileData.full_name || 'طبيب جديد'}</h2>
        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">{profileData.title || profileData.specialty || 'قم بتحديث المسمى الوظيفي'}</p>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><Award size={16} /> {profileData.experience_years || '0'} خبرة</span>
          <span className="flex items-center gap-1.5"><Shield size={16} /> الترخيص: {profileData.license_number || 'غير مسجل'}</span>
          <span className="flex items-center gap-1.5"><Mail size={16} /> {profileData.email}</span>
        </div>
      </div>
    </div>
  );
};