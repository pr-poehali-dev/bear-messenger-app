import { useState } from "react";
import Icon from "@/components/ui/icon";

const BEAR_LOGO = "https://cdn.poehali.dev/projects/cbbdfdb6-95d2-4661-a47f-6dc876d18b71/files/3399efb5-ecb7-4404-84d4-d93a2f8ae9cb.jpg";

// ---- Mock Data ----
const contacts = [
  { id: 1, name: "Алексей Громов", avatar: "АГ", status: "online", lastSeen: "сейчас", color: "#4FACFE" },
  { id: 2, name: "Маша Котова", avatar: "МК", status: "online", lastSeen: "сейчас", color: "#A855F7" },
  { id: 3, name: "Дмитрий Волков", avatar: "ДВ", status: "away", lastSeen: "5 мин назад", color: "#EC4899" },
  { id: 4, name: "Соня Белова", avatar: "СБ", status: "online", lastSeen: "сейчас", color: "#22C55E" },
  { id: 5, name: "Иван Зайцев", avatar: "ИЗ", status: "offline", lastSeen: "вчера", color: "#F59E0B" },
  { id: 6, name: "Катя Лисова", avatar: "КЛ", status: "offline", lastSeen: "2 дня назад", color: "#FF6B35" },
];

const chatsData = [
  {
    id: 1, contactId: 1, unread: 3,
    messages: [
      { id: 1, own: false, text: "Привет! Как дела?", time: "10:00" },
      { id: 2, own: true, text: "Всё отлично, спасибо! Как ты?", time: "10:02" },
      { id: 3, own: false, text: "Тоже хорошо! Планируешь на выходные что-то?", time: "10:03" },
      { id: 4, own: true, text: "Да, думаем с друзьями собраться", time: "10:05" },
      { id: 5, own: false, text: "Круто! Возьмёте меня? 😄", time: "10:06" },
      { id: 6, own: false, text: "И кстати, ты уже пробовал новый MishkaChat?", time: "10:07" },
    ],
  },
  {
    id: 2, contactId: 2, unread: 1,
    messages: [
      { id: 1, own: false, text: "Привет! Можешь скинуть файлы?", time: "09:30" },
      { id: 2, own: true, text: "Конечно, сейчас пришлю!", time: "09:31" },
      { id: 3, own: false, text: "Спасибо большое ❤️", time: "09:32" },
    ],
  },
  {
    id: 3, contactId: 3, unread: 0,
    messages: [
      { id: 1, own: false, text: "До встречи завтра!", time: "вчера" },
      { id: 2, own: true, text: "Договорились 👋", time: "вчера" },
    ],
  },
  {
    id: 4, contactId: 4, unread: 7,
    messages: [
      { id: 1, own: false, text: "Смотри какая погода сегодня!", time: "08:15" },
      { id: 2, own: false, text: "Идём гулять?", time: "08:16" },
    ],
  },
];

type Tab = "chats" | "contacts" | "calls" | "profile" | "settings";

const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = { online: "bg-green-500", away: "bg-yellow-500", offline: "bg-gray-500" };
  return <span className={`w-2.5 h-2.5 rounded-full border-2 border-[hsl(224,30%,6%)] ${colors[status] || "bg-gray-500"} inline-block`} />;
};

const Avatar = ({ contact, size = "md" }: { contact: typeof contacts[0]; size?: "sm" | "md" | "lg" }) => {
  const sizes: Record<string, string> = { sm: "w-9 h-9 text-xs", md: "w-11 h-11 text-sm", lg: "w-16 h-16 text-xl" };
  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white`}
        style={{ background: `linear-gradient(135deg, ${contact.color}99, ${contact.color})` }}
      >
        {contact.avatar}
      </div>
      <span className="absolute bottom-0 right-0"><StatusDot status={contact.status} /></span>
    </div>
  );
};

// ---- CHATS TAB ----
const ChatsTab = () => {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [msgText, setMsgText] = useState("");
  const [chats, setChats] = useState(chatsData);

  const activeChatData = chats.find(c => c.id === activeChat);
  const activeContact = activeChatData ? contacts.find(c => c.id === activeChatData.contactId) : null;

  const sendMessage = () => {
    if (!msgText.trim() || !activeChat) return;
    setChats(prev =>
      prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, { id: Date.now(), own: true, text: msgText, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) }] }
          : c
      )
    );
    setMsgText("");
  };

  return (
    <div className="flex h-full">
      {/* Chat list */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-border flex-shrink-0`}>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-muted-foreground" placeholder="Поиск чатов..." />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {chats.map((chat, i) => {
            const contact = contacts.find(c => c.id === chat.contactId)!;
            const lastMsg = chat.messages[chat.messages.length - 1];
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-secondary/50 animate-fade-in ${activeChat === chat.id ? "bg-secondary/70 border-l-2 border-purple-500" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Avatar contact={contact} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{contact.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{lastMsg.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{lastMsg.own ? "Вы: " : ""}{lastMsg.text}</span>
                    {chat.unread > 0 && (
                      <span className="ml-2 min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 animate-notif" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}>
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat window */}
      {activeChat && activeContact ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 p-4 border-b border-border glass">
            <button onClick={() => setActiveChat(null)} className="md:hidden mr-1 text-muted-foreground hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <Avatar contact={activeContact} size="sm" />
            <div className="flex-1">
              <div className="font-semibold">{activeContact.name}</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {activeContact.status === "online" ? "в сети" : activeContact.lastSeen}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-secondary hover:bg-purple-500/20 transition-colors flex items-center justify-center text-muted-foreground hover:text-purple-400">
                <Icon name="Phone" size={18} />
              </button>
              <button className="w-9 h-9 rounded-full bg-secondary hover:bg-blue-500/20 transition-colors flex items-center justify-center text-muted-foreground hover:text-blue-400">
                <Icon name="Video" size={18} />
              </button>
              <button className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-center text-muted-foreground hover:text-white">
                <Icon name="MoreVertical" size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeChatData?.messages.map((msg, i) => (
              <div key={msg.id} className={`flex ${msg.own ? "justify-end" : "justify-start"} animate-fade-in`} style={{ animationDelay: `${i * 30}ms` }}>
                <div className={`max-w-[75%] px-4 py-2.5 ${msg.own ? "msg-own text-white" : "msg-other text-foreground"}`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.own ? "text-white/60 text-right" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-start">
              <div className="msg-other px-4 py-3 flex items-center gap-1">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border glass">
            <div className="flex items-end gap-3">
              <button className="w-9 h-9 flex-shrink-0 rounded-full bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-center text-muted-foreground hover:text-purple-400">
                <Icon name="Paperclip" size={18} />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  className="w-full bg-secondary rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-muted-foreground max-h-32 min-h-[44px]"
                  placeholder="Напишите сообщение..."
                  rows={1}
                />
              </div>
              <button
                onClick={sendMessage}
                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}
              >
                <Icon name="Send" size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4 text-muted-foreground">
          <div className="w-20 h-20 rounded-full overflow-hidden animate-float opacity-50">
            <img src={BEAR_LOGO} alt="MishkaChat" className="w-full h-full object-cover" />
          </div>
          <p className="text-lg font-medium">Выберите чат</p>
          <p className="text-sm">чтобы начать общение</p>
        </div>
      )}
    </div>
  );
};

// ---- CONTACTS TAB ----
const ContactItem = ({ contact, index }: { contact: typeof contacts[0]; index: number }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
    <Avatar contact={contact} size="md" />
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm">{contact.name}</div>
      <div className="text-xs text-muted-foreground">{contact.lastSeen}</div>
    </div>
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="w-8 h-8 rounded-full bg-secondary hover:bg-blue-500/20 transition-colors flex items-center justify-center text-muted-foreground hover:text-blue-400">
        <Icon name="MessageCircle" size={15} />
      </button>
      <button className="w-8 h-8 rounded-full bg-secondary hover:bg-green-500/20 transition-colors flex items-center justify-center text-muted-foreground hover:text-green-400">
        <Icon name="Phone" size={15} />
      </button>
    </div>
  </div>
);

const ContactsTab = () => {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const grouped = {
    online: filtered.filter(c => c.status === "online"),
    away: filtered.filter(c => c.status === "away"),
    offline: filtered.filter(c => c.status === "offline"),
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-muted-foreground" placeholder="Поиск контактов..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="overflow-y-auto flex-1 p-4 space-y-6">
        {grouped.online.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 px-1">В сети — {grouped.online.length}</h3>
            <div className="space-y-2">{grouped.online.map((c, i) => <ContactItem key={c.id} contact={c} index={i} />)}</div>
          </div>
        )}
        {grouped.away.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3 px-1">Недавно — {grouped.away.length}</h3>
            <div className="space-y-2">{grouped.away.map((c, i) => <ContactItem key={c.id} contact={c} index={i} />)}</div>
          </div>
        )}
        {grouped.offline.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Не в сети — {grouped.offline.length}</h3>
            <div className="space-y-2">{grouped.offline.map((c, i) => <ContactItem key={c.id} contact={c} index={i} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- CALLS TAB ----
const CallsTab = () => {
  const [inCall, setInCall] = useState(false);
  const [calling, setCalling] = useState<typeof contacts[0] | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const recentCalls = [
    { contact: contacts[0], type: "incoming", time: "сегодня, 10:00", duration: "5:32" },
    { contact: contacts[1], type: "outgoing", time: "сегодня, 09:15", duration: "2:10" },
    { contact: contacts[2], type: "missed", time: "вчера, 22:30", duration: null },
    { contact: contacts[3], type: "incoming", time: "вчера, 18:00", duration: "15:44" },
  ];

  const startCall = (contact: typeof contacts[0]) => { setCalling(contact); setInCall(true); };
  const endCall = () => { setInCall(false); setCalling(null); setMuted(false); setVideoOff(false); };

  if (inCall && calling) {
    return (
      <div className="flex flex-col h-full items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.2) 0%, rgba(79,172,254,0.1) 50%, transparent 80%)" }} />
        <div className="relative z-10 flex flex-col items-center gap-6 animate-fade-in">
          <div className="relative">
            <div className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${calling.color}99, ${calling.color})` }}>
              {calling.avatar}
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-30" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{calling.name}</h2>
            <p className="text-muted-foreground text-sm">Видеозвонок • 0:42</p>
          </div>
          <div className="w-64 h-40 rounded-2xl flex items-center justify-center text-muted-foreground text-sm border border-border" style={{ background: "hsl(224 25% 9%)" }}>
            {videoOff ? (
              <div className="flex flex-col items-center gap-2"><Icon name="VideoOff" size={32} className="text-muted-foreground" /><span>Камера выключена</span></div>
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-40"><Icon name="Video" size={32} /><span>Видео активно</span></div>
            )}
          </div>
          <div className="flex gap-4">
            {[
              { icon: muted ? "MicOff" : "Mic", label: muted ? "Включить" : "Выкл. mic", action: () => setMuted(!muted), active: muted },
              { icon: videoOff ? "VideoOff" : "Video", label: videoOff ? "Включить" : "Выкл. cam", action: () => setVideoOff(!videoOff), active: videoOff },
              { icon: "Monitor", label: "Экран", action: () => {}, active: false },
            ].map(btn => (
              <button key={btn.icon} onClick={btn.action}
                className={`flex flex-col items-center gap-2 w-16 py-3 rounded-2xl transition-all hover:scale-105 ${btn.active ? "bg-red-500/20 text-red-400" : "bg-secondary text-white"}`}>
                <Icon name={btn.icon as "Mic"} size={22} />
                <span className="text-xs">{btn.label}</span>
              </button>
            ))}
          </div>
          <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-all hover:scale-110 active:scale-95 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <Icon name="PhoneOff" size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border"><h2 className="font-bold text-lg">Звонки</h2></div>
      <div className="p-4 overflow-y-auto flex-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Начать звонок</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {contacts.filter(c => c.status === "online").map((c, i) => (
            <button key={c.id} onClick={() => startCall(c)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}>
              <Avatar contact={c} size="md" />
              <span className="text-xs font-medium truncate w-full text-center">{c.name.split(" ")[0]}</span>
              <div className="flex gap-2">
                <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center"><Icon name="Phone" size={13} /></span>
                <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Icon name="Video" size={13} /></span>
              </div>
            </button>
          ))}
        </div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Недавние</h3>
        <div className="space-y-2">
          {recentCalls.map((call, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <Avatar contact={call.contact} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{call.contact.name}</div>
                <div className="flex items-center gap-1 text-xs">
                  <Icon name={call.type === "incoming" ? "PhoneIncoming" : call.type === "outgoing" ? "PhoneOutgoing" : "PhoneMissed"} size={12}
                    className={call.type === "missed" ? "text-red-400" : call.type === "incoming" ? "text-green-400" : "text-blue-400"} />
                  <span className={call.type === "missed" ? "text-red-400" : "text-muted-foreground"}>{call.time}</span>
                  {call.duration && <span className="text-muted-foreground">• {call.duration}</span>}
                </div>
              </div>
              <button onClick={() => startCall(call.contact)} className="w-9 h-9 rounded-full bg-secondary hover:bg-green-500/20 transition-colors flex items-center justify-center text-muted-foreground hover:text-green-400">
                <Icon name="Video" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- PROFILE TAB ----
const ProfileTab = () => {
  const [status, setStatus] = useState<"online" | "away" | "offline">("online");
  const statusLabels: Record<string, string> = { online: "В сети", away: "Отхожу", offline: "Не беспокоить" };
  const statusColors: Record<string, string> = { online: "text-green-400", away: "text-yellow-400", offline: "text-gray-400" };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="relative h-32 flex-shrink-0" style={{ background: "linear-gradient(135deg, #4FACFE 0%, #A855F7 50%, #EC4899 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundSize: "40px 40px", backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)" }} />
      </div>
      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-background" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}>ЯМ</div>
            <button className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-600 transition-colors">
              <Icon name="Camera" size={12} className="text-white" />
            </button>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}>Редактировать</button>
        </div>
        <div className="space-y-1 mb-5">
          <h2 className="text-xl font-bold">Яков Медведев</h2>
          <p className="text-muted-foreground text-sm">@mishka_user</p>
          <p className="text-sm mt-2">Любитель природы и хорошего общения 🐻</p>
        </div>
        <div className="bg-secondary rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Статус</h3>
          <div className="flex gap-2">
            {(["online", "away", "offline"] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${status === s ? "text-white shadow-lg" : "bg-card text-muted-foreground hover:bg-card/80"}`}
                style={status === s ? { background: "linear-gradient(135deg, #4FACFE, #A855F7)" } : {}}>
                <div className={`mb-1 flex justify-center ${status === s ? "text-white" : statusColors[s]}`}><StatusDot status={s} /></div>
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ label: "Контакты", value: "24" }, { label: "Чаты", value: "12" }, { label: "Звонки", value: "48" }].map(stat => (
            <div key={stat.label} className="bg-secondary rounded-2xl p-3 text-center">
              <div className="text-xl font-bold grad-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-secondary rounded-2xl p-4 space-y-3">
          {[{ icon: "Phone", label: "+7 900 123-45-67" }, { icon: "Mail", label: "mishka@example.com" }, { icon: "MapPin", label: "Москва, Россия" }].map(item => (
            <div key={item.icon} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Icon name={item.icon as "Phone"} size={15} className="text-purple-400" />
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- SETTINGS TAB ----
const SettingsTab = () => {
  const [notifs, setNotifs] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="w-12 h-6 rounded-full relative transition-colors flex-shrink-0" style={value ? { background: "linear-gradient(135deg, #4FACFE, #A855F7)" } : { background: "hsl(224 20% 20%)" }}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-7" : "left-1"}`} />
    </button>
  );

  const sections = [
    { title: "Уведомления", items: [
      { icon: "Bell", label: "Push-уведомления", sub: "Получать уведомления о новых сообщениях", value: notifs, onChange: () => setNotifs(!notifs) },
      { icon: "Volume2", label: "Звуки", sub: "Звуки сообщений и звонков", value: sounds, onChange: () => setSounds(!sounds) },
    ]},
    { title: "Приватность", items: [
      { icon: "CheckCheck", label: "Уведомления о прочтении", sub: "Отправлять галочки о прочтении", value: readReceipts, onChange: () => setReadReceipts(!readReceipts) },
    ]},
    { title: "Внешний вид", items: [
      { icon: "Moon", label: "Тёмная тема", sub: "Тёмный интерфейс приложения", value: darkMode, onChange: () => setDarkMode(!darkMode) },
    ]},
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border"><h2 className="font-bold text-lg">Настройки</h2></div>
      <div className="p-4 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.title}</h3>
            <div className="bg-secondary rounded-2xl overflow-hidden">
              {section.items.map((item, i) => (
                <div key={item.label} className={`flex items-center gap-3 p-4 ${i < section.items.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon as "Bell"} size={18} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.sub}</div>
                  </div>
                  <Toggle value={item.value} onChange={item.onChange} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="text-center pt-4 pb-8">
          <div className="w-12 h-12 rounded-2xl overflow-hidden mx-auto mb-3">
            <img src={BEAR_LOGO} alt="MishkaChat" className="w-full h-full object-cover" />
          </div>
          <p className="font-bold grad-text text-lg">MishkaChat</p>
          <p className="text-xs text-muted-foreground mt-1">Версия 1.0.0</p>
          <button className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors">Выйти из аккаунта</button>
        </div>
      </div>
    </div>
  );
};

// ---- NOTIFICATION BANNER ----
const NotificationBanner = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute top-4 right-4 z-50 animate-slide-right max-w-xs">
    <div className="glass rounded-2xl p-4 flex items-start gap-3 shadow-2xl">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}>АГ</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Алексей Громов</p>
        <p className="text-xs text-muted-foreground truncate">Круто! Возьмёте меня? 😄</p>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors ml-1">
        <Icon name="X" size={14} />
      </button>
    </div>
  </div>
);

// ---- MAIN APP ----
export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [showNotif, setShowNotif] = useState(true);

  const navItems: { tab: Tab; icon: string; label: string; badge?: number }[] = [
    { tab: "chats", icon: "MessageSquare", label: "Чаты", badge: 11 },
    { tab: "contacts", icon: "Users", label: "Контакты" },
    { tab: "calls", icon: "Video", label: "Звонки" },
    { tab: "profile", icon: "User", label: "Профиль" },
    { tab: "settings", icon: "Settings", label: "Настройки" },
  ];

  const tabComponents: Record<Tab, JSX.Element> = {
    chats: <ChatsTab />,
    contacts: <ContactsTab />,
    calls: <CallsTab />,
    profile: <ProfileTab />,
    settings: <SettingsTab />,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "radial-gradient(circle, #4FACFE, transparent)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "radial-gradient(circle, #A855F7, transparent)" }} />
      </div>

      {showNotif && <NotificationBanner onClose={() => setShowNotif(false)} />}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 flex-shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0">
              <img src={BEAR_LOGO} alt="MishkaChat" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none grad-text">MishkaChat</h1>
              <p className="text-xs text-muted-foreground">мессенджер</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.tab} onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.tab ? "nav-active" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
              <Icon name={item.icon as "MessageSquare"} size={20} className={activeTab === item.tab ? "nav-icon" : ""} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}>ЯМ</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Яков Медведев</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                <span className="text-xs text-muted-foreground">в сети</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-hidden">{tabComponents[activeTab]}</div>
        {/* Mobile nav */}
        <div className="md:hidden border-t border-border glass flex-shrink-0">
          <div className="flex">
            {navItems.map(item => (
              <button key={item.tab} onClick={() => setActiveTab(item.tab)} className="flex-1 flex flex-col items-center gap-1 py-3 relative">
                <div className="relative">
                  <Icon name={item.icon as "MessageSquare"} size={22} className={activeTab === item.tab ? "text-purple-400" : "text-muted-foreground"} />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 min-w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] ${activeTab === item.tab ? "text-purple-400 font-semibold" : "text-muted-foreground"}`}>{item.label}</span>
                {activeTab === item.tab && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: "linear-gradient(135deg, #4FACFE, #A855F7)" }} />}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
