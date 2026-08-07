import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Paperclip, Image } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function SupportChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const conversationId = user?.email ? `support_${user.email.replace(/[^a-z0-9]/gi, '_')}` : null;

  useEffect(() => {
    if (!conversationId) return;
    loadMessages();
    const unsub = base44.entities.SupportMessage.subscribe((event) => {
      if (event.data?.conversation_id === conversationId) loadMessages();
    });
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    if (open) { setUnread(0); markAdminMessagesRead(); }
  }, [open, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const loadMessages = async () => {
    if (!conversationId) return;
    const msgs = await base44.entities.SupportMessage.filter({ conversation_id: conversationId }, 'created_date', 100);
    setMessages(msgs);
    if (!open) setUnread(msgs.filter(m => m.role === 'admin' && !m.read).length);
  };

  const markAdminMessagesRead = async () => {
    const unreadMsgs = messages.filter(m => m.role === 'admin' && !m.read);
    await Promise.all(unreadMsgs.map(m => base44.entities.SupportMessage.update(m.id, { read: true })));
  };

  const sendMessage = async (overrideText, fileUrl) => {
    const content = overrideText ?? text.trim();
    if ((!content && !fileUrl) || sending || !conversationId) return;
    setSending(true);

    await base44.entities.SupportMessage.create({
      conversation_id: conversationId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      message: content || '📷 Photo',
      role: 'customer',
      read: false,
      ...(fileUrl && { file_url: fileUrl }),
    });
    if (!overrideText) setText('');
    setSending(false);

    const existing = await base44.entities.SupportMessage.filter({ conversation_id: conversationId }, 'created_date', 100);
    const hasAdminReply = existing.some(m => m.role === 'admin');
    if (!hasAdminReply) {
      setTimeout(async () => {
        await base44.entities.SupportMessage.create({
          conversation_id: conversationId, sender_email: 'support@apexbank',
          sender_name: 'Apex Support', message: 'Thank you for reaching out to Apex Bank! 👋 We have received your message. Please wait for us to respond.', role: 'admin', read: false,
        });
        setTimeout(async () => {
          await base44.entities.SupportMessage.create({
            conversation_id: conversationId, sender_email: 'support@apexbank',
            sender_name: 'Apex Support', message: 'Give me a moment while I connect you with a live agent. You can also reach us directly at Myapex@mail2usa.com 📧', role: 'admin', read: false,
          });
        }, 2000);
      }, 1200);
    }
    await loadMessages();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    await sendMessage('', file_url);
    e.target.value = '';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  return (
    <div className="fixed bottom-20 right-3 lg:bottom-6 lg:right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className="mb-3 bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
            style={{
              width: 'min(92vw, 360px)',
              height: 'min(80vh, 520px)',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-foreground to-foreground/90 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-white">AB</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white font-heading">Apex Support</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/60">Online · Typically replies fast</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">How can we help?</p>
                    <p className="text-xs text-muted-foreground mt-1">Send us a message or a photo — we're here 24/7!</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'customer' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'customer'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-secondary text-foreground rounded-bl-none'
                  }`}>
                    {msg.file_url && (
                      <img
                        src={msg.file_url}
                        alt="attachment"
                        className="rounded-xl max-w-full mb-1.5 cursor-pointer"
                        style={{ maxHeight: 180 }}
                        onClick={() => window.open(msg.file_url, '_blank')}
                      />
                    )}
                    {msg.message !== '📷 Photo' && <p className="leading-snug whitespace-pre-wrap break-words">{msg.message}</p>}
                    <p className={`text-[10px] mt-0.5 ${msg.role === 'customer' ? 'text-white/50' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {(sending || uploading) && (
                <div className="flex items-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-none px-3 py-2">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-border flex items-end gap-2 flex-shrink-0 bg-card">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors"
                title="Send photo"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Image className="w-4 h-4 text-muted-foreground" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => { setText(e.target.value); autoResize(e); }}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 rounded-2xl border border-input bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-[36px] max-h-[100px] leading-snug"
              />
              <button
                onClick={() => sendMessage()}
                disabled={sending || !text.trim()}
                className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-primary rounded-full shadow-xl flex items-center justify-center relative"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6 text-white" /></motion.span>
            : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle className="w-6 h-6 text-white" /></motion.span>
          }
        </AnimatePresence>
        {unread > 0 && !open && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unread}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}