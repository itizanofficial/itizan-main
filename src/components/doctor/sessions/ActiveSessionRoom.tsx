import React, { useState, useEffect } from 'react';
import { PhoneOff, FileText, Info, Clock, AlertTriangle, User, MapPin, Mic } from 'lucide-react';

export const ActiveSessionRoom = ({ session, onLeave, onSaveNotes }: any) => {
  const [liveNotes, setLiveNotes] = useState({ 
    symptoms: '', goals: '', interventions: '', homework: '', extraNotes: '', patientNotes: '' 
  });

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 اللوجيك الذكي للتعرف على نوع الجلسة بدقة
  const modeStr = session.mode || session.session_type || '';
  const isAudio = modeStr.includes('صوت') || modeStr.includes('مكالمة');
  const isVideo = modeStr.includes('فيديو') || modeStr.includes('مرئية') || modeStr.includes('Online');
  const isOnlineType = isVideo || isAudio;

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const roomName = `Etizan_Clinic_${session.id.replace(/-/g, '')}`;

  const executeEndSession = async () => {
    setIsSaving(true);
    const finalTime = formatTime(secondsElapsed);
    await onSaveNotes(session.id, { ...liveNotes, actualDuration: finalTime });
    setIsSaving(false);
    setShowConfirmDialog(false);
  };

  // 🌟 تجهيز رابط Jitsi (لو صوتية بنقفل الكاميرا إجبارياً من السيرفر)
  let jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.requireDisplayName=false&userInfo.displayName="الطبيب المعالج"`;
  if (isAudio) {
    jitsiUrl += `&config.startAudioOnly=true&config.startWithVideoMuted=true`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-900 rounded-[2rem] p-6 text-white min-h-[650px] animate-fade-in border border-gray-800 shadow-2xl font-sans relative">
      
      {/* مودال تأكيد الحفظ والإنهاء */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4 text-white">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className="text-lg font-bold">إنهاء وتوثيق الجلسة؟</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 font-medium leading-relaxed">
              مدة الجلسة الفعلية المستغرقة: <span className="text-white font-bold">{formatTime(secondsElapsed)} دقيقة</span>. سيتم حفظ البيانات وإرسال الروشتة فوراً للمريض.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmDialog(false)} disabled={isSaving} className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl text-sm font-bold transition-colors">تراجع</button>
              <button onClick={executeEndSession} disabled={isSaving} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                {isSaving ? 'جاري الاعتماد...' : 'إنهاء وتوثيق الجلسة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* الجزء الخاص بمكالمة الفيديو/الصوت أو مساحة العيادة الحضورية */}
      <div className="lg:col-span-7 flex flex-col justify-between h-full bg-black rounded-[1.5rem] overflow-hidden border border-gray-700 relative min-h-[400px]">
        
        {isOnlineType ? (
          <>
            {/* التايمر للجلسات الأونلاين */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              {isAudio ? <Mic size={16} className="text-gray-300" /> : <Clock size={16} className="text-gray-300" />}
              <span className="font-mono font-bold text-white tracking-widest">{formatTime(secondsElapsed)}</span>
            </div>

            <iframe
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          </>
        ) : (
          /* 🌟 إذا كانت الجلسة حضورية بالعيادة: نعرض واجهة شيك والتايمر شغال لايف قدام الدكتور */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-950 to-gray-900 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#00838F]/10 border border-[#00838F]/30 flex items-center justify-center text-[#00838F] mb-2 animate-pulse">
              <User size={40} />
            </div>
            <h3 className="text-xl font-black text-white">جلسة حضورية قائمة بالعيادة</h3>
            <p className="text-gray-400 text-sm max-w-xs font-bold">المريض: {session.patient?.name || 'غير مسجل'}</p>
            
            {/* 🌟 التايمر اللايف لجلسات الحضور */}
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/20 font-bold mt-2">
              <Clock size={16} className="animate-pulse" /> 
              <span className="font-mono tracking-widest">وقت الجلسة المستغرق: {formatTime(secondsElapsed)}</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
          <button 
            onClick={() => setShowConfirmDialog(true)} 
            className="pointer-events-auto bg-red-600/90 backdrop-blur-md hover:bg-red-600 px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-500/50 hover:scale-105"
          >
            <PhoneOff size={20} /> إنهاء الجلسة وحفظ التقرير
          </button>
        </div>
      </div>
      
      {/* لوحة التقارير والملاحظات (5 أعمدة) */}
      <div className="lg:col-span-5 bg-gray-800/80 border border-gray-700 rounded-[1.5rem] p-6 flex flex-col h-full backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-gray-700/80 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <FileText className="text-[#00838F]" size={22} />
            <h3 className="font-black text-lg text-white">روشتة وتقييم الجلسة</h3>
          </div>
          <button onClick={onLeave} className="text-xs font-bold text-gray-400 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-600">
            تصغير النافذة
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mb-2">
              <Info size={14} /> تعليمات وروشتة المريض (تظهر له في التطبيق):
            </label>
            <textarea rows={3} value={liveNotes.patientNotes} onChange={e => setLiveNotes({...liveNotes, patientNotes: e.target.value})} className="w-full bg-black/40 border border-cyan-500/30 rounded-lg p-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none text-sm resize-none placeholder-cyan-500/40 font-medium transition-all" placeholder="اكتب التوجيهات أو العلاج المطلوب من المريض هنا..." />
          </div>

          <div><label className="block text-xs font-bold text-gray-400 mb-2">شكوى المريض والأعراض</label><textarea rows={2} value={liveNotes.symptoms} onChange={e => setLiveNotes({...liveNotes, symptoms: e.target.value})} className="w-full bg-gray-900/80 border border-gray-700 rounded-xl p-3 text-white focus:border-[#00838F] outline-none text-sm resize-none font-medium transition-colors" placeholder="وصف لحالة المريض اليوم..." /></div>
          <div><label className="block text-xs font-bold text-gray-400 mb-2">أهداف الجلسة</label><textarea rows={2} value={liveNotes.goals} onChange={e => setLiveNotes({...liveNotes, goals: e.target.value})} className="w-full bg-gray-900/80 border border-gray-700 rounded-xl p-3 text-white focus:border-[#00838F] outline-none text-sm resize-none font-medium transition-colors" placeholder="النتائج المراد الوصول إليها..." /></div>
          <div><label className="block text-xs font-bold text-gray-400 mb-2">التدخلات الطبية/النفسية</label><textarea rows={2} value={liveNotes.interventions} onChange={e => setLiveNotes({...liveNotes, interventions: e.target.value})} className="w-full bg-gray-900/80 border border-gray-700 rounded-xl p-3 text-white focus:border-[#00838F] outline-none text-sm resize-none font-medium transition-colors" placeholder="التقنيات المستخدمة..." /></div>
          <div><label className="block text-xs font-bold text-gray-400 mb-2">ملاحظات الطبيب الخاصة (سرية)</label><textarea rows={2} value={liveNotes.extraNotes} onChange={e => setLiveNotes({...liveNotes, extraNotes: e.target.value})} className="w-full bg-gray-900/80 border border-gray-700 rounded-xl p-3 text-white focus:border-[#00838F] outline-none text-sm resize-none font-medium transition-colors" placeholder="ملاحظات سرية للعيادة فقط..." /></div>
        </div>
      </div>
    </div>
  );
};