import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function RecentTransactions({ transactions }) {
  const recent = (transactions || []).slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8">
        <h3 className="font-heading text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="font-heading text-lg font-semibold">Recent Activity</h3>
        <Link to="/transactions" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {recent.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors ${
              tx.status === 'failed' ? 'bg-red-50/40 dark:bg-red-950/20' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              tx.status === 'failed'
                ? 'bg-red-100 text-red-500 dark:bg-red-900/40'
                : tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              {tx.status === 'failed'
                ? <AlertTriangle className="w-4 h-4" />
                : tx.type === 'credit'
                  ? <ArrowDownLeft className="w-4 h-4" />
                  : <ArrowUpRight className="w-4 h-4" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${tx.status === 'failed' ? 'text-red-600 dark:text-red-400' : ''}`}>
                {tx.description || tx.category}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {tx.created_date ? format(new Date(tx.created_date), 'MMM d • h:mm a') : '—'}
                </p>
                {tx.status === 'failed' && (
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400">
                    Failed
                  </Badge>
                )}
              </div>
            </div>
            <p className={`text-sm font-semibold flex-shrink-0 ${
              tx.status === 'failed' ? 'text-red-400 line-through opacity-60' : tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {tx.type === 'credit' ? '+' : '-'}${tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}