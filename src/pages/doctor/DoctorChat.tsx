import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const DoctorChat: React.FC = () => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. جلب بيانات الدكتور والمرضى بتوعه بس
  useEffect(() => {
    const initChat = async () => {
      setLoadingPatients(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDoctorId(user.id);
        const { data } = await supabase.from('patients').select('*').eq('doctor_id', user.id);
        setPatients(data || []);
      }
      setLoadingPatients(false);
    };
    initChat();
  }, []);

  // 2. جلب رسائل المريض المحدد + تفعيل الـ Realtime
  useEffect(() => {
    if (!doctorId || !selectedPatient) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${doctorId},receiver_id.eq.${selectedPatient.id}),and(sender_id.eq.${selectedPatient.id},receiver_id.eq.${doctorId})`)
        .order('created_at', { ascending: true });
        
      setMessages(data || []);
      setLoadingMessages(false);
      scrollToBottom();
    };

    fetchMessages();

    // 🌟 تفعيل الـ Realtime عشان نستقبل الرسايل لايف
    const channel = supabase
      .channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        // نتأكد إن الرسالة دي تخص المحادثة المفتوحة حالياً
        if (
          (newMsg.sender_id === doctorId && newMsg.receiver_id === selectedPatient.id) ||
          (newMsg.sender_id === selectedPatient.id && newMsg.receiver_id === doctorId)
        ) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, selectedPatient]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !doctorId || !selectedPatient) return;

    const msgContent = newMessage.trim();
    setNewMessage(''); // تفريغ الحقل فوراً لسرعة الـ UI

    // 🌟 التعديل السحري هنا: ضفنا message_type عشان يتوافق مع الموبايل
    const { error } = await supabase.from('messages').insert([{
      sender_id: doctorId,
      receiver_id: selectedPatient.id,
      content: msgContent,
      message_type: 'text' 
    }]);

    if (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in font-sans" dir="rtl">
      
      {/* 🌟 القائمة الجانبية (المراجعين) */}
      <div className="w-1/3 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">الرسائل والاستشارات</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث عن مراجع..." 
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 text-sm font-bold transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loadingPatients ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#00838F]" size={30} /></div>
          ) : patients.length === 0 ? (
            <p className="text-center py-10 text-gray-400 font-bold text-sm">لا يوجد مراجعين مسجلين.</p>
          ) : (
            patients.map(patient => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all outline-none text-right ${
                  selectedPatient?.id === patient.id 
                    ? 'bg-[#E0F7FA] dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#00838F] text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                  {patient.name?.charAt(0) || 'م'}
                </div>
                <div className="overflow-hidden">
                  <h3 className={`font-black truncate ${selectedPatient?.id === patient.id ? 'text-[#00838F] dark:text-cyan-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {patient.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate mt-1">اضغط لفتح المراسلة</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 🌟 شاشة المحادثة */}
      <div className="w-2/3 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        {selectedPatient ? (
          <>
            {/* هيدر الشات */}
            <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-4 shadow-sm z-10">
              <div className="w-12 h-12 rounded-full bg-[#00838F] text-white flex items-center justify-center font-black shadow-sm">
                {selectedPatient.name?.charAt(0) || 'م'}
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">{selectedPatient.name}</h3>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">محادثة نشطة</span>
              </div>
            </div>

            {/* مساحة الرسائل */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[url('https://i.ibb.co/3s1fK0z/chat-bg.png')] dark:bg-[url('https://i.ibb.co/6PZK93w/chat-bg-dark.png')] bg-repeat bg-opacity-5">
              {loadingMessages ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#00838F]" size={30} /></div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 opacity-70">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="font-bold">لا توجد رسائل سابقة. ابدأ المحادثة الآن.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === doctorId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] p-4 rounded-2xl text-sm font-bold shadow-sm ${
                          isMe 
                            ? 'bg-[#00838F] text-white rounded-tr-none' 
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                        }`}>
                          {msg.content}
                          <div className={`text-[10px] mt-2 text-right ${isMe ? 'text-cyan-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* حقل الإدخال */}
            <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك للمراجع هنا..." 
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-[#00838F] hover:bg-[#006064] disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Send size={20} className="mr-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900">
            <User size={60} className="mb-4 opacity-50" />
            <p className="font-bold text-lg">اختر مراجعاً من القائمة لبدء الاستشارة النصية.</p>
          </div>
        )}
      </div>

    </div>
  );
};