import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ArrowDownLeft, TrendingUp } from 'lucide-react';

export default function TransactionNotifier({ user, account }) {
  const seenIds = useRef(new Set());
  const seenNotifIds = useRef(new Set());
  const threshold = user?.alert_threshold ?? 100;

  // Subscribe to transactions for credit/debit alerts
  useEffect(() => {
    if (!account?.id) return;

    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type !== 'create') return;
      const tx = event.data;
      if (!tx) return;
      if (tx.account_id !== account.id) return;
      if (seenIds.current.has(tx.id)) return;
      seenIds.current.add(tx.id);

      const amount = parseFloat(tx.amount) || 0;
      if (amount < threshold) return;

      const isCredit = tx.type === 'credit';
      const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
      const desc = tx.description || (isCredit ? 'Incoming transfer' : 'Outgoing transfer');

      if (isCredit) {
        toast.custom(() => (
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">Money Received</p>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full">+{formatted}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{desc}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium uppercase tracking-widest">Credited to your account</p>
              </div>
            </div>
          </div>
        ), { duration: 6000 });
      } else {
        toast.custom(() => (
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden border border-amber-200 dark:border-amber-800">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">Amount Debited</p>
                  <span className="text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">-{formatted}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{desc}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium uppercase tracking-widest">Deducted from your account</p>
              </div>
            </div>
          </div>
        ), { duration: 6000 });
      }
    });

    return unsub;
  }, [account?.id, threshold]);

  // Subscribe to admin/system notifications (e.g. transfer failures)
  useEffect(() => {
    if (!user?.email) return;

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type !== 'create') return;
      const notif = event.data;
      if (!notif) return;
      if (notif.owner_email !== user.email) return;
      if (seenNotifIds.current.has(notif.id)) return;
      seenNotifIds.current.add(notif.id);

      if (notif.type === 'admin') {
        const amount = notif.amount
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(notif.amount)
          : null;

        const reasonMatch = notif.message?.match(/Reason:\s*(.+)/);
        const reason = reasonMatch ? reasonMatch[1] : null;

        toast.custom(() => (
          <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #1a0505, #2d0a0a)', border: '1px solid rgba(239,68,68,0.35)' }}>
            {/* Glowing top bar */}
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #ef4444, #f87171, transparent)' }} />
            <div className="p-5">
              {/* Icon row */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-red-400/80 font-semibold mb-0.5">Transfer Declined</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white font-bold text-base leading-tight">Payment Failed</p>
                    {amount && (
                      <span className="text-sm font-bold text-red-300 tabular-nums">{amount}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-3 h-px" style={{ background: 'rgba(239,68,68,0.2)' }} />

              {/* Reason block */}
              {reason && (
                <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-red-400/70 font-semibold mb-1">Reason</p>
                  <p className="text-sm text-red-100 font-medium leading-snug">{reason}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-red-400/50">Apex Bank · Security Notice</p>
                {notif.reference && (
                  <p className="text-[10px] text-red-400/50 font-mono">{notif.reference}</p>
                )}
              </div>
            </div>
            {/* Bottom glow bar */}
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)' }} />
          </div>
        ), { duration: 14000 });
      }
    });

    return unsub;
  }, [user?.email]);

  return null;
}