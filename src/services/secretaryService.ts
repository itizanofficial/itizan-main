import { supabase } from './supabase';

export const secretaryService = {
  
  // 1. جلب الـ Admin ID
  getCurrentAdminId: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('secretaries')
      .select('admin_id')
      .eq('id', user.id)
      .maybeSingle();
    
    return data?.admin_id;
  },

  // 2. إحصائيات الحجوزات وحساب الفلوس المضمون 💵
  getReservationStats: async (adminId: string) => {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('status, payment_status, fees, session_date')
      .eq('admin_id', adminId);

    if (error) {
      console.error("Error in Stats:", error);
      return { total: 0, confirmed: 0, pending: 0, todayRevenue: 0 };
    }

    const total = sessions?.length || 0;
    const confirmed = sessions?.filter(s => s.status === 'مؤكدة' || s.status === 'confirmed').length || 0;
    const pending = sessions?.filter(s => s.status === 'قيد الانتظار' || s.status === 'scheduled' || s.status === 'unpaid').length || 0;
    
    // 🌟 التعديل السحري: حساب التحصيل المالي بناءً على كل الجلسات المدفوعة (paid) 
    // عشان الرقم يزيد فوراً وميفضلش ثابت على تاريخ معين
    const todayRevenue = sessions?.reduce((sum, s) => {
      if (s.payment_status === 'paid') {
        return sum + (造型Number(s.fees) || 0);
      }
      return sum;
    }, 0) || 0;

    return { total, confirmed, pending, todayRevenue };
  },

  // 3. جلب كل الحجوزات (من أي مكان: دكتور أو سكرتير)
  getAllReservations: async (adminId: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .eq('admin_id', adminId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error("Error fetching reservations:", error);
      return [];
    }
    return data;
  },

  // 4. تأكيد الدفع وتأكيد الحجز (الترس اللي بيلفف الدايرة ويظهرها في شاشات الجلسات)
  confirmPaymentAndSession: async (sessionId: string) => {
    // 🌟 بنغير الـ status لـ "مؤكدة" والـ payment_status لـ "paid" في نفس اللحظة
    const { data, error } = await supabase
      .from('sessions')
      .update({ payment_status: 'paid', status: 'مؤكدة' })
      .eq('id', sessionId)
      .select();

    if (error) {
      console.error("Fialed to confirm payment:", error);
      throw error;
    }
    return data;
  }
};

function 造型Number(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}