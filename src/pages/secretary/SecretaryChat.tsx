import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Loader2, MessageSquare, Paperclip } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const SecretaryChat: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. جلب بيانات السكرتير والدكاترة اللي معاه في نفس المركز
  useEffect(() => {
    const initChat = async () => {
      setLoadingDoctors(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // نجيب الـ admin_id بتاع السكرتير الحالي
          const { data: secData } = await supabase
            .from('secretaries')
            .select('admin_id')
            .eq('id', user.id)
            .single();

          if (secData?.admin_id) {
            // نجيب كل الدكاترة اللي تبع نفس المركز ده
            const { data: docs } = await supabase
              .from('doctors')
              .select('*')
              .eq('admin_id', secData.admin_id);
              
            setDoctors(docs || []);
          }
        }
      } catch (error) {
        console.error("Error fetching doctors for chat:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    initChat();
  }, []);

  // 2. جلب رسائل الدكتور المحدد + تفعيل الـ Realtime
  useEffect(() => {
    if (!currentUserId || !selectedDoctor) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedDoctor.id}),and(sender_id.eq.${selectedDoctor.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
        
      setMessages(data || []);
      setLoadingMessages(false);
      scrollToBottom();
    };

    fetchMessages();

    // 🌟 تفعيل الـ Realtime
    const channel = supabase
      .channel('realtime_secretary_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        if (
          (newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedDoctor.id) ||
          (newMsg.sender_id === selectedDoctor.id && newMsg.receiver_id === currentUserId)
        ) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedDoctor]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !selectedDoctor) return;

    const msgContent = newMessage.trim();
    setNewMessage(''); 

    const { error } = await supabase.from('messages').insert([{
      sender_id: currentUserId,
      receiver_id: selectedDoctor.id,
      content: msgContent,
      message_type: 'text' 
    }]);

    if (error) console.error("Error sending message:", error);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`تم تحديد الملف: ${file.name}\n(سيتم تفعيل رفع الملفات قريباً)`);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in font-sans p-8 bg-gray-50/50 dark:bg-gray-950" dir="rtl">
      
      {/* 🌟 القائمة الجانبية (الأطباء) */}
      <div className="w-1/3 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-xl font-black text-[#00838F] dark:text-cyan-400 mb-4">مراسلة أطباء المركز</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث عن طبيب..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 text-sm font-bold transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loadingDoctors ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#00838F]" size={30} /></div>
          ) : filteredDoctors.length === 0 ? (
            <p className="text-center py-10 text-gray-400 font-bold text-sm">لا يوجد أطباء مسجلين في المركز.</p>
          ) : (
            filteredDoctors.map(doctor => (
              <button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all outline-none text-right ${
                  selectedDoctor?.id === doctor.id 
                    ? 'bg-[#E0F7FA] dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#00838F] text-white flex items-center justify-center font-black shrink-0 shadow-sm overflow-hidden border border-cyan-100 dark:border-cyan-800">
                  {doctor.avatar_url || doctor.image ? (
                    <img src={doctor.avatar_url || doctor.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    'د'
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className={`font-black truncate ${selectedDoctor?.id === doctor.id ? 'text-[#00838F] dark:text-cyan-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    د. {doctor.name || doctor.full_name}
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
        {selectedDoctor ? (
          <>
            {/* 🌟 هيدر الشات */}
            <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-4 shadow-sm z-10">
              <div className="w-12 h-12 rounded-full bg-[#00838F] text-white flex items-center justify-center font-black shadow-sm overflow-hidden border-2 border-cyan-100 dark:border-cyan-900">
                {selectedDoctor.avatar_url || selectedDoctor.image ? (
                  <img src={selectedDoctor.avatar_url || selectedDoctor.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  'د'
                )}
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">د. {selectedDoctor.name || selectedDoctor.full_name}</h3>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> اتصال داخلي
                </span>
              </div>
            </div>

            {/* 🌟 مساحة الرسائل */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-gray-900">
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
                    const isMe = msg.sender_id === currentUserId;
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

            {/* 🌟 حقل الإدخال */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-400 hover:text-[#00838F] hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl transition-colors shrink-0"
                  title="إرفاق ملف أو صورة"
                >
                  <Paperclip size={22} />
                </button>

                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك للطبيب هنا..." 
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#00838F] focus:ring-2 focus:ring-cyan-500/10 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-[#00838F] hover:bg-[#006064] disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Send size={18} className="mr-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-800 shadow-sm">
              <User size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="font-black text-xl text-gray-800 dark:text-white mb-2">اختر طبيباً</h3>
            <p className="text-sm font-bold">قم باختيار طبيب من القائمة الجانبية للبدء في المراسلة الداخلية.</p>
          </div>
        )}
      </div>

    </div>
  );
};