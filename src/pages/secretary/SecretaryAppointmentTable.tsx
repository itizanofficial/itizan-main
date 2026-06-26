import React, { useState } from 'react';
import { Mail, MoreVertical, Edit, Trash2, CheckCircle, Clock, CalendarX, DollarSign, Loader2 } from 'lucide-react';

export const SecretaryAppointmentTable = ({ appointments, onEdit, onDelete, onRemind, onConfirmPayment, actionLoading }: any) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto min-h-[300px] relative pb-20 font-sans">
      {openMenuId && <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)}></div>}

      <table className="w-full text-right whitespace-nowrap">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm">المريض</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm">الطبيب المعالج</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm">تاريخ ووقت الجلسة</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">النوع والرسوم</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">الماليات والحالة</th>
            <th className="py-4 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <CalendarX size={48} className="mb-4 opacity-30" />
                  <p className="font-bold text-lg text-gray-500">لا توجد حجوزات لعرضها</p>
                </div>
              </td>
            </tr>
          ) : (
            appointments.map((apt: any) => (
              <tr key={apt.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#FBF9F6] transition-colors">
                
                <td className="py-4 px-6">
                  <div className="font-black text-gray-900 mb-1">{apt.patientName}</div>
                  <div className="text-xs font-bold text-gray-500" dir="ltr">{apt.phone || '--'}</div>
                </td>

                <td className="py-4 px-6">
                  <div className="font-black text-[#00838F]">د. {apt.doctorName}</div>
                </td>
                
                <td className="py-4 px-6 font-bold text-gray-800 text-sm">
                  <div className="text-sm">{apt.date}</div>
                  <div className="text-xs font-black text-[#00838F] mt-1" dir="ltr">{apt.time}</div>
                </td>
                
                <td className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                      {apt.session_type || 'كشف'}
                    </span>
                    <span className="font-black text-emerald-600">{apt.fees || 0} ج.م</span>
                  </div>
                </td>
                
                <td className="py-4 px-6 text-center">
                  {apt.payment_status === 'paid' ? (
                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                       <CheckCircle size={14} /> مدفوع ومؤكد
                     </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100">
                       <Clock size={14} /> بانتظار الدفع
                     </span>
                  )}
                </td>
                
                <td className="py-4 px-6 relative">
                  <div className="flex items-center justify-center gap-2">
                    
                    {apt.payment_status !== 'paid' && (
                      <button 
                        onClick={() => onConfirmPayment(apt.id)} 
                        disabled={actionLoading === apt.id}
                        className="text-white bg-emerald-500 hover:bg-emerald-600 p-2 rounded-xl transition-colors shadow-sm font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                        title="تحصيل الرسوم وتأكيد الجلسة"
                      >
                        {actionLoading === apt.id ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                        دفع
                      </button>
                    )}

                    <button onClick={() => onRemind(apt)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-colors border border-blue-100" title="إرسال تذكير للمريض">
                      <Mail size={18} />
                    </button>
                    
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === apt.id ? null : apt.id)} className="text-gray-400 hover:text-gray-900 p-2 transition-colors relative z-10">
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === apt.id && (
                        <div className="absolute left-full top-0 ml-2 w-36 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 z-20 flex flex-col animate-fade-in">
                          <button onClick={() => { onEdit(apt); setOpenMenuId(null); }} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 w-full text-right transition-colors"><Edit size={16} className="text-blue-500"/> تعديل الموعد</button>
                          <button onClick={() => { onDelete(apt.id); setOpenMenuId(null); }} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 w-full text-right transition-colors"><Trash2 size={16} /> إلغاء الحجز</button>
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