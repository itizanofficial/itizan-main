import React, { useState } from 'react';
import { 
  Phone, Mail, MoreVertical, Edit, Trash2, CheckCircle, 
  Clock, RefreshCw, MapPin, Video, PhoneCall, CalendarX 
} from 'lucide-react';

export const AppointmentTable = ({ appointments, onEdit, onDelete, onRemind, onConfirmCall }: any) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getModeIcon = (mode: string) => {
    if (!mode) return null;
    if (mode.includes('فيديو') || mode.includes('Online') || mode.includes('أونلاين')) return <Video size={14} className="text-purple-500" />;
    if (mode.includes('صوتية') || mode.includes('مكالمة')) return <PhoneCall size={14} className="text-blue-500" />;
    return <MapPin size={14} className="text-emerald-500" />;
  };

  return (
    <div className="overflow-x-auto min-h-[300px] relative pb-20 font-sans">
      
      {openMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)}></div>
      )}

      <table className="w-full text-right whitespace-nowrap table-auto">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm w-1/5">اسم المراجع</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm">الموعد</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">نوع الجلسة</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm w-1/4">الملاحظات</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">الحالة</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <CalendarX size={48} className="mb-4 opacity-30" />
                  <p className="font-bold text-lg text-gray-500">مفيش حجوزات حالياً</p>
                </div>
              </td>
            </tr>
          ) : (
            appointments.map((apt: any) => (
              <tr key={apt.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#FBF9F6] dark:hover:bg-gray-800/50 transition-colors">
                
                {/* اسم المريض */}
                <td className="py-4 px-6">
                  <div className="font-black text-gray-900 dark:text-white mb-1 truncate max-w-[150px]">{apt.patientName}</div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {apt.age || '--'} عام <span className="mx-1">|</span> <span dir="ltr">{apt.phone || '--'}</span>
                  </div>
                </td>
                
                {/* التاريخ والوقت */}
                <td className="py-4 px-6 font-bold text-gray-800 dark:text-gray-300 text-sm">
                  <div className="text-sm">{apt.date}</div>
                  <div className="text-xs font-black text-[#00838F] dark:text-cyan-400 mt-1" dir="ltr">{apt.time}</div>
                </td>
                
                {/* نوع الجلسة المدمج (بدون كلمة حضور بالعيادة) */}
                <td className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold whitespace-nowrap">
                      {apt.session_type || 'كشف'}
                    </span>
                    {/* 🌟 مش هيعرض أي حاجة تخص المكان إلا لو كان فيديو أو مكالمة */}
                    {apt.mode && apt.mode.trim() !== '' && apt.mode !== 'حضور بالعيادة' && (
                      <span className="flex items-center justify-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm w-max mx-auto text-[11px] font-bold text-gray-600 dark:text-gray-300">
                        {getModeIcon(apt.mode)} {apt.mode}
                      </span>
                    )}
                  </div>
                </td>

                {/* الملاحظات */}
                <td className="py-4 px-6 max-w-[150px]">
                  {apt.diagnosis ? (
                    <div className="p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg text-[11px] font-bold text-blue-700 dark:text-blue-300 truncate border border-blue-100 dark:border-blue-800" title={apt.diagnosis}>
                      {apt.diagnosis}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">--</span>
                  )}
                </td>
                
                {/* 🌟 دالة الحالة الشاملة والذكية 🌟 */}
                <td className="py-4 px-6 text-center">
                  {(() => {
                    const status = apt.rawStatus;
                    const isPaid = apt.payment_status === 'paid';
                    
                    if (status === 'مكتملة' || status === 'completed') {
                      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700"><CheckCircle size={14} /> مكتملة</span>;
                    }
                    if (status === 'ملغاة' || status === 'cancelled') {
                      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-bold border border-red-100 dark:border-red-800"><CalendarX size={14} /> ملغي</span>;
                    }
                    if (status === 'فائتة' || status === 'missed') {
                      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-bold border border-red-100 dark:border-red-800"><CalendarX size={14} /> فائتة</span>;
                    }
                    if ((status === 'مؤكدة' || status === 'confirmed') && isPaid) {
                      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800"><CheckCircle size={14} /> مدفوع ومؤكد</span>;
                    }
                    if ((status === 'مؤكدة' || status === 'confirmed') && !isPaid) {
                      // 🌟 التعديل هنا: خلينا النص "مؤكدة" وغيرنا اللون لأزرق شيك
                      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800"><CheckCircle size={14} /> مؤكدة</span>;
                    }
                    if ((status === 'قيد الانتظار' || status === 'scheduled' || !status) && isPaid) {
                      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800"><Clock size={14} /> مدفوع - بانتظار التأكيد</span>;
                    }
                    
                    return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs font-bold border border-orange-100 dark:border-orange-800"><Clock size={14} /> بانتظار التأكيد والدفع</span>;
                  })()}
                </td>
                
                {/* الإجراءات */}
                <td className="py-4 px-6 relative">
                  <div className="flex items-center justify-center gap-2">
                    
                    {/* زرار التأكيد المبدئي يظهر بس لو الجلسة لسة قيد الانتظار */}
                    {(apt.rawStatus === 'قيد الانتظار' || apt.rawStatus === 'scheduled') && (
                      <button 
                        onClick={() => onConfirmCall(apt)} 
                        className="text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-600 p-2 rounded-xl transition-colors shadow-sm border border-emerald-100 dark:border-emerald-800" 
                        title="تأكيد مبدئي للموعد"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}

                    <button onClick={() => onRemind(apt)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-xl transition-colors border border-blue-100 dark:border-blue-800" title="إرسال إشعار للمراجع">
                      <Mail size={18} />
                    </button>
                    
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === apt.id ? null : apt.id)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 transition-colors relative z-10">
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === apt.id && (
                        <div className="absolute left-full top-0 ml-2 w-36 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-2xl py-2 z-20 flex flex-col animate-fade-in">
                          <button onClick={() => { onEdit(apt); setOpenMenuId(null); }} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-right transition-colors"><Edit size={16} className="text-blue-500"/> تعديل الموعد</button>
                          <button onClick={() => { onDelete(apt.id); setOpenMenuId(null); }} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 w-full text-right transition-colors"><Trash2 size={16} /> إلغاء الحجز</button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};