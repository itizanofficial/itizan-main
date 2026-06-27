import React, { useState, useEffect } from 'react';
import { Users, Banknote, HandCoins, Loader2, Edit3, X, Building, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  role: 'doctor' | 'secretary';
  salary: number;
  loan: number;
  isPaid: boolean;
  lastPaidMonth: string;
}

interface Obligation {
  id: string;
  title: string;
  amount: number;
  isPaid: boolean;
}

export const TeamManagement: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // حالات النوافذ المنبثقة
  const [salaryModal, setSalaryModal] = useState({ isOpen: false, memberId: '', role: '', amount: '' });
  const [loanModal, setLoanModal] = useState({ isOpen: false, memberId: '', role: '', amount: '' });
  const [obModal, setObModal] = useState({ isOpen: false, title: '', amount: '' }); // 🌟 مودال الالتزامات

  const currentMonth = new Date().toISOString().slice(0, 7);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. جلب الموظفين
      const { data: doctors } = await supabase.from('doctors').select('id, full_name, salary, loan, last_paid_month').eq('admin_id', user.id);
      const { data: secretaries } = await supabase.from('secretaries').select('id, full_name, salary, loan, last_paid_month').eq('admin_id', user.id);

      const formattedTeam = [
        ...(doctors || []).map(d => ({ id: d.id, name: d.full_name, role: 'doctor' as const, salary: Number(d.salary) || 0, loan: Number(d.loan) || 0, isPaid: d.last_paid_month === currentMonth, lastPaidMonth: d.last_paid_month || '' })),
        ...(secretaries || []).map(s => ({ id: s.id, name: s.full_name, role: 'secretary' as const, salary: Number(s.salary) || 0, loan: Number(s.loan) || 0, isPaid: s.last_paid_month === currentMonth, lastPaidMonth: s.last_paid_month || '' }))
      ];
      setTeam(formattedTeam);

      // 🌟 2. جلب الالتزامات الثابتة
      const { data: obs } = await supabase.from('fixed_obligations').select('*').eq('admin_id', user.id);
      const formattedObs = (obs || []).map(o => ({
        id: o.id,
        title: o.title,
        amount: Number(o.amount) || 0,
        isPaid: o.last_paid_month === currentMonth
      }));
      setObligations(formattedObs);

    } catch (error) {
      toast.error('تعذر جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // دوال الموظفين (رواتب وسلف)
  const submitSalary = async () => {
    if (!salaryModal.amount) return;
    const table = salaryModal.role === 'doctor' ? 'doctors' : 'secretaries';
    try {
      await supabase.from(table).update({ salary: Number(salaryModal.amount) }).eq('id', salaryModal.memberId);
      toast.success('تم تحديد الراتب بنجاح ✅');
      setSalaryModal({ isOpen: false, memberId: '', role: '', amount: '' });
      fetchData();
    } catch (err) { toast.error('فشل تحديث الراتب'); }
  };

  const submitLoan = async () => {
    if (!loanModal.amount) return;
    const table = loanModal.role === 'doctor' ? 'doctors' : 'secretaries';
    const member = team.find(m => m.id === loanModal.memberId);
    if (!member) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from(table).update({ loan: member.loan + Number(loanModal.amount) }).eq('id', loanModal.memberId);
      await supabase.from('loans_history').insert([{ admin_id: user?.id, employee_id: member.id, employee_name: member.name, role: member.role, amount: Number(loanModal.amount) }]);
      toast.success('تم قيد السلفة بنجاح ✅');
      setLoanModal({ isOpen: false, memberId: '', role: '', amount: '' });
      fetchData();
    } catch (err) { toast.error('فشل قيد السلفة'); }
  };

  const handlePaySalary = async (member: TeamMember) => {
    const netSalary = member.salary - member.loan;
    if (netSalary < 0) { toast.error('لا يمكن الصرف! قيمة السلف تتخطى الراتب.'); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const table = member.role === 'doctor' ? 'doctors' : 'secretaries';
      await supabase.from('expenses').insert([{ amount: netSalary, note: `مسيرات رواتب شهر ${currentMonth} - ${member.name}`, category: 'مسيرات رواتب', admin_id: user?.id }]);
      await supabase.from(table).update({ loan: 0, last_paid_month: currentMonth }).eq('id', member.id);
      toast.success(`تم صرف ${netSalary.toLocaleString()} ج.م بنجاح 💵`);
      fetchData();
    } catch (err) { toast.error('حدث خطأ أثناء الصرف'); }
  };

  // 🌟 دوال الالتزامات الثابتة (إيجار، ضرائب)
  const submitObligation = async () => {
    if (!obModal.title || !obModal.amount) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('fixed_obligations').insert([{ admin_id: user?.id, title: obModal.title, amount: Number(obModal.amount) }]);
      toast.success('تم إضافة الالتزام بنجاح ✅');
      setObModal({ isOpen: false, title: '', amount: '' });
      fetchData();
    } catch (err) { toast.error('فشل حفظ الالتزام'); }
  };

  const handlePayObligation = async (ob: Obligation) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('expenses').insert([{ amount: ob.amount, note: `سداد التزام: ${ob.title} - شهر ${currentMonth}`, category: 'التزامات تشغيلية', admin_id: user?.id }]);
      await supabase.from('fixed_obligations').update({ last_paid_month: currentMonth }).eq('id', ob.id);
      toast.success(`تم سداد ${ob.title} بنجاح ✅`);
      fetchData();
    } catch (err) { toast.error('حدث خطأ أثناء السداد'); }
  };

  const handleDeleteObligation = async (id: string) => {
    try {
      await supabase.from('fixed_obligations').delete().eq('id', id);
      toast.success('تم حذف الالتزام 🗑️');
      fetchData();
    } catch (err) { toast.error('حدث خطأ أثناء الحذف'); }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 font-sans relative" dir="rtl">
      
      {/* 1. قسم رواتب الفريق */}
      <div className="flex flex-col text-right">
        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-2"><Users className="text-[#00838F]" /> إدارة حسابات الفريق</h2>
        <p className="text-gray-500 font-bold mt-1 text-sm">متابعة رواتب وسلف الطاقم الطبي بمؤسستك.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 gap-2 font-bold text-gray-500">
          <Loader2 className="animate-spin text-[#00838F]" size={24} /> <span>جاري التحميل...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          {team.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-5 font-black text-gray-600">الموظف المسؤول</th>
                    <th className="p-5 font-bold text-gray-600">الراتب الأساسي</th>
                    <th className="p-5 font-bold text-red-500">السلف المسجلة</th>
                    <th className="p-5 font-black text-[#00838F]">الصافي المستحق</th>
                    <th className="p-5 font-bold text-center text-gray-600">حالة المسيرات</th>
                    <th className="p-5 font-bold text-center text-gray-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m) => {
                    const net = m.salary - m.loan;
                    return (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-5">
                          <div className="font-black text-gray-900 text-base">{m.name}</div>
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mt-1 ${m.role === 'doctor' ? 'bg-cyan-50 text-[#00838F]' : 'bg-amber-50 text-amber-700'}`}>{m.role === 'doctor' ? 'طبيب ممارس' : 'إدارة الاستقبال'}</span>
                        </td>
                        <td className="p-5 font-bold text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>{m.salary.toLocaleString()} ج.م</span>
                            <button onClick={() => setSalaryModal({ isOpen: true, memberId: m.id, role: m.role, amount: m.salary ? m.salary.toString() : '' })} className="text-gray-400 hover:text-[#00838F] p-1"><Edit3 size={16} /></button>
                          </div>
                        </td>
                        <td className="p-5 font-bold text-red-500">- {m.loan.toLocaleString()} ج.م</td>
                        <td className="p-5 font-black text-[#00838F] text-lg">{net.toLocaleString()} ج.م</td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${m.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{m.isPaid ? 'مُقفل 🎉' : 'انتظار الصرف'}</span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setLoanModal({ isOpen: true, memberId: m.id, role: m.role, amount: '' })} disabled={m.isPaid} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all disabled:opacity-30"><HandCoins size={18} /></button>
                            {!m.isPaid && <button onClick={() => handlePaySalary(m)} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all shadow-sm"><Banknote size={18} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (<div className="p-12 text-center text-gray-400 font-bold opacity-60"><p>فريقك فارغ تماماً.</p></div>)}
        </div>
      )}

      {/* 🌟 2. قسم الالتزامات الثابتة الجديد */}
      <div className="pt-8">
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col text-right">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Building className="text-orange-500" /> الالتزامات المؤسسية الثابتة</h2>
            <p className="text-gray-500 font-bold mt-1 text-sm">سجل الإيجارات، الضرائب، الصيانة وأي التزامات شهرية.</p>
          </div>
          <button onClick={() => setObModal({ isOpen: true, title: '', amount: '' })} className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-5 py-3 rounded-xl font-bold flex gap-2 transition-colors shadow-sm">
            <Plus size={20} /> إضافة التزام
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          {obligations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right min-w-[600px]">
                <thead className="bg-orange-50/50 border-b border-orange-100">
                  <tr>
                    <th className="p-5 font-black text-gray-700">البيان (نوع الالتزام)</th>
                    <th className="p-5 font-bold text-orange-600">القيمة المستحقة</th>
                    <th className="p-5 font-bold text-center text-gray-600">حالة السداد</th>
                    <th className="p-5 font-bold text-center text-gray-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {obligations.map((ob) => (
                    <tr key={ob.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-5 font-black text-gray-900 text-lg">{ob.title}</td>
                      <td className="p-5 font-black text-orange-600 text-lg">{ob.amount.toLocaleString()} ج.م</td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${ob.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {ob.isPaid ? 'تم السداد 🎉' : 'انتظار السداد'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          {!ob.isPaid && <button onClick={() => handlePayObligation(ob)} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all shadow-sm font-bold flex items-center gap-1"><Banknote size={18} /> سداد</button>}
                          <button onClick={() => handleDeleteObligation(ob.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (<div className="p-12 text-center text-gray-400 font-bold opacity-60"><p>لا توجد التزامات ثابتة مسجلة.</p></div>)}
        </div>
      </div>

      {/* 🌟 المودالز */}
      {salaryModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-900">تحديد الراتب</h3>
              <button onClick={() => setSalaryModal({ ...salaryModal, isOpen: false })} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <input type="number" autoFocus value={salaryModal.amount} onChange={(e) => setSalaryModal({ ...salaryModal, amount: e.target.value })} placeholder="المبلغ (ج.م)" className="w-full bg-gray-50 border rounded-xl px-4 py-3.5 outline-none font-black text-center text-[#00838F] focus:border-[#00838F] mb-4" />
            <button onClick={submitSalary} className="w-full bg-[#00838F] text-white py-3 rounded-xl font-bold">حفظ الراتب</button>
          </div>
        </div>
      )}

      {loanModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 border border-red-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-red-600 flex gap-2"><HandCoins size={20} /> قيد سلفة</h3>
              <button onClick={() => setLoanModal({ ...loanModal, isOpen: false })} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <input type="number" autoFocus value={loanModal.amount} onChange={(e) => setLoanModal({ ...loanModal, amount: e.target.value })} placeholder="قيمة السلفة" className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 outline-none font-black text-center text-red-600 mb-4" />
            <button onClick={submitLoan} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold">اعتماد السلفة</button>
          </div>
        </div>
      )}

      {obModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 border border-orange-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-orange-600 flex gap-2"><Building size={20} /> إضافة التزام جديد</h3>
              <button onClick={() => setObModal({ ...obModal, isOpen: false })} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <input type="text" autoFocus value={obModal.title} onChange={(e) => setObModal({ ...obModal, title: e.target.value })} placeholder="البيان (مثال: إيجار العيادة، ضريبة...)" className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-4 py-3.5 outline-none font-bold text-gray-800 mb-3" />
            <input type="number" value={obModal.amount} onChange={(e) => setObModal({ ...obModal, amount: e.target.value })} placeholder="القيمة (ج.م)" className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-4 py-3.5 outline-none font-black text-center text-orange-600 mb-4" />
            <button onClick={submitObligation} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/30">حفظ الالتزام</button>
          </div>
        </div>
      )}

    </div>
  );
};