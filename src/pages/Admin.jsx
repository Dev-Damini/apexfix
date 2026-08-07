import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Search, Plus, Minus, Loader2, Users, DollarSign, ArrowLeftRight, CheckCircle, XCircle, Clock, MessageCircle, AlertTriangle, UserCog, CreditCard, Lock, Unlock } from 'lucide-react';
import AdminSupportPanel from '@/components/support/AdminSupportPanel';
import RolesTab from '@/components/admin/RolesTab';
import GiftCardsTab from '@/components/admin/GiftCardsTab';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';

const SUPER_ADMIN = 'walletcnct@gmail.com';

export default function Admin() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('credit');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txnSearch, setTxnSearch] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [activeTab, setActiveTab] = useState('accounts');
  const [failDialog, setFailDialog] = useState(null);
  const [failReason, setFailReason] = useState('');
  const [selectedTransfers, setSelectedTransfers] = useState(new Set());
  const [selectedTxns, setSelectedTxns] = useState(new Set());

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN.toLowerCase();

  const { data: allAccounts, isLoading } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: () => base44.entities.Account.list('-created_date', 200),
    enabled: isAdmin,
    initialData: [],
  });

  const { data: allTransactions } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
    enabled: isAdmin,
    initialData: [],
  });

  const { data: allTransfers } = useQuery({
    queryKey: ['admin-transfers'],
    queryFn: () => base44.entities.Transfer.list('-created_date', 200),
    enabled: isAdmin,
    initialData: [],
  });

  const { data: allCards } = useQuery({
    queryKey: ['admin-cards'],
    queryFn: () => base44.entities.Card.list('-created_date', 200),
    enabled: isAdmin,
    initialData: [],
  });

  const adminToggleCardFreeze = useMutation({
    mutationFn: async (card) => {
      const nowFrozen = card.status === 'frozen';
      await base44.entities.Card.update(card.id, {
        status: nowFrozen ? 'active' : 'frozen',
        freeze_locked: false,
      });
      await base44.entities.Notification.create({
        owner_email: card.owner_email,
        title: nowFrozen ? 'Card Unfrozen' : 'Card Frozen',
        message: nowFrozen
          ? `Your card ending in ${card.card_number?.slice(-4)} has been unfrozen by admin and is now active.`
          : `Your card ending in ${card.card_number?.slice(-4)} has been frozen by admin.`,
        type: 'card',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      haptic('success');
      toast.success('Card status updated');
    },
    onError: () => toast.error('Failed to update card'),
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(adjustAmount);
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      const newBalance = adjustType === 'credit'
        ? (selectedAccount.balance || 0) + amount
        : (selectedAccount.balance || 0) - amount;
      if (newBalance < 0) throw new Error('Cannot reduce below zero');
      await base44.entities.Account.update(selectedAccount.id, { balance: newBalance });
      await base44.entities.Transaction.create({
        account_id: selectedAccount.id,
        type: adjustType,
        amount,
        description: `Transaction ${adjustType === 'credit' ? 'approved - deposit' : 'approved - deduction'}`,
        category: 'admin_credit',
        status: 'completed',
        reference: 'ADM' + Date.now().toString(36).toUpperCase(),
        owner_email: selectedAccount.owner_email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      setDialogOpen(false);
      setAdjustAmount('');
      haptic('success');
      toast.success('Balance adjusted successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const approveTransfer = useMutation({
    mutationFn: async (transfer) => {
      await base44.entities.Transfer.update(transfer.id, { status: 'completed' });
      const fromAccounts = await base44.entities.Account.filter({ id: transfer.from_account_id });
      if (fromAccounts.length > 0) {
        await base44.entities.Account.update(fromAccounts[0].id, { balance: Math.max(0, (fromAccounts[0].balance || 0) - transfer.amount) });
        await base44.entities.Transaction.create({
          account_id: fromAccounts[0].id,
          type: 'debit',
          amount: transfer.amount,
          description: `Transaction approved - ${transfer.to_account_name || transfer.to_account_number}`,
          category: 'transfer',
          status: 'completed',
          reference: transfer.reference,
          owner_email: fromAccounts[0].owner_email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
      haptic('success');
      toast.success('Transfer approved');
    },
    onError: () => toast.error('Failed to approve transfer'),
  });

  const rejectTransfer = useMutation({
    mutationFn: async ({ transfer, reason }) => {
      await base44.entities.Transfer.update(transfer.id, { status: 'failed', failure_reason: reason });
      const fromAccounts = await base44.entities.Account.filter({ id: transfer.from_account_id });
      if (fromAccounts.length > 0) {
        await base44.entities.Transaction.create({
          account_id: fromAccounts[0].id,
          type: 'debit',
          amount: transfer.amount,
          description: `Transfer to ${transfer.to_account_name || transfer.to_account_number} - Failed`,
          category: 'transfer',
          status: 'failed',
          reference: transfer.reference,
          owner_email: fromAccounts[0].owner_email,
        });
      }
      await base44.entities.Notification.create({
        owner_email: transfer.owner_email,
        title: 'Transfer Failed',
        message: `Your transfer of $${transfer.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${transfer.to_account_name || transfer.to_account_number} was declined. Reason: ${reason || 'No reason provided.'}`,
        type: 'admin',
        amount: transfer.amount,
        reference: transfer.reference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
      setFailDialog(null);
      setFailReason('');
      haptic('medium');
      toast.success('Transfer failed & customer notified');
    },
  });

  const bulkApproveTransfers = useMutation({
    mutationFn: async (ids) => {
      const targets = allTransfers.filter(t => ids.has(t.id) && (t.status === 'pending' || t.status === 'scheduled'));
      await Promise.all(targets.map(async (transfer) => {
        await base44.entities.Transfer.update(transfer.id, { status: 'completed' });
        const fromAccounts = await base44.entities.Account.filter({ id: transfer.from_account_id });
        if (fromAccounts.length > 0) {
          await base44.entities.Account.update(fromAccounts[0].id, { balance: Math.max(0, (fromAccounts[0].balance || 0) - transfer.amount) });
          await base44.entities.Transaction.create({
            account_id: fromAccounts[0].id, type: 'debit', amount: transfer.amount,
            description: `Transaction approved - ${transfer.to_account_name || transfer.to_account_number}`,
            category: 'transfer', status: 'completed', reference: transfer.reference,
            owner_email: fromAccounts[0].owner_email,
          });
        }
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
      const count = selectedTransfers.size;
      setSelectedTransfers(new Set());
      haptic('success');
      toast.success(`Bulk approved ${count} transfers`);
    },
    onError: () => toast.error('Bulk approve failed'),
  });

  const bulkDeleteTransfers = useMutation({
    mutationFn: async (ids) => {
      await Promise.all([...ids].map(id => base44.entities.Transfer.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
      setSelectedTransfers(new Set());
      haptic('medium');
      toast.success('Selected transfers deleted');
    },
    onError: () => toast.error('Bulk delete failed'),
  });

  const bulkDeleteTxns = useMutation({
    mutationFn: async (ids) => {
      await Promise.all([...ids].map(id => base44.entities.Transaction.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      setSelectedTxns(new Set());
      haptic('medium');
      toast.success('Selected transactions deleted');
    },
    onError: () => toast.error('Bulk delete failed'),
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Shield className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="font-heading text-xl font-bold">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2">You need admin privileges to view this page.</p>
      </div>
    );
  }

  const filtered = allAccounts.filter(a =>
    !search ||
    a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
    a.account_number?.includes(search)
  );

  const filteredTxns = allTransactions.filter(t =>
    !txnSearch ||
    t.description?.toLowerCase().includes(txnSearch.toLowerCase()) ||
    t.owner_email?.toLowerCase().includes(txnSearch.toLowerCase()) ||
    t.reference?.toLowerCase().includes(txnSearch.toLowerCase())
  );

  const filteredTransfers = allTransfers.filter(t =>
    !transferSearch ||
    t.to_account_name?.toLowerCase().includes(transferSearch.toLowerCase()) ||
    t.to_account_number?.includes(transferSearch) ||
    t.owner_email?.toLowerCase().includes(transferSearch.toLowerCase())
  );

  const totalBalance = allAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const pendingTransfers = allTransfers.filter(t => t.status === 'pending' || t.status === 'scheduled');

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-2xl lg:text-3xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage accounts, transactions, and transfers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Accounts', value: allAccounts.length, bg: 'bg-primary/10', iconColor: 'text-primary' },
          { icon: DollarSign, label: 'Total Deposits', value: `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: 'bg-primary/10', iconColor: 'text-primary' },
          { icon: ArrowLeftRight, label: 'All Transactions', value: allTransactions.length, bg: 'bg-secondary', iconColor: 'text-foreground' },
          { icon: Clock, label: 'Pending Transfers', value: pendingTransfers.length, bg: 'bg-secondary', iconColor: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <TabsList className="inline-flex w-max min-w-full gap-1 h-auto p-1">
            <TabsTrigger value="accounts" className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Accounts</TabsTrigger>
            <TabsTrigger value="transactions" className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Transactions</TabsTrigger>
            <TabsTrigger value="transfers" className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Transfers</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="giftcards" className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">🎁 Gift Cards</TabsTrigger>
            )}
            <TabsTrigger value="support" className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Support</TabsTrigger>
            <TabsTrigger value="cards" className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">💳 Cards</TabsTrigger>
            <TabsTrigger value="roles" className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Roles</TabsTrigger>
          </TabsList>
        </div>

        {/* ACCOUNTS TAB */}
        <TabsContent value="accounts" className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, or account number..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No accounts found</p>
              ) : filtered.map((acc, i) => (
                <motion.div key={acc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{acc.owner_name || 'Unnamed'}</p>
                      <Badge variant="outline" className="text-[10px]">{acc.account_type}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${acc.status === 'active' ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}>{acc.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{acc.owner_email} · {acc.account_number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold">${(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { haptic('light'); setSelectedAccount(acc); setDialogOpen(true); }}>Adjust</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="mt-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-10" value={txnSearch} onChange={e => setTxnSearch(e.target.value)} />
            </div>
            {selectedTxns.size > 0 && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedTxns(new Set())}>
                Clear ({selectedTxns.size})
              </Button>
            )}
          </div>
          {selectedTxns.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-medium text-primary flex-1">{selectedTxns.size} selected</span>
              <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => { haptic('medium'); bulkDeleteTxns.mutate(selectedTxns); }} disabled={bulkDeleteTxns.isPending}>
                {bulkDeleteTxns.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />} Delete Selected
              </Button>
            </div>
          )}
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
            {filteredTxns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions found</p>
            ) : filteredTxns.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors ${selectedTxns.has(t.id) ? 'bg-primary/5' : ''}`}>
                <input type="checkbox" checked={selectedTxns.has(t.id)}
                  onChange={e => { haptic('selection'); const s = new Set(selectedTxns); e.target.checked ? s.add(t.id) : s.delete(t.id); setSelectedTxns(s); }}
                  className="w-4 h-4 rounded border-border accent-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.description || t.category}</p>
                  <p className="text-xs text-muted-foreground">{t.owner_email} · {t.reference} · {t.created_date ? format(new Date(t.created_date), 'MMM dd, yyyy') : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`text-[10px] ${t.status === 'completed' ? 'text-emerald-600 border-emerald-200' : t.status === 'failed' ? 'text-red-600 border-red-200' : 'text-amber-600 border-amber-200'}`}>{t.status}</Badge>
                  <p className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'credit' ? '+' : '-'}${(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TRANSFERS TAB */}
        <TabsContent value="transfers" className="mt-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search transfers..." className="pl-10" value={transferSearch} onChange={e => setTransferSearch(e.target.value)} />
            </div>
            {selectedTransfers.size > 0 && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedTransfers(new Set())}>
                Clear ({selectedTransfers.size})
              </Button>
            )}
          </div>
          {selectedTransfers.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl flex-wrap">
              <span className="text-sm font-medium text-primary flex-1">{selectedTransfers.size} selected</span>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => { haptic('success'); bulkApproveTransfers.mutate(selectedTransfers); }} disabled={bulkApproveTransfers.isPending}>
                {bulkApproveTransfers.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />} Approve All
              </Button>
              <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => { haptic('medium'); bulkDeleteTransfers.mutate(selectedTransfers); }} disabled={bulkDeleteTransfers.isPending}>
                {bulkDeleteTransfers.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />} Delete All
              </Button>
            </div>
          )}
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
            {filteredTransfers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transfers found</p>
            ) : filteredTransfers.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 hover:bg-secondary/30 transition-colors ${selectedTransfers.has(t.id) ? 'bg-primary/5' : ''}`}>
                <input type="checkbox" checked={selectedTransfers.has(t.id)}
                  onChange={e => { haptic('selection'); const s = new Set(selectedTransfers); e.target.checked ? s.add(t.id) : s.delete(t.id); setSelectedTransfers(s); }}
                  className="w-4 h-4 rounded border-border accent-primary flex-shrink-0 mt-1 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">To: {t.to_account_name || t.to_account_number}</p>
                    <Badge variant="outline" className={`text-[10px] ${
                      t.status === 'completed' ? 'text-emerald-600 border-emerald-200' :
                      t.status === 'failed' ? 'text-red-600 border-red-200' :
                      'text-amber-600 border-amber-200'
                    }`}>{t.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.owner_email} · {t.reference} · {t.created_date ? format(new Date(t.created_date), 'MMM dd, yyyy') : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-red-500">-${(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  {(t.status === 'pending' || t.status === 'scheduled') && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => { haptic('success'); approveTransfer.mutate(t); }} disabled={approveTransfer.isPending}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Approve
                    </Button>
                  )}
                  {t.status !== 'failed' && t.status !== 'cancelled' && (
                    <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { haptic('medium'); setFailDialog(t); setFailReason(''); }} disabled={rejectTransfer.isPending}>
                      <XCircle className="w-3 h-3 mr-1" /> Fail
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* CARDS TAB */}
        <TabsContent value="cards" className="mt-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
            {allCards.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No cards found</p>
            ) : allCards.map((card, i) => (
              <motion.div key={card.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">•••• {card.card_number?.slice(-4)}</p>
                    <Badge variant="outline" className="text-[10px] uppercase">{card.card_tier} · {card.card_type}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${
                      card.status === 'active' ? 'text-emerald-600 border-emerald-200' :
                      card.status === 'frozen' ? 'text-blue-600 border-blue-200' :
                      'text-muted-foreground'
                    }`}>{card.status}</Badge>
                    {card.freeze_locked && card.status === 'frozen' && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 border border-amber-300">Pending Approval</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.owner_email} · Exp: {card.expiry_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs ${card.status === 'frozen' ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                    onClick={() => { haptic('medium'); adminToggleCardFreeze.mutate(card); }}
                    disabled={adminToggleCardFreeze.isPending || !card.activated}
                  >
                    {card.status === 'frozen'
                      ? <><Unlock className="w-3 h-3 mr-1" /> Unfreeze</>
                      : <><Lock className="w-3 h-3 mr-1" /> Freeze</>
                    }
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* GIFT CARDS TAB */}
        {isSuperAdmin && (
          <TabsContent value="giftcards" className="mt-4">
            <GiftCardsTab />
          </TabsContent>
        )}

        {/* SUPPORT TAB */}
        <TabsContent value="support" className="mt-4">
          <AdminSupportPanel adminUser={user} />
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles" className="mt-4">
          <RolesTab currentUser={user} />
        </TabsContent>
      </Tabs>

      {/* Fail Transfer Dialog */}
      <Dialog open={!!failDialog} onOpenChange={() => setFailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Fail Transfer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm font-medium">To: {failDialog?.to_account_name || failDialog?.to_account_number}</p>
              <p className="text-xs text-muted-foreground">{failDialog?.owner_email}</p>
              <p className="text-lg font-bold mt-2 text-destructive">-${(failDialog?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <Label>Reason for failure (shown to customer)</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Suspicious activity detected"
                value={failReason}
                onChange={e => setFailReason(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => rejectTransfer.mutate({ transfer: failDialog, reason: failReason })}
              disabled={rejectTransfer.isPending || !failReason.trim()}
            >
              {rejectTransfer.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Confirm Failure &amp; Notify Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Adjust Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Adjust Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm font-medium">{selectedAccount?.owner_name}</p>
              <p className="text-xs text-muted-foreground">{selectedAccount?.account_number}</p>
              <p className="text-lg font-bold mt-2">${(selectedAccount?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex gap-2">
              <Button variant={adjustType === 'credit' ? 'default' : 'outline'} className={`flex-1 ${adjustType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setAdjustType('credit')}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
              <Button variant={adjustType === 'debit' ? 'default' : 'outline'} className={`flex-1 ${adjustType === 'debit' ? 'bg-red-600 hover:bg-red-700' : ''}`} onClick={() => setAdjustType('debit')}>
                <Minus className="w-4 h-4 mr-1" /> Deduct
              </Button>
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" placeholder="0.00" min="0" step="0.01" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}