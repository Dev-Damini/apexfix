import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, RepeatIcon, Pause, Play, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const FREQ_LABELS = { weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly' };

export default function RecurringTransfers({ user, account }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    to_account_number: '',
    to_account_name: '',
    amount: '',
    description: '',
    frequency: 'monthly',
    next_run_date: '',
    end_date: '',
  });
  const [saving, setSaving] = useState(false);

  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ['recurringTransfers', user?.email],
    queryFn: () => base44.entities.RecurringTransfer.filter({ owner_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const handleCreate = async () => {
    if (!form.to_account_number || !form.amount || !form.next_run_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    await base44.entities.RecurringTransfer.create({
      owner_email: user.email,
      from_account_id: account?.id,
      to_account_number: form.to_account_number,
      to_account_name: form.to_account_name,
      amount: parseFloat(form.amount),
      description: form.description,
      frequency: form.frequency,
      next_run_date: form.next_run_date,
      end_date: form.end_date || undefined,
      status: 'active',
      runs_completed: 0,
    });
    queryClient.invalidateQueries({ queryKey: ['recurringTransfers'] });
    toast.success('Recurring transfer created!');
    setSaving(false);
    setOpen(false);
    setForm({ to_account_number: '', to_account_name: '', amount: '', description: '', frequency: 'monthly', next_run_date: '', end_date: '' });
  };

  const toggleStatus = async (rec) => {
    const newStatus = rec.status === 'active' ? 'paused' : 'active';
    await base44.entities.RecurringTransfer.update(rec.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['recurringTransfers'] });
    toast.success(`Recurring transfer ${newStatus}`);
  };

  const cancelRecurring = async (rec) => {
    await base44.entities.RecurringTransfer.update(rec.id, { status: 'cancelled' });
    queryClient.invalidateQueries({ queryKey: ['recurringTransfers'] });
    toast.success('Recurring transfer cancelled');
  };

  const active = recurring.filter(r => r.status !== 'cancelled');
  const cancelled = recurring.filter(r => r.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Recurring Transfers</h2>
          <p className="text-sm text-muted-foreground">Automate bill payments and regular transfers</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
          <PlusCircle className="w-4 h-4" /> New Recurring
        </Button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground text-sm">Loading...</div>
      ) : active.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <RepeatIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium">No recurring transfers set up</p>
          <p className="text-sm text-muted-foreground mt-1">Automate your bill payments, rent, or subscriptions.</p>
          <Button onClick={() => setOpen(true)} variant="outline" className="mt-4">Create One</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((rec, i) => (
            <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rec.status === 'active' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <RepeatIcon className={`w-4 h-4 ${rec.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{rec.to_account_name || rec.to_account_number}</p>
                  <p className="text-xs text-muted-foreground">{rec.to_account_number} · ${rec.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} · {FREQ_LABELS[rec.frequency]}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[10px] ${rec.status === 'active' ? 'text-emerald-600 border-emerald-200' : rec.status === 'paused' ? 'text-amber-600 border-amber-200' : 'text-muted-foreground'}`}>
                      {rec.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Next: {rec.next_run_date ? format(new Date(rec.next_run_date), 'MMM d, yyyy') : '—'}
                    </span>
                    {rec.end_date && <span className="text-[10px] text-muted-foreground">Ends: {format(new Date(rec.end_date), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-13 sm:ml-0">
                <Button size="icon" variant="outline" className="h-8 w-8" title={rec.status === 'active' ? 'Pause' : 'Resume'} onClick={() => toggleStatus(rec)}>
                  {rec.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300" title="Cancel" onClick={() => cancelRecurring(rec)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {cancelled.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show {cancelled.length} cancelled</summary>
          <div className="mt-2 space-y-2">
            {cancelled.map(rec => (
              <div key={rec.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 opacity-50">
                <RepeatIcon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{rec.to_account_name || rec.to_account_number}</p>
                  <p className="text-[10px] text-muted-foreground">${rec.amount?.toLocaleString()} · {FREQ_LABELS[rec.frequency]}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">cancelled</Badge>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">New Recurring Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Recipient Account Number <span className="text-red-500">*</span></Label>
              <Input className="mt-1" placeholder="10-digit account number" value={form.to_account_number} onChange={e => setForm({ ...form, to_account_number: e.target.value })} />
            </div>
            <div>
              <Label>Recipient Name</Label>
              <Input className="mt-1" placeholder="Full name / bill label" value={form.to_account_name} onChange={e => setForm({ ...form, to_account_name: e.target.value })} />
            </div>
            <div>
              <Label>Amount ($) <span className="text-red-500">*</span></Label>
              <Input className="mt-1" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>First Run Date <span className="text-red-500">*</span></Label>
              <Input className="mt-1" type="date" value={form.next_run_date} onChange={e => setForm({ ...form, next_run_date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input className="mt-1" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} min={form.next_run_date} />
            </div>
            <div>
              <Label>Note</Label>
              <Input className="mt-1" placeholder="e.g. Netflix bill" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving...' : 'Create Recurring Transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}