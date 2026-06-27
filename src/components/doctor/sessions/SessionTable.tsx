import React from 'react';
import { Calendar, Clock, Eye, Trash2, Video, Mail, MapPin, Play, UserX, Phone, Edit } from 'lucide-react';

export const SessionTable = ({ sessions, loading, onOpenDetails, onForceDelete, onEdit, onJoinRoom, onRemind, onMarkMissed }: any) => {
  const formatDate = (isoString: string) => {
    if (!isoString) return { date: '', time: '' };
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-b-[2rem] font-sans pb-10">
      <table className="w-full text-right whitespace-nowrap">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th className="py-5 px-6 font-black text-gray-700 dark:text-gray-300 text-sm">اسم المريض</th>
            <th className="py-5 px-6 font-black text-gray-700 dark:text-gray-300 text-sm">الوقت والتاريخ</th>
            <th className="py-5 px-6 font-black text-gray-700 dark:text-gray-300 text-sm">نوع الجلسة</th>
            <th className="py-5 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">الحالة</th>
            <th className="py-5 px-6 font-black text-gray-700 dark:text-gray-300 text-sm text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="text-center py-12 font-bold text-gray-500 dark:text-gray-400">جاري تحميل الجلسات...</td></tr>
          ) : sessions.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-12 font-bold text-gray-500 dark:text-gray-400">لا توجد مواعيد مؤكدة حالياً.</td></tr>
          ) : (
            sessions.map((session: any) => {
              const { date, time } = formatDate(session.session_date);
              
              const sessionTime = new Date(session.session_date).getTime();
              const now = new Date().getTime();
              
              // 🌟 اللوجيك الزمني بالدقائق: البدء يفتح قبلها بـ 5 دقائق، الغياب يفتح أول ما ميعادها ييجي بالظبط
              const isTimeReadyToStart = now >= (sessionTime - 5 * 60 * 1000) && now <= (sessionTime + 60 * 60 * 1000);
              const isTimeReadyForMissed = now >= sessionTime; 

              const sessionModeStr = session.mode || session.session_type || '';
              const isVideo = sessionModeStr.includes('فيديو') || sessionModeStr.includes('أونلاين');
              const isAudio = sessionModeStr.includes('صوت') || sessionModeStr.includes('مكالمة');
              const isClinicAttendance = !isVideo && !isAudio; 

              const isConfirmed = session.status === 'مؤكدة' || session.status === 'confirmed';
              const isCompleted = session.status === 'مكتملة' || session.status === 'completed';
              const isMissed = session.status === 'فائتة' || session.status === 'missed';

              const isWaitingForTime = isConfirmed && !isTimeReadyToStart;

              return (
                <tr key={session.id} className="border-b last:border-0 border-gray-50 dark:border-gray-800 hover:bg-[#FBF9F6] dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-black text-gray-900 dark:text-white mb-1">{session.patient?.name || session.patientName || 'غير معروف'}</div>
                    <div className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">ID: {(session.patient?.id || session.patient_id)?.slice(0,8)}</div>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-600 dark:text-gray-300">
                    <div className="flex flex-col gap-1.5">
                      <span className="flex items-center gap-1.5"><Calendar size={14} className={isMissed ? "text-red-500" : "text-[#00838F]"} /> <span className={isMissed ? "text-red-500" : ""}>{date}</span></span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className={isMissed ? "text-red-500" : "text-[#00838F]"} /> <span className={isMissed ? "text-red-500" : ""}>{time}</span></span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-800 dark:text-gray-200">
                    {isClinicAttendance ? (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs w-max ${isMissed ? 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/30 dark:border-red-800' : 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800'}`}><MapPin size={14} /> حضور بالعيادة</span>
                    ) : isAudio ? (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs w-max ${isMissed ? 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/30 dark:border-red-800' : 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/30 dark:border-purple-800'}`}><Phone size={14} /> استشارة صوتية</span>
                    ) : (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs w-max ${isMissed ? 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/30 dark:border-red-800' : 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800'}`}><Video size={14} /> استشارة فيديو</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' : isMissed ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-800' : 'bg-[#E0F7FA] text-[#00838F] border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {isConfirmed ? 'مؤكدة ومجدولة' : isMissed ? 'جلسة فائتة (غياب)' : 'مكتملة'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      {isConfirmed && isTimeReadyToStart && (isVideo || isAudio) && (
                        <button onClick={() => onJoinRoom(session)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl font-black text-xs shadow-md shadow-red-500/30 animate-pulse hover:scale-105"><Video size={14} /> بدء الجلسة</button>
                      )}
                      {isConfirmed && isTimeReadyToStart && isClinicAttendance && (
                        <button onClick={() => onJoinRoom(session)} className="flex items-center gap-1.5 bg-[#00838F] hover:bg-[#006064] text-white px-3 py-2 rounded-xl font-black text-xs shadow-md shadow-cyan-500/30 hover:scale-105"><Play size={14} /> بدء الجلسة</button>
                      )}
                      {isWaitingForTime && (
                        <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-3 py-2 rounded-xl font-bold text-xs border border-gray-200 dark:border-gray-700 cursor-not-allowed"><Clock size={14} /> لم يحن الموعد</span>
                      )}
                      
                      {/* 🌟 زرار الغياب يفتح أول ما وقت الجلسة ييجي بالظبط */}
                      {isConfirmed && isTimeReadyForMissed && (
                        <button onClick={() => onMarkMissed(session)} className="text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-900/30 dark:hover:bg-red-600 p-2 rounded-xl transition-all shadow-sm border border-red-100 dark:border-red-800" title="تسجيل غياب المريض"><UserX size={16} /></button>
                      )}
                      
                      {(isCompleted || isMissed) && (
                        <button onClick={() => onOpenDetails(session)} className={`p-2 rounded-xl transition-colors ${isMissed ? 'text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-900/30 dark:hover:bg-red-600' : 'text-[#00838F] hover:text-white bg-cyan-50 hover:bg-[#00838F] dark:bg-cyan-900/30 dark:hover:bg-[#00838F]'}`} title={isMissed ? "عرض الإنذار" : "عرض الروشتة"}><Eye size={16} /></button>
                      )}
                      
                      {isConfirmed && (
                        <>
                          <button onClick={() => onEdit(session)} className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-800 p-2 rounded-xl transition-colors border border-amber-100 dark:border-amber-800" title="تعديل الموعد"><Edit size={16} /></button>
                          <button onClick={() => onRemind(session)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800 p-2 rounded-xl transition-colors border border-blue-100 dark:border-blue-800" title="إرسال تذكير"><Mail size={16} /></button>
                        </>
                      )}
                      
                      <button onClick={() => onForceDelete(session.id)} className="text-red-500 hover:text-white bg-red-50 hover:bg-red-500 dark:bg-red-900/30 dark:hover:bg-red-600 p-2 rounded-xl transition-colors border border-red-100 dark:border-red-800" title="مسح الجلسة نهائياً"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  );
};