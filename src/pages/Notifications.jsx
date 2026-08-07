import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, ArrowUpRight, ArrowDownLeft, Plus, Shield, CreditCard, AlertTriangle, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const typeConfig = {
  transfer_out: { icon: ArrowUpRight, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'Sent' },
  transfer_in:  { icon: ArrowDownLeft, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Received' },
  deposit:      { icon: Plus, color: 'bg-primary/10 text-primary', label: 'Deposit' },
  card:         { icon: CreditCard, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Card' },
  security:     { icon: Shield, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Security' },
  admin:        { icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'Alert' },
  system:       { icon: Bell, color: 'bg-secondary text-muted-foreground', label: 'System' },
};

const categories = ['All', 'Account Services', 'Alerts'];

export default function Notifications() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ owner_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filtered = notifications.filter(n => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Account Services') return ['transfer_out', 'transfer_in', 'deposit', 'card'].includes(n.type);
    if (activeCategory === 'Alerts') return ['security', 'admin', 'system'].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-white shadow-sm'
                : 'bg-secondary text-muted-foreground hover:bg-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <AnimatePresence>
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-heading text-lg font-bold mb-2">All caught up</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Your notifications will appear here once you receive them.</p>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((notif, i) => {
              const cfg = typeConfig[notif.type] || typeConfig.system;
              const Icon = cfg.icon;
              const isAlert = notif.type === 'admin';

              // For failed transfer alerts, extract amount + reason
              const reasonMatch = notif.message?.match(/Reason:\s*(.+)/);
              const reason = reasonMatch ? reasonMatch[1] : null;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !notif.read && markRead.mutate(notif.id)}
                  className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all group ${
                    isAlert
                      ? notif.read ? 'bg-card border-red-200/50 dark:border-red-800/40' : 'bg-red-50/60 dark:bg-red-950/20 border-red-300/60 dark:border-red-700/40'
                      : notif.read ? 'bg-card border-border' : 'bg-primary/5 dark:bg-primary/10 border-primary/25'
                  } hover:shadow-md`}
                >
                  {/* Accent left bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                    isAlert ? 'bg-red-500' : notif.read ? 'bg-border' : 'bg-primary'
                  }`} />

                  <div className="flex items-start gap-3.5 p-4 pl-5">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className={`text-sm font-bold truncate ${isAlert ? 'text-red-700 dark:text-red-400' : ''}`}>
                            {notif.title}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            isAlert ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {cfg.label}
                          </span>
                        </div>
                        {!notif.read && (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${isAlert ? 'bg-red-500' : 'bg-primary'}`} />
                        )}
                      </div>

                      {/* Message — for alert type, split out the reason */}
                      {isAlert && reason ? (
                        <>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {notif.message?.replace(/Reason:\s*.+/, '').trim()}
                          </p>
                          <div className={`mt-2 rounded-lg px-3 py-2 border ${
                            notif.read
                              ? 'bg-secondary border-border'
                              : 'bg-red-100/60 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                          }`}>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Reason</p>
                            <p className="text-xs font-semibold text-foreground">{reason}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                      )}

                      {/* Amount + date row */}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        {notif.amount && (
                          <span className={`text-xs font-bold ${isAlert ? 'text-red-600 dark:text-red-400 line-through opacity-70' : 'text-primary'}`}>
                            ${notif.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {notif.created_date && (
                          <p className="text-[10px] text-muted-foreground/60 ml-auto">
                            {format(new Date(notif.created_date), 'MMM d · h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}