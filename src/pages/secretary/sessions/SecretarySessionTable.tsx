import React from 'react';
import { FileText, Trash2, CheckCircle, Clock, MapPin, Video, PhoneCall, CalendarX } from 'lucide-react';

export const SecretarySessionTable = ({ sessions, loading, onOpenDetails, onForceDelete }: any) => {
  const getModeIcon = (mode: string) => {
    if (!mode) return <MapPin size={14} className="text-emerald-500" />;
    if (mode.includes('فيديو') || mode.includes('أونلاين')) return <Video size={14} className="text-purple-500" />;
    if (mode.includes('صوتية') || mode.includes('مكالمة')) return <PhoneCall size={14} className="text-blue-500" />;
    return <MapPin size={14} className="text-emerald-500" />;
  };

  return (
    <div className="overflow-x-auto min-h-[300px] font-sans">
      <table className="w-full text-right whitespace-nowrap">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="py-4 px-6 font-black text-gray-700 text-sm">المريض</th>
            <th className="py-4 px-6 font-black text-gray-700 text-sm">الطبيب المعالج</th>
            <th className="py-4 px-6 font-black text-gray-700 text-sm">الموعد</th>
            <th className="py-4 px-6 font-black text-gray-700 text-sm text-center">النوع / المكان</th>
            <th className="py-4 px-6 font-black text-gray-700 text-sm text-center">الحالة</th>
            <th className="py-4 px-6 font-black text-gray-700 text-sm text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-10 text-center text-gray-500 font-bold">جاري تحميل الجلسات...</td></tr>
          ) : sessions.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <CalendarX size={48} className="mb-4 opacity-30" />
                  <p className="font-bold text-lg text-gray-500">لا توجد جلسات مؤكدة ومدفوعة لليوم</p>
                </div>
              </td>
            </tr>
          ) : (
            sessions.map((session: any) => (
              <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                
                <td className="py-4 px-6">
                  <div className="font-black text-gray-900">{session.patient?.name || '---'}</div>
                  <div className="text-xs font-bold text-gray-500">{session.patient?.phone || '---'}</div>
                </td>

                <td className="py-4 px-6">
                  <div className="font-black text-[#00838F]">د. {session.doctor?.name || '---'}</div>
                </td>
                
                <td className="py-4 px-6">
                  <div className="font-bold text-gray-800 text-sm">{new Date(session.session_date).toLocaleDateString('ar-EG')}</div>
                  <div className="text-xs font-black text-[#00838F] mt-1" dir="ltr">
                    {new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                
                <td className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                      {session.session_type || 'كشف'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                      {getModeIcon(session.mode)} {session.mode || 'حضور بالعيادة'}
                    </span>
                  </div>
                </td>
                
                <td className="py-4 px-6 text-center">
                  {session.status === 'مكتملة' || session.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100"><CheckCircle size={14} /> مكتملة</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100"><Clock size={14} /> مؤكدة وجاهزة</span>
                  )}
                </td>
                
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onOpenDetails(session)} className="text-cyan-600 hover:bg-cyan-50 p-2 rounded-xl transition-colors" title="عرض التفاصيل والتقارير">
                      <FileText size={18} />
                    </button>
                    <button onClick={() => onForceDelete(session.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors" title="إلغاء ومسح الجلسة">
                      <Trash2 size={18} />
                    </button>
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