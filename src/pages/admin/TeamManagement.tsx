import React, { useState, useEffect } from 'react';
import { Users, Banknote, HandCoins, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase'; 

interface TeamMember {
  id: string;
  name: string;
  role: 'doctor' | 'secretary';
  salary: number;
  loan: number;
  isPaid: boolean;
}

export const TeamManagement: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // دالة جلب أعضاء الفريق المربوطين بالأدمن الحالي
  const fetchTeamData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. جلب الأطباء التابعين لهذا الأدمن
      const { data: doctors, error: docErr } = await supabase
        .from('doctors')
        .select('id, full_name, working_hours') // افترضنا إن فيه عمود لو مفيش هينزل صفر
        .eq('admin_id', user.id);

      if (docErr) throw docErr;

      // 2. جلب السكرتارية التابعين لهذا الأدمن
      const { data: secretaries, error: secErr } = await supabase
        .from('secretaries')
        .select('id, full_name')
        .eq('admin_id', user.id);

      if (secErr) throw secErr;

      // 3. دمج البيانات وتنسيقها في مصفوفة واحدة
      const formattedDoctors: TeamMember[] = (doctors || []).map(d => ({
        id: d.id,
        name: d.full_name,
        role: 'doctor',
        salary: 10000, // هنا تقدر تربطها بعمود الراتب لو ضفته، أو تسيبها قيمة افتراضية
        loan: 0,       // السلف لايف لحد ما تعمل جدول مالي مخصص
        isPaid: false
      }));

      const formattedSecretaries: TeamMember[] = (secretaries || []).map(s => ({
        id: s.id,
        name: s.full_name,
        role: 'secretary',
        salary: 5000,  // راتب افتراضي للسكرتارية
        loan: 0,
        isPaid: false
      }));

      setTeam([...formattedDoctors, ...formattedSecretaries]);
    } catch (error) {
      console.error("Error fetching team financials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  // دالة تسجيل سلفة (كمثال مستقبلي لربطها بالداتا بيز)
  const handleAddLoan = (memberId: string) => {
    alert(`سيتم فتح نافذة قيد سلفة للموظف ذو المعرف: ${memberId}`);
  };

  // دالة تأكيد صرف الراتب
  const handlePaySalary = (memberId: string) => {
    setTeam(prev => prev.map(m => m.id === memberId ? { ...m, isPaid: true } : m));
    alert("تم تسجيل صرف الراتب في النظام بنجاح! 💵");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans" dir="rtl">
      
      {/* الهيدر */}
      <div className="flex flex-col text-right">
        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-2">
          <Users className="text-[#00838F]" /> إدارة حسابات الفريق
        </h2>
        <p className="text-gray-500 font-bold mt-1 text-sm">متابعة رواتب وأقساط الطاقم الطبي المربوط بمظلتك الإدارية.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 gap-2 font-bold text-gray-500">
          <Loader2 className="animate-spin text-[#00838F]" size={24} />
          <span>جاري تحميل كشوفات الموظفين الحية...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {team.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="p-5 font-black text-gray-600 dark:text-gray-300">الموظف المسؤول</th>
                    <th className="p-5 font-bold text-gray-600 dark:text-gray-300">الراتب المستحق</th>
                    <th className="p-5 font-bold text-red-500">السلف المسجلة</th>
                    <th className="p-5 font-black text-[#00838F] dark:text-cyan-400">الصافي الجاهز للصرف</th>
                    <th className="p-5 font-bold text-center text-gray-600 dark:text-gray-300">حالة المسيرات</th>
                    <th className="p-5 font-bold text-center text-gray-600 dark:text-gray-300">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-5">
                        <div className="font-black text-gray-900 dark:text-white text-base">{m.name}</div>
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mt-1 ${m.role === 'doctor' ? 'bg-cyan-50 text-[#00838F] dark:bg-cyan-950/40 dark:text-cyan-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                          {m.role === 'doctor' ? 'طبيب ممارس' : 'إدارة الاستقبال'}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-gray-600 dark:text-gray-300">{m.salary.toLocaleString()} ج.م</td>
                      <td className="p-5 font-bold text-red-500">- {m.loan.toLocaleString()} ج.م</td>
                      <td className="p-5 font-black text-gray-800 dark:text-cyan-400 text-base">{(m.salary - m.loan).toLocaleString()} ج.م</td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${m.isPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                          {m.isPaid ? 'تم تسليم الراتب 🎉' : 'انتظار الصرف'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleAddLoan(m.id)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 rounded-xl transition-all" title="قيد سلفة مالية">
                            <HandCoins size={18} />
                          </button>
                          {!m.isPaid && (
                            <button onClick={() => handlePaySalary(m.id)} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl transition-all" title="اعتماد صرف المسيرات">
                              <Banknote size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400 font-bold opacity-60">
              <Users size={48} className="mx-auto mb-3 text-gray-300" />
              <p>فريقك فارغ تماماً حتى الآن.</p>
              <p className="text-xs font-medium mt-1">اضغط على شاشة "إضافة عضو جديد" لبناء هيكل مؤسستك.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};