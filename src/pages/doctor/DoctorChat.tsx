import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Loader2, MessageSquare, Paperclip, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const DoctorChat: React.FC = () => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]); // 🌟 المراجعين + السكرتارية
  const [selectedContact, setSelectedContact] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. جلب بيانات السكرتير والمرضى
  useEffect(() => {
    const initChat = async () => {
      setLoadingContacts(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDoctorId(user.id);
        
        // 🌟 هنجيب بيانات الدكتور عشان نعرف هو تبع انهي admin_id
        const { data: docData } = await supabase.from('doctors').select('admin_id').eq('id', user.id).single();
        
        let secretaryList: any[] = [];
        if (docData?.admin_id) {
          // هنجيب السكرتارية اللي شغالين تحت نفس الآدمن
          const { data: secs } = await supabase.from('secretaries').select('*').eq('admin_id', docData.admin_id);
          secretaryList = (secs || []).map(s => ({ ...s, role: 'secretary', displayName: s.name || s.full_name || 'سكرتير العيادة' }));
        }

        // هنجيب مرضى الدكتور
        const { data: pats } = await supabase.from('patients').select('*').eq('doctor_id', user.id);
        const patientList = (pats || []).map(p => ({ ...p, role: 'patient', displayName: p.name || p.full_name }));

        // دمج السكرتارية والمرضى (السكرتير الأول)
        setContacts([...secretaryList, ...patientList]);
      }
      setLoadingContacts(false);
    };
    initChat();
  }, []);

  // 2. جلب الرسائل
  useEffect(() => {
    if (!doctorId || !selectedContact) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${doctorId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${doctorId})`)
        .order('created_at', { ascending: true });
        
      setMessages(data || []);
      setLoadingMessages(false);
      scrollToBottom();
    };

    fetchMessages();

    const channel = supabase
      .channel('doctor_realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        if (
          (newMsg.sender_id === doctorId && newMsg.receiver_id === selectedContact.id) ||
          (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === doctorId)
        ) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [doctorId, selectedContact]);

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !doctorId || !selectedContact) return;

    const msgContent = newMessage.trim();
    setNewMessage(''); 

    const { error } = await supabase.from('messages').insert([{
      sender_id: doctorId,
      receiver_id: selectedContact.id,
      content: msgContent,
      message_type: 'text' 
    }]);

    if (error) console.error("Error sending message:", error);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) alert(`تم تحديد الملف: ${file.name}\n(سيتم تفعيل رفع الملفات للعملاء قريباً)`);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in font-sans" dir="rtl">
      
      {/* 🌟 القائمة الجانبية */}
      <div className="w-1/3 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">الرسائل والمحادثات</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث..." 
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-10 py-3 outline-none focus:border-[#00838F] focus:ring-4 focus:ring-cyan-500/10 text-sm font-bold transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loadingContacts ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#00838F]" size={30} /></div>
          ) : contacts.length === 0 ? (
            <p className="text-center py-10 text-gray-400 font-bold text-sm">لا توجد جهات اتصال مسجلة.</p>
          ) : (
            contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all outline-none text-right ${
                  selectedContact?.id === contact.id 
                    ? 'bg-[#E0F7FA] dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black shrink-0 shadow-sm overflow-hidden border ${contact.role === 'secretary' ? 'bg-orange-500 text-white border-orange-200' : 'bg-[#00838F] text-white border-cyan-100 dark:border-cyan-800'}`}>
                  {contact.avatar_url || contact.image ? (
                    <img src={contact.avatar_url || contact.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    contact.role === 'secretary' ? <ShieldCheck size={20} /> : contact.displayName?.charAt(0) || 'م'
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className={`font-black truncate ${selectedContact?.id === contact.id ? 'text-[#00838F] dark:text-cyan-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {contact.displayName}
                  </h3>
                  {/* 🌟 تمييز السكرتير */}
                  {contact.role === 'secretary' ? (
                     <p className="text-xs font-black text-orange-500 truncate mt-1">سكرتارية المركز 👑</p>
                  ) : (
                     <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate mt-1">مراجع (مريض)</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 🌟 شاشة المحادثة */}
      <div className="w-2/3 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        {selectedContact ? (
          <>
            <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-4 shadow-sm z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black shadow-sm overflow-hidden border-2 ${selectedContact.role === 'secretary' ? 'bg-orange-500 text-white border-orange-200' : 'bg-[#00838F] text-white border-cyan-100 dark:border-cyan-900'}`}>
                {selectedContact.avatar_url || selectedContact.image ? (
                  <img src={selectedContact.avatar_url || selectedContact.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  selectedContact.role === 'secretary' ? <ShieldCheck size={20} /> : selectedContact.displayName?.charAt(0) || 'م'
                )}
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">{selectedContact.displayName}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1 ${selectedContact.role === 'secretary' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${selectedContact.role === 'secretary' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span> محادثة نشطة
                </span>
              </div>
            </div>

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

            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-[#00838F] hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl transition-colors shrink-0" title="إرفاق ملف أو صورة">
                  <Paperclip size={22} />
                </button>
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالتك هنا..." className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#00838F] focus:ring-2 focus:ring-cyan-500/10 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-inner" />
                <button type="submit" disabled={!newMessage.trim()} className="bg-[#00838F] hover:bg-[#006064] disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0">
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
            <h3 className="font-black text-xl text-gray-800 dark:text-white mb-2">اختر محادثة</h3>
            <p className="text-sm font-bold">قم باختيار السكرتير أو المراجع من القائمة للبدء.</p>
          </div>
        )}
      </div>

    </div>
  );
};