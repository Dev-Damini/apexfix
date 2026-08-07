import React, { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccount } from '@/hooks/useAccount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Send, Clock, Loader2, CheckCircle, AlertCircle, Calendar, Globe, ArrowLeft, ChevronRight, Smartphone, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import TransferReceipt from '@/components/transfers/TransferReceipt';
import RecurringTransfers from '@/components/transfers/RecurringTransfers';
import PinVerification from '@/components/shared/PinVerification';

function generateRef() {
  return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

const transferTypes = [
  { id: 'bank', label: 'Bank Account', icon: Send, desc: 'Transfer to any bank account number' },
  { id: 'cashapp', label: 'Cash App', icon: Smartphone, desc: 'Send to a $Cashtag instantly' },
  { id: 'zelle', label: 'Zelle', icon: Smartphone, desc: 'Send via email or phone number' },
  { id: 'scheduled', label: 'Scheduled', icon: Calendar, desc: 'Schedule a future transfer' },
  { id: 'wire', label: 'Wire Transfer', icon: Globe, desc: 'International wire, 1-3 business days' },
];

const STEPS = ['Method', 'Details', 'Confirm'];

export default function Transfers() {
  const { user } = useOutletContext();
  const { account } = useAccount(user?.email);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [mainTab, setMainTab] = useState('new');
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState(searchParams.get('type') === 'wire' ? 'wire' : null);
  const [form, setForm] = useState({
    to_account_number: '',
    to_account_name: '',
    amount: '',
    description: '',
    scheduled_date: '',
    bank_name: '',
    routing_number: '',
    swift_code: '',
    bank_address: '',
    tag: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [processing, setProcessing] = useState(false);
  const FEE = selectedType === 'wire' ? 25 : 2.50;

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers', user?.email],
    queryFn: () => base44.entities.Transfer.filter({ owner_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const handleSelectType = (typeId) => {
    setSelectedType(typeId);
    setStep(1);
  };

  const handleNext = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (selectedType === 'bank' || selectedType === 'scheduled' || selectedType === 'wire') {
      if (!form.to_account_number) { toast.error('Enter an account number'); return; }
    }
    if (selectedType === 'cashapp' && !form.tag) { toast.error('Enter a $Cashtag'); return; }
    if (selectedType === 'zelle' && !form.tag) { toast.error('Enter email or phone for Zelle'); return; }
    setStep(2);
  };

  const handleConfirm = () => {
    if (!user?.transaction_pin) {
      toast.error('Please set a transaction PIN in Settings first');
      return;
    }
    setShowPin(true);
  };

  const handlePinConfirm = (enteredPin, onError) => {
    if (enteredPin !== user?.transaction_pin) {
      onError('Incorrect PIN. Please try again.');
      return;
    }
    setShowPin(false);
    setProcessing(true);
    setTimeout(() => transferMutation.mutate(), 600);
  };

  const transferMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(form.amount);
      const fee = FEE;
      const totalDeduct = amount + fee;
      if (totalDeduct > (account?.balance || 0)) throw new Error(`Insufficient funds. Total with $${fee.toFixed(2)} fee: $${totalDeduct.toFixed(2)}`);

      const ref = generateRef();
      const isScheduled = selectedType === 'scheduled';
      const isWire = selectedType === 'wire';
      const isTag = selectedType === 'cashapp' || selectedType === 'zelle';
      const recipientLabel = isTag ? form.tag : (form.to_account_name || form.to_account_number);
      const accountField = isTag ? form.tag : form.to_account_number;

      const transfer = await base44.entities.Transfer.create({
        from_account_id: account.id,
        to_account_number: accountField,
        to_account_name: form.to_account_name || form.tag,
        amount,
        description: isWire ? `Wire Transfer - ${form.bank_name}` : (form.description || `${selectedType === 'cashapp' ? 'CashApp' : selectedType === 'zelle' ? 'Zelle' : 'Bank'} Transfer`),
        transfer_type: isScheduled ? 'scheduled' : 'instant',
        scheduled_date: isScheduled ? form.scheduled_date : undefined,
        status: isScheduled ? 'scheduled' : 'pending',
        reference: ref,
        owner_email: user.email,
      });

      if (!isScheduled) {
        await base44.entities.Account.update(account.id, { balance: account.balance - totalDeduct });
        await base44.entities.Transaction.create({
          account_id: account.id,
          type: 'debit',
          amount,
          description: isWire ? `Wire to ${recipientLabel}` : `Transfer to ${recipientLabel}`,
          category: 'transfer',
          status: 'completed',
          reference: ref,
          recipient_account: accountField,
          owner_email: user.email,
        });

        if (selectedType === 'bank') {
          const recipientAccounts = await base44.entities.Account.filter({ account_number: form.to_account_number });
          if (recipientAccounts.length > 0) {
            const recipient = recipientAccounts[0];
            await base44.entities.Account.update(recipient.id, { balance: recipient.balance + amount });
            await base44.entities.Transaction.create({
              account_id: recipient.id,
              type: 'credit',
              amount,
              description: `Transfer from ${account.owner_name || account.account_number}`,
              category: 'transfer',
              status: 'completed',
              reference: ref,
              sender_account: account.account_number,
              owner_email: recipient.owner_email,
            });
          }
        }
      }

      return { transfer, ref, amount, isWire, isScheduled, recipientLabel };
    },
    onSuccess: async (data) => {
      setProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (!data.isScheduled) {
        base44.entities.Notification.create({
          owner_email: user.email,
          title: `Transfer Sent — $${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          message: `You sent $${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${data.recipientLabel}. Ref: ${data.ref}`,
          type: 'transfer_out',
          amount: data.amount,
          reference: data.ref,
        });
        base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `ApexBank: Transfer of $${data.amount.toFixed(2)} sent`,
          body: `Hi ${user.full_name || 'there'},\n\nYour transfer of $${data.amount.toFixed(2)} to ${data.recipientLabel} has been initiated.\n\nReference: ${data.ref}\n\nThank you for banking with Apex Bank.`,
        }).catch(() => {});
      }
      setReceipt({
        status: data.isScheduled ? 'scheduled' : 'completed',
        ref: data.ref,
        amount: data.amount,
        to_account_number: form.to_account_number || form.tag,
        to_account_name: form.to_account_name || form.tag,
        from_account: account?.account_number,
        from_name: account?.owner_name || user?.full_name,
        description: form.description,
        type: data.isWire ? 'wire' : (data.isScheduled ? 'scheduled' : selectedType),
        bank_name: form.bank_name,
        swift_code: form.swift_code,
        date: new Date().toISOString(),
      });
      setStep(0);
      setSelectedType(null);
      setForm({ to_account_number: '', to_account_name: '', amount: '', description: '', scheduled_date: '', bank_name: '', routing_number: '', swift_code: '', bank_address: '', tag: '' });
    },
    onError: (err) => {
      setProcessing(false);
      toast.error(err.message);
    },
  });

  const statusIcons = {
    completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    scheduled: <Clock className="w-4 h-4 text-blue-500" />,
    pending: <Clock className="w-4 h-4 text-amber-500" />,
    failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  const amount = parseFloat(form.amount) || 0;
  const recipientDisplay = selectedType === 'cashapp' || selectedType === 'zelle' ? form.tag : (form.to_account_name || form.to_account_number);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold">Transfers</h1>
          <p className="text-sm text-muted-foreground mt-1">Send money instantly, schedule, or wire internationally</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
          <button onClick={() => setMainTab('new')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mainTab === 'new' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            New Transfer
          </button>
          <button onClick={() => setMainTab('recurring')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mainTab === 'recurring' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Recurring
          </button>
        </div>
      </div>

      {mainTab === 'recurring' && (
        <RecurringTransfers user={user} account={account} />
      )}

      {mainTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl border border-border p-6">
              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-6">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-1.5 ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < step ? 'bg-primary text-white' : i === step ? 'bg-primary/20 text-primary ring-2 ring-primary/40' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {i < step ? <CheckCircle className="w-3 h-3" /> : i + 1}
                      </div>
                      <span className="text-xs font-medium hidden sm:block">{s}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-px transition-all ${i < step ? 'bg-primary' : 'bg-border'}`} />}
                  </React.Fragment>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Select Transfer Method</p>
                    {transferTypes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectType(t.id)}
                        className="w-full bg-secondary/40 hover:bg-primary/5 hover:border-primary/30 border border-border rounded-xl p-4 flex items-center gap-4 text-left transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15">
                          <t.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <p className="text-sm font-bold capitalize">{transferTypes.find(t => t.id === selectedType)?.label}</p>

                    {(selectedType === 'cashapp' || selectedType === 'zelle') && (
                      <>
                        <div>
                          <Label>{selectedType === 'cashapp' ? '$Cashtag' : 'Email or Phone (Zelle)'}</Label>
                          <Input className="mt-1" placeholder={selectedType === 'cashapp' ? '$YourCashtag' : 'email@example.com or +1555...'} value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} />
                        </div>
                        <div>
                          <Label>Recipient Name (optional)</Label>
                          <Input className="mt-1" placeholder="Name" value={form.to_account_name} onChange={e => setForm({ ...form, to_account_name: e.target.value })} />
                        </div>
                      </>
                    )}

                    {(selectedType === 'bank' || selectedType === 'scheduled') && (
                      <>
                        <div>
                          <Label>Recipient Account Number</Label>
                          <Input className="mt-1" placeholder="10-digit account number" value={form.to_account_number} onChange={e => setForm({ ...form, to_account_number: e.target.value })} />
                        </div>
                        <div>
                          <Label>Recipient Name</Label>
                          <Input className="mt-1" placeholder="Full name" value={form.to_account_name} onChange={e => setForm({ ...form, to_account_name: e.target.value })} />
                        </div>
                      </>
                    )}

                    {selectedType === 'scheduled' && (
                      <div>
                        <Label>Scheduled Date</Label>
                        <Input className="mt-1" type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
                      </div>
                    )}

                    {selectedType === 'wire' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-foreground">
                          <Globe className="w-4 h-4 inline mr-1 text-primary" /> Wire transfers processed in 1-3 business days. $25 fee applies.
                        </div>
                        <div className="col-span-2"><Label>Beneficiary Name</Label><Input className="mt-1" placeholder="Full legal name" value={form.to_account_name} onChange={e => setForm({ ...form, to_account_name: e.target.value })} /></div>
                        <div className="col-span-2"><Label>Account / IBAN</Label><Input className="mt-1" placeholder="Account or IBAN" value={form.to_account_number} onChange={e => setForm({ ...form, to_account_number: e.target.value })} /></div>
                        <div><Label>Bank Name</Label><Input className="mt-1" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></div>
                        <div><Label>Routing / ABA #</Label><Input className="mt-1" value={form.routing_number} onChange={e => setForm({ ...form, routing_number: e.target.value })} /></div>
                        <div><Label>SWIFT / BIC</Label><Input className="mt-1" placeholder="e.g. BOFAUS3N" value={form.swift_code} onChange={e => setForm({ ...form, swift_code: e.target.value })} /></div>
                        <div><Label>Bank Address</Label><Input className="mt-1" value={form.bank_address} onChange={e => setForm({ ...form, bank_address: e.target.value })} /></div>
                      </div>
                    )}

                    <div>
                      <Label>Amount ($)</Label>
                      <Input className="mt-1" type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                      <p className="text-xs text-muted-foreground mt-1">Available: <span className="font-semibold text-foreground">${account?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</span></p>
                    </div>

                    <div>
                      <Label>Note (optional)</Label>
                      <Textarea className="mt-1 h-16" placeholder="What's this for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleNext}>
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <p className="text-sm font-bold">Review Transfer</p>

                    <div className="bg-gradient-to-br from-foreground to-foreground/80 rounded-2xl p-5 space-y-3">
                      <div className="text-center">
                        <p className="text-white/50 text-xs uppercase tracking-widest">Sending</p>
                        <p className="text-4xl font-bold text-white mt-1">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/50">To</span>
                          <span className="text-white font-semibold">{recipientDisplay || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Method</span>
                          <span className="text-white capitalize">{transferTypes.find(t => t.id === selectedType)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Fee</span>
                          <span className="text-white">${FEE.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className="flex justify-between font-bold">
                          <span className="text-white/70">Total Deducted</span>
                          <span className="text-primary">${(amount + FEE).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {processing ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Securing transfer...</p>
                      </div>
                    ) : (
                      <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-bold" onClick={handleConfirm}>
                        <Send className="w-4 h-4 mr-2" /> Confirm Send
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Transfer History */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-5 pb-4 border-b border-border">
                <h3 className="font-heading text-lg font-semibold">Recent Transfers</h3>
              </div>
              <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
                {transfers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 px-4">No transfers yet</p>
                ) : transfers.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="px-5 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcons[t.status] || statusIcons.pending}
                        <span className="text-sm font-medium truncate max-w-[120px]">{t.to_account_name || t.to_account_number}</span>
                      </div>
                      <span className="text-sm font-semibold text-red-500">-${t.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-6">
                      <Badge variant="outline" className={`text-[10px] ${
                        t.status === 'completed' ? 'text-emerald-600 border-emerald-200' :
                        t.status === 'failed' ? 'text-red-600 border-red-200' :
                        'text-amber-600 border-amber-200'
                      }`}>{t.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{t.created_date ? format(new Date(t.created_date), 'MMM d') : ''}</span>
                    </div>
                    {t.failure_reason && (
                      <p className="text-[10px] text-red-500 mt-1 ml-6 italic">{t.failure_reason}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPin && (
          <PinVerification
            onConfirm={handlePinConfirm}
            onCancel={() => setShowPin(false)}
            title="Confirm Transfer"
            subtitle="Enter your 4-digit PIN to authorize"
          />
        )}
      </AnimatePresence>

      {receipt && (
        <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <TransferReceipt receipt={receipt} onClose={() => setReceipt(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Admin delete PIN */}
    </div>
  );
}