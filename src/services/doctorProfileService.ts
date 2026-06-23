import { supabase } from './supabase';

export interface DoctorProfileData {
  id?: string;
  full_name: string;
  title: string;
  specialty: string;
  license_number: string;
  experience_years: string;
  bio: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  clinic_name?: string;
  clinic_address?: string;
  working_hours: number;
  schedule: { day: string; time: string; type: 'work' | 'off' }[];
  avatar_url?: string;
  
  // إحصائيات لايف (لا تُحفظ في قاعدة البيانات)
  total_patients: number;
  completed_sessions: number;
  rating: number;
  
  // المصفوفات
  qualifications?: string[];
  certificates?: string[];
}

export const uploadDoctorAvatar = async (file: File): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `doctors/${fileName}`;
    
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
      upsert: true,
      cacheControl: '3600'
    });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return null;
  }
};

export const fetchDoctorProfile = async (): Promise<DoctorProfileData | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("غير مسجل الدخول");

    // أ. جلب بيانات البروفايل من جدول الدكاترة
    const { data: profile, error: prError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (prError) console.error("Error fetching base profile:", prError.message);

    // ب. جلب عدد المراجعين الفعليين
    let patientsCount = 0;
    try {
      const { data: patientsList } = await supabase.from('patients').select('id').eq('doctor_id', user.id);
      if (patientsList) patientsCount = patientsList.length;
    } catch (e) {}

    // ج. جلب عدد الاستشارات المكتملة
    let sessionsCount = 0;
    try {
      const { data: sessionsList } = await supabase.from('sessions').select('id').eq('doctor_id', user.id).eq('status', 'completed');
      if (sessionsList) sessionsCount = sessionsList.length;
    } catch (e) {}

    // د. حساب التقييم السريري التقديري
    let profileScore = 0;
    if (profile?.bio) profileScore += 0.2;
    if (profile?.avatar_url) profileScore += 0.2;
    
    let casesScore = Math.min((sessionsCount / 50), 1.0); 
    let calculatedRating = Number((3.0 + profileScore + casesScore).toFixed(1)); 
    calculatedRating = Math.min(calculatedRating, 5.0); 

    return {
      id: user.id,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      email: profile?.email || user.email || '',
      title: profile?.title || '',
      specialty: profile?.specialty || '',
      license_number: profile?.license_number || '',
      experience_years: profile?.experience_years || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      address: profile?.address || '',
      clinic_name: profile?.clinic_name || '',
      clinic_address: profile?.clinic_address || '',
      schedule: Array.isArray(profile?.schedule) && profile.schedule.length === 7 ? profile.schedule : [],
      avatar_url: profile?.avatar_url || '',
      qualifications: profile?.qualifications || [],
      certificates: profile?.certificates || [],
      
      // الإحصائيات الحية
      total_patients: patientsCount,
      completed_sessions: sessionsCount,
      rating: calculatedRating,
      working_hours: profile?.working_hours || 0
    };
  } catch (error) {
    console.error("Error in fetchDoctorProfile service:", error);
    return null;
  }
};

export const updateDoctorProfile = async (profileData: Partial<DoctorProfileData>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // إزالة البيانات المحسوبة
    const {
      total_patients,
      completed_sessions,
      rating,
      id, 
      ...cleanDataToUpdate
    } = profileData;

    // 🌟 نرجعها update (لأن الدكتور المفروض يتكريت من شاشة الأدمن مش من هنا)
    const { error, data } = await supabase
      .from('doctors')
      .update(cleanDataToUpdate)
      .eq('id', user.id)
      .select(); 
      
    if (error) {
      console.error("Supabase Update Error:", error.message);
      return false;
    }

    // لو مفيش داتا رجعت، يبقى ده حساب قديم مش موجود في جدول الدكاترة
    if (!data || data.length === 0) {
      console.error("حساب الطبيب غير مسجل في قاعدة بيانات العيادة (حساب قديم).");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Network/Catch error:", error);
    return false;
  }
};

export const changeDoctorPassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  } catch (error) { 
    console.error("Error changing password:", error);
    return false; 
  }
};

export const logWorkingTime = async (minutesToLog: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase.from('doctors').select('working_hours').eq('id', user.id).maybeSingle();
    const currentHours = data?.working_hours || 0;
    
    const newHours = Number((currentHours + (minutesToLog / 60)).toFixed(2));
    await supabase.from('doctors').update({ working_hours: newHours }).eq('id', user.id);
  } catch (error) {
    console.error("Error logging working hours:", error);
  }
};