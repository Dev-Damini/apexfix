import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, MessageCircle, Loader2, User, Plus, ArrowLeft, Trash2, EyeOff, Eye, Image, Globe, Languages } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PinVerification from '@/components/shared/PinVerification';
import SupportTrashBin from '@/components/support/SupportTrashBin';
import { toast } from 'sonner';

const SUPER_ADMIN = 'walletcnct@gmail.com';

export default function AdminSupportPanel({ adminUser }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newConvDialog, setNewConvDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const [hiddenConvs, setHiddenConvs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiddenSupportConvs') || '[]'); } catch { return []; }
  });
  const [showHidden, setShowHidden] = useState(false);
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [translations, setTranslations] = useState({});
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [translateReply, setTranslateReply] = useState(false);
  const [showTrashBin, setShowTrashBin] = useState(false);

  useEffect(() => {
    loadConversations();
    const unsub = base44.entities.SupportMessage.subscribe(() => {
      loadConversations();
      if (selected) loadMessages(selected);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (selected) loadMessages(selected);
  }, [selected]);

  useEffect(() => {
    if (autoTranslate && messages.length) {
      messages
        .filter(m => m.role === 'customer' && m.message && m.message !== '📷 Photo' && !translations[m.id])
        .forEach(translateMessage);
    }
  }, [messages, autoTranslate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isSuperAdmin = adminUser?.email?.toLowerCase() === SUPER_ADMIN.toLowerCase();
  // Non-super admins only see messages from when they were made admin onward
  const adminSince = isSuperAdmin ? null : (adminUser?.admin_since ? new Date(adminUser.admin_since) : null);

  const loadConversations = async () => {
    const all = await base44.entities.SupportMessage.list('-created_date', 500);
    const map = {};
    all.forEach(m => {
      // Skip soft-deleted messages
      if (m.deleted) return;
      // Restrict non-super-admins to messages after their admin_since date
      if (adminSince && new Date(m.created_date) < adminSince) return;
      if (!map[m.conversation_id]) {
        map[m.conversation_id] = { id: m.conversation_id, email: '', name: '', lastMsg: m, unread: 0 };
      }
      if (m.role === 'customer') {
        map[m.conversation_id].email = m.sender_email;
        map[m.conversation_id].name = m.sender_name;
      }
      if (m.role === 'customer' && !m.read) map[m.conversation_id].unread++;
      if (new Date(m.created_date) > new Date(map[m.conversation_id].lastMsg.created_date)) {
        map[m.conversation_id].lastMsg = m;
      }
    });
    setConversations(Object.values(map).sort((a, b) => new Date(b.lastMsg.created_date) - new Date(a.lastMsg.created_date)));
  };

  const loadMessages = async (convId) => {
    const all = await base44.entities.SupportMessage.filter({ conversation_id: convId }, 'created_date', 200);
    // Filter out soft-deleted and respect admin_since
    const msgs = all.filter(m => {
      if (m.deleted) return false;
      if (adminSince && new Date(m.created_date) < adminSince) return false;
      return true;
    });
    setMessages(msgs);
    const unreadMsgs = msgs.filter(m => m.role === 'customer' && !m.read);
    await Promise.all(unreadMsgs.map(m => base44.entities.SupportMessage.update(m.id, { read: true })));
    await loadConversations();
  };

  const translateMessage = async (msg) => {
    if (!msg.message || msg.message === '📷 Photo') return;
    if (translations[msg.id]?.translated) {
      setTranslations(prev => ({ ...prev, [msg.id]: { ...prev[msg.id], showTranslated: !prev[msg.id].showTranslated } }));
      return;
    }
    setTranslations(prev => ({ ...prev, [msg.id]: { loading: true } }));
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Detect the language of this text and translate it to English if it's not already English.
Text: "${msg.message}"`,
      response_json_schema: {
        type: 'object',
        properties: {
          detected_language: { type: 'string' },
          language_code: { type: 'string' },
          translated_text: { type: 'string' },
          is_english: { type: 'boolean' }
        }
      }
    });
    setTranslations(prev => ({
      ...prev,
      [msg.id]: {
        translated: result.translated_text,
        lang: result.language_code?.toUpperCase()?.slice(0, 3),
        fullLang: result.detected_language,
        isEnglish: result.is_english,
        showTranslated: !result.is_english,
        loading: false
      }
    }));
  };

  const sendReply = async (fileUrl) => {
    let content = text.trim();
    if ((!content && !fileUrl) || sending || !selected) return;
    setSending(true);
    if (translateReply && content) {
      const lastCustomerMsg = [...messages].reverse().find(m => m.role === 'customer' && m.message && m.message !== '📷 Photo');
      const langInfo = lastCustomerMsg && translations[lastCustomerMsg.id];
      if (langInfo?.lang && !langInfo.isEnglish) {
        const translated = await base44.integrations.Core.InvokeLLM({
          prompt: `Translate this text to ${langInfo.fullLang}. Return only the translated text, nothing else: "${content}"`,
        });
        if (translated) content = translated;
      }
    }
    await base44.entities.SupportMessage.create({
      conversation_id: selected,
      sender_email: adminUser?.email,
      sender_name: adminUser?.full_name || 'Support Team',
      message: content || '📷 Photo',
      role: 'admin',
      read: false,
      ...(fileUrl && { file_url: fileUrl }),
    });
    const conv = conversations.find(c => c.id === selected);
    if (conv?.email && content) {
      base44.integrations.Core.SendEmail({
        to: conv.email,
        subject: 'New message from Apex Bank Support',
        body: `Hi ${conv.name || 'there'},\n\nYou have a new message from Apex Bank Support:\n\n"${content}"\n\nPlease log in to your account to reply.\n\nApex Bank Support Team`,
      }).catch(() => {});
    }
    setText('');
    setSending(false);
    await loadMessages(selected);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    await sendReply(file_url);
    e.target.value = '';
  };

  const startNewConversation = async () => {
    if (!newEmail.trim() || !newMessage.trim()) { toast.error('Please enter customer email and a message'); return; }
    setStarting(true);
    const convId = 'CONV-' + Date.now().toString(36).toUpperCase();
    await base44.entities.SupportMessage.create({
      conversation_id: convId, sender_email: adminUser?.email,
      sender_name: adminUser?.full_name || 'Support Team',
      message: newMessage.trim(), role: 'admin', read: false,
    });
    base44.integrations.Core.SendEmail({
      to: newEmail.trim(), subject: 'Message from Apex Bank Support',
      body: `Hi,\n\nYou have a new message from Apex Bank Support:\n\n"${newMessage.trim()}"\n\nPlease log in to your account to view and reply.\n\nApex Bank Support Team`,
    }).catch(() => {});
    toast.success('Conversation started');
    setStarting(false); setNewConvDialog(false); setNewEmail(''); setNewMessage('');
    await loadConversations();
    setSelected(convId);
  };

  const toggleHide = (convId) => {
    const isHidden = hiddenConvs.includes(convId);
    const updated = isHidden ? hiddenConvs.filter(id => id !== convId) : [...hiddenConvs, convId];
    setHiddenConvs(updated);
    localStorage.setItem('hiddenSupportConvs', JSON.stringify(updated));
    if (!isHidden && selected === convId) setSelected(null);
    toast.success(isHidden ? 'Conversation unhidden' : 'Conversation hidden');
  };

  const requestDelete = (convId) => { setPendingDeleteId(convId); setShowDeletePin(true); };

  const handleDeletePinConfirm = async (enteredPin, onError) => {
    if (enteredPin !== adminUser?.transaction_pin) { onError('Incorrect PIN'); return; }
    setShowDeletePin(false);
    const allMsgs = await base44.entities.SupportMessage.filter({ conversation_id: pendingDeleteId });
    // Soft delete — move to trash bin
    await Promise.all(allMsgs.map(m => base44.entities.SupportMessage.update(m.id, {
      deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: adminUser?.email,
    })));
    setSelected(null); setPendingDeleteId(null);
    await loadConversations();
    toast.success('Conversation moved to trash');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const visibleConvs = conversations.filter(c => showHidden ? hiddenConvs.includes(c.id) : !hiddenConvs.includes(c.id));
  const activeConv = conversations.find(c => c.id === selected);

  return (
    <React.Fragment>
      <div className="flex bg-card rounded-2xl border border-border overflow-hidden" style={{ height: 'min(78vh, 640px)' }}>

        {/* Conversations List */}
        <div className={`border-r border-border flex flex-col flex-shrink-0 ${selected ? 'hidden md:flex md:w-72' : 'w-full md:w-72'}`}>
          <div className="p-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold truncate">{showHidden ? 'Hidden Chats' : 'Support Inbox'}</span>
              {totalUnread > 0 && !showHidden && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0">{totalUnread}</span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => setAutoTranslate(!autoTranslate)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${autoTranslate ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
                  title={autoTranslate ? 'Auto-translate ON' : 'Auto-translate OFF'}>
                  <Globe className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setShowHidden(!showHidden); setSelected(null); }}
                  className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center" title={showHidden ? 'Show inbox' : 'Show hidden'}>
                  {showHidden ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                {isSuperAdmin && (
                  <button onClick={() => setShowTrashBin(true)}
                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center" title="Trash bin">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  className="w-7 h-7 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center"
                  onClick={() => setNewConvDialog(true)} title="Start new conversation"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {visibleConvs.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">{showHidden ? 'No hidden conversations' : 'No conversations yet'}</div>
            )}
            {visibleConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv.id)}
                className={`w-full px-3 py-3.5 text-left border-b border-border/50 hover:bg-secondary/50 transition-all active:bg-secondary ${selected === conv.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold truncate">{conv.name || conv.email}</p>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{conv.unread}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {conv.lastMsg?.file_url && !conv.lastMsg?.message ? '📷 Photo' : conv.lastMsg?.message}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selected ? 'hidden md:flex' : 'flex'}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground p-6">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Select a conversation</p>
                <button onClick={() => setNewConvDialog(true)} className="text-xs text-primary hover:underline mt-1">or start a new one</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Chat header */}
              <div className="px-3 py-2.5 border-b border-border flex-shrink-0 flex items-center gap-2 bg-secondary/20">
                <button onClick={() => setSelected(null)} className="md:hidden w-9 h-9 rounded-xl hover:bg-secondary flex items-center justify-center flex-shrink-0 active:bg-secondary">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate leading-tight">{activeConv?.name || activeConv?.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{activeConv?.email}</p>
                </div>
                <button onClick={() => toggleHide(selected)}
                  className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center flex-shrink-0 active:bg-muted"
                  title={hiddenConvs.includes(selected) ? 'Unhide' : 'Hide conversation'}>
                  {hiddenConvs.includes(selected) ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => requestDelete(selected)}
                  className="w-8 h-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center flex-shrink-0 active:bg-red-50"
                  title="Delete conversation">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'admin' ? 'bg-primary text-white rounded-br-none' : 'bg-secondary text-foreground rounded-bl-none'}`}>
                      {msg.file_url && (
                        <img
                          src={msg.file_url}
                          alt="attachment"
                          className="rounded-xl max-w-full mb-1.5 cursor-pointer"
                          style={{ maxHeight: 200 }}
                          onClick={() => window.open(msg.file_url, '_blank')}
                        />
                      )}
                      {msg.message !== '📷 Photo' && (
                        <>
                          <p className="leading-snug whitespace-pre-wrap break-words">{msg.message}</p>
                          {translations[msg.id]?.showTranslated && (
                            <p className="leading-snug whitespace-pre-wrap break-words border-t border-black/10 dark:border-white/10 mt-1.5 pt-1.5 italic opacity-80 text-xs">
                              🌐 {translations[msg.id].translated}
                            </p>
                          )}
                        </>
                      )}
                      <p className={`text-[10px] mt-0.5 ${msg.role === 'admin' ? 'text-white/50' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'customer' && msg.message && msg.message !== '📷 Photo' && (
                      <div className="flex items-center gap-1.5 mt-0.5 px-1">
                        {translations[msg.id]?.lang && !translations[msg.id]?.isEnglish && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[9px] font-bold">{translations[msg.id].lang}</span>
                        )}
                        <button onClick={() => translateMessage(msg)} className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors">
                          {translations[msg.id]?.loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Globe className="w-2.5 h-2.5" />}
                          <span>{translations[msg.id]?.loading ? 'Detecting...' : translations[msg.id]?.showTranslated ? 'Original' : 'Translate'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {(uploading) && (
                  <div className="flex justify-end">
                    <div className="bg-primary/20 rounded-2xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="px-3 py-2.5 border-t border-border flex items-end gap-2 flex-shrink-0 bg-card">
                <button
                  onClick={() => setTranslateReply(!translateReply)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${translateReply ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10 text-muted-foreground'}`}
                  title={translateReply ? 'Auto-translate reply: ON' : 'Auto-translate reply: OFF'}
                >
                  <Languages className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-secondary hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors active:bg-primary/20"
                  title="Send photo"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Image className="w-4 h-4 text-muted-foreground" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <textarea
                  value={text}
                  onChange={e => { setText(e.target.value); autoResize(e); }}
                  onKeyDown={handleKey}
                  placeholder="Reply to customer..."
                  rows={1}
                  className="flex-1 rounded-2xl border border-input bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-[36px] max-h-[100px] leading-snug"
                />
                <button
                  onClick={() => sendReply()}
                  disabled={sending || !text.trim()}
                  className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={newConvDialog} onOpenChange={setNewConvDialog}>
        <DialogContent className="max-w-sm mx-3">
          <DialogHeader>
            <DialogTitle className="font-heading">Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Customer Email</Label>
              <Input className="mt-1" placeholder="customer@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="mt-1 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-24 resize-none"
                placeholder="Type your message to the customer..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 h-11" onClick={startNewConversation} disabled={starting}>
              {starting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send to Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showDeletePin && (
          <PinVerification
            onConfirm={handleDeletePinConfirm}
            onCancel={() => { setShowDeletePin(false); setPendingDeleteId(null); }}
            title="Delete Conversation"
            subtitle="Enter your transaction PIN to move to trash"
          />
        )}
      </AnimatePresence>

      {isSuperAdmin && (
        <SupportTrashBin
          adminUser={adminUser}
          open={showTrashBin}
          onClose={() => setShowTrashBin(false)}
        />
      )}
    </React.Fragment>
  );
}