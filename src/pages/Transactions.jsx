import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccount } from '@/hooks/useAccount';
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Loader2, AlertTriangle, RefreshCw, ShoppingBag, Wallet, X, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const categoryIcons = {
  transfer: ArrowUpRight,
  deposit: ArrowDownLeft,
  withdrawal: Wallet,
  payment: ShoppingBag,
  refund: RefreshCw,
  admin_credit: CreditCard,
};

const statusStyle = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
};

function TransactionDetailDrawer({ tx, onClose }) {
  if (!tx) return null;
  const Icon = categoryIcons[tx.category] || (tx.type === 'credit' ? ArrowDownLeft : ArrowUpRight);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-card rounded-2xl border border-border w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header stripe */}
        <div className={`h-1 w-full ${tx.type === 'credit' ? 'bg-emerald-500' : tx.status === 'failed' ? 'bg-red-500' : 'bg-primary'}`} />
        <div className="p-5 space-y-4">
          {/* Title row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                tx.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                tx.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'
              }`}>
                {tx.status === 'failed' ? <AlertTriangle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{tx.description || tx.category}</p>
                <Badge variant="outline" className={`text-[10px] mt-1 ${statusStyle[tx.status] || ''}`}>
                  {tx.status}
                </Badge>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Amount */}
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Amount</p>
            <p className={`text-4xl font-bold ${
              tx.status === 'failed' ? 'text-red-400 line-through opacity-50' :
              tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {tx.type === 'credit' ? '+' : '-'}${tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Details grid */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
            {[
              { label: 'Date & Time', value: tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : '—' },
              { label: 'Category', value: tx.category?.replace('_', ' ') || '—' },
              { label: 'Type', value: tx.type === 'credit' ? 'Incoming' : 'Outgoing' },
              tx.reference && { label: 'Reference', value: tx.reference },
              tx.recipient_account && { label: 'To Account', value: tx.recipient_account },
              tx.sender_account && { label: 'From Account', value: tx.sender_account },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="font-medium text-xs text-right font-mono truncate max-w-[160px]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Transactions() {
  const { user } = useOutletContext();
  const { account } = useAccount(user?.email);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedTx, setSelectedTx] = useState(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['all-transactions', account?.id],
    queryFn: () => base44.entities.Transaction.filter({ account_id: account?.id }, '-created_date', 100),
    enabled: !!account?.id,
  });

  const filtered = transactions
    .filter(tx => {
      const matchesSearch = !search ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.category?.toLowerCase().includes(search.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === 'date_asc') return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl lg:text-3xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Your complete transaction history</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search transactions…" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="amount_desc">Highest Amount</SelectItem>
              <SelectItem value="amount_asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all','credit','debit'].map(v => (
            <button key={v} onClick={() => setFilterType(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterType === v ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              }`}>
              {v === 'all' ? 'All Types' : v === 'credit' ? 'Credits' : 'Debits'}
            </button>
          ))}
          <div className="w-px bg-border mx-1" />
          {['all','completed','pending','failed'].map(v => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterStatus === v ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              }`}>
              {v === 'all' ? 'All Status' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <div className="w-px bg-border mx-1" />
          {['all','transfer','deposit','withdrawal','payment','refund','admin_credit'].map(v => (
            <button key={v} onClick={() => setFilterCategory(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterCategory === v ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              }`}>
              {v === 'all' ? 'All Categories' : v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        {(filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || search) && (
          <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterCategory('all'); setSearch(''); setSortBy('date_desc'); }}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
          <AnimatePresence>
            {filtered.map((tx, i) => {
              const Icon = categoryIcons[tx.category] || (tx.type === 'credit' ? ArrowDownLeft : ArrowUpRight);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedTx(tx)}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors cursor-pointer ${
                    tx.status === 'failed' ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.status === 'failed' ? 'bg-red-100 text-red-500 dark:bg-red-900/40' :
                    tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-500 dark:bg-red-900/20'
                  }`}>
                    {tx.status === 'failed' ? <AlertTriangle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${tx.status === 'failed' ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {tx.description || 'Transaction'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy • h:mm a') : '—'}
                      </p>
                      <Badge variant="outline" className={`text-[10px] ${statusStyle[tx.status] || ''}`}>
                        {tx.status}
                      </Badge>
                      {tx.reference && (
                        <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:block">{tx.reference}</span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${
                    tx.status === 'failed' ? 'text-red-400 line-through opacity-60' :
                    tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Transaction Detail Drawer */}
      <AnimatePresence>
        {selectedTx && <TransactionDetailDrawer tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      </AnimatePresence>
    </div>
  );
}