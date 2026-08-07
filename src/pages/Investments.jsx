import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info, ChevronRight, Clock, CheckCircle, BarChart2, PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAccount } from '@/hooks/useAccount';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format, addMonths, differenceInDays } from 'date-fns';

const PLANS = [
  { id: 'starter', name: 'Starter Plan', icon: '🌱', roiRate: 5.2, risk: 'Low', minAmount: 100, durationMonths: 6, color: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20', badge: 'bg-emerald-100 text-emerald-700', riskColor: 'text-emerald-600', recommended: false },
  { id: 'growth', name: 'Growth Plan', icon: '📈', roiRate: 11.5, risk: 'Medium', minAmount: 500, durationMonths: 12, color: 'border-primary/30 bg-primary/5', badge: 'bg-primary/10 text-primary', riskColor: 'text-amber-600', recommended: true },
  { id: 'premium', name: 'Premium Plan', icon: '💎', roiRate: 22, risk: 'High', minAmount: 2000, durationMonths: 24, color: 'border-purple-200 bg-purple-50 dark:bg-purple-950/20', badge: 'bg-purple-100 text-purple-700', riskColor: 'text-red-600', recommended: false },
  { id: 'fixed', name: 'Fixed Deposit', icon: '🏦', roiRate: 7.0, risk: 'None', minAmount: 1000, durationMonths: 12, color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20', badge: 'bg-blue-100 text-blue-700', riskColor: 'text-blue-600', recommended: false },
];

function calcCurrentValue(inv) {
  const start = new Date(inv.start_date);
  const now = new Date();
  const maturity = new Date(inv.maturity_date);
  const effectiveDate = now > maturity ? maturity : now;
  const elapsedDays = Math.max(0, differenceInDays(effectiveDate, start));
  return inv.amount_invested * (1 + (inv.roi_rate / 100) * (elapsedDays / 365));
}

function calcProgress(inv) {
  const start = new Date(inv.start_date);
  const maturity = new Date(inv.maturity_date);
  const now = new Date();
  const total = differenceInDays(maturity, start);
  const elapsed = Math.min(differenceInDays(now, start), total);
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
}

export default function Investments() {
  const { user } = useOutletContext();
  const { account } = useAccount(user?.email);
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('portfolio'); // portfolio | plans

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ['investments', user?.email],
    queryFn: () => base44.entities.Investment.filter({ owner_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const activeInvestments = investments.filter(i => i.status === 'active');
  const maturedInvestments = investments.filter(i => i.status !== 'active');

  const totalInvested = activeInvestments.reduce((s, i) => s + i.amount_invested, 0);
  const totalCurrentValue = activeInvestments.reduce((s, i) => s + calcCurrentValue(i), 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalROI = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

  const invest = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < selectedPlan.minAmount) return toast.error(`Minimum investment is $${selectedPlan.minAmount}`);
    if (amt > (account?.balance || 0)) return toast.error('Insufficient balance');
    setLoading(true);
    const startDate = new Date();
    const maturityDate = addMonths(startDate, selectedPlan.durationMonths);
    const ref = 'INV' + Date.now().toString(36).toUpperCase();

    await base44.entities.Account.update(account.id, { balance: account.balance - amt });
    await base44.entities.Investment.create({
      owner_email: user.email,
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      amount_invested: amt,
      roi_rate: selectedPlan.roiRate,
      duration_months: selectedPlan.durationMonths,
      start_date: format(startDate, 'yyyy-MM-dd'),
      maturity_date: format(maturityDate, 'yyyy-MM-dd'),
      current_value: amt,
      status: 'active',
      reference: ref,
    });
    await base44.entities.Transaction.create({
      account_id: account.id,
      type: 'debit',
      amount: amt,
      description: `Investment: ${selectedPlan.name}`,
      category: 'transfer',
      status: 'completed',
      reference: ref,
      owner_email: user.email,
    });
    await base44.entities.Notification.create({
      owner_email: user.email,
      title: `Investment Started — $${amt.toLocaleString()}`,
      message: `Your $${amt.toLocaleString()} investment in ${selectedPlan.name} is now active. Expected maturity: ${format(maturityDate, 'MMM d, yyyy')}.`,
      type: 'admin',
      amount: amt,
      reference: ref,
    });
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success(`Invested $${amt.toLocaleString()} in ${selectedPlan.name}!`);
    setSelectedPlan(null);
    setAmount('');
    setTab('portfolio');
    setLoading(false);
  };

  const withdrawMatured = async (inv) => {
    const value = calcCurrentValue(inv);
    await base44.entities.Account.update(account.id, { balance: (account.balance || 0) + value });
    await base44.entities.Investment.update(inv.id, { status: 'withdrawn', current_value: value });
    await base44.entities.Transaction.create({
      account_id: account.id,
      type: 'credit',
      amount: value,
      description: `Investment Withdrawal: ${inv.plan_name}`,
      category: 'deposit',
      status: 'completed',
      reference: inv.reference,
      owner_email: user.email,
    });
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success(`$${value.toFixed(2)} credited to your account!`);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold">Investments</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and grow your investment portfolio</p>
        </div>
        <Button onClick={() => setTab('plans')} className="bg-primary hover:bg-primary/90 gap-2">
          <PlusCircle className="w-4 h-4" /> Invest
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {[['portfolio', 'Portfolio'], ['plans', 'Plans'], ['history', 'History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* PORTFOLIO TAB */}
      {tab === 'portfolio' && (
        <div className="space-y-6">
          {/* Stats Banner */}
          <div className="bg-foreground text-white rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Portfolio Value</p>
                <p className="font-heading text-4xl font-bold text-primary">${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center gap-2 mt-2">
                  {totalProfit >= 0
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />}
                  <span className={`text-sm font-semibold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} ({totalROI.toFixed(2)}% ROI)
                  </span>
                </div>
              </div>
              <div className="flex gap-6 sm:gap-8">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Invested</p>
                  <p className="font-semibold text-white/90">${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Active Plans</p>
                  <p className="font-semibold text-white/90">{activeInvestments.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Total Profit</p>
                  <p className={`font-semibold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${totalProfit.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Investments */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeInvestments.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">No active investments yet.</p>
              <Button onClick={() => setTab('plans')} variant="outline" className="mt-4">Browse Plans</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-semibold">Active Investments</h2>
              {activeInvestments.map((inv, i) => {
                const plan = PLANS.find(p => p.id === inv.plan_id) || {};
                const currentVal = calcCurrentValue(inv);
                const profit = currentVal - inv.amount_invested;
                const progress = calcProgress(inv);
                const isMatured = new Date() >= new Date(inv.maturity_date);
                return (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`bg-card border rounded-2xl p-5 ${plan.color || 'border-border'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{plan.icon || '📊'}</span>
                        <div>
                          <p className="font-semibold">{inv.plan_name}</p>
                          <p className="text-xs text-muted-foreground">{inv.roi_rate}% p.a. · {inv.duration_months} months</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${currentVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className={`text-xs font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {profit >= 0 ? '+' : ''}${profit.toFixed(2)} ({((profit / inv.amount_invested) * 100).toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Started {format(new Date(inv.start_date), 'MMM d, yyyy')}</span>
                        <span>Matures {format(new Date(inv.maturity_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${isMatured ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{progress.toFixed(0)}% complete</span>
                        {isMatured && (
                          <Button size="sm" onClick={() => withdrawMatured(inv)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7">
                            Withdraw Returns
                          </Button>
                        )}
                        {!isMatured && <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">Active</Badge>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PLANS TAB */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`relative rounded-2xl border p-6 ${plan.color}`}>
                {plan.recommended && (
                  <span className="absolute -top-3 left-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">⭐ Most Popular</span>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-3xl">{plan.icon}</span>
                    <h3 className="font-heading text-lg font-bold mt-2">{plan.name}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${plan.badge}`}>{plan.durationMonths} mo</span>
                </div>
                <p className="font-heading text-3xl font-bold text-foreground mb-1">{plan.roiRate}% p.a.</p>
                <p className={`text-xs font-semibold mb-4 ${plan.riskColor}`}>Risk: {plan.risk}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Min: ${plan.minAmount.toLocaleString()}</p>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => { setSelectedPlan(plan); setAmount(''); }}>
                    Invest Now <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">Investment returns are projected and not guaranteed. Apex Bank is not a registered investment advisor.</p>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="space-y-4">
          {maturedInvestments.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">No completed investments yet.</p>
            </div>
          ) : maturedInvestments.map(inv => {
            const profit = (inv.current_value || inv.amount_invested) - inv.amount_invested;
            return (
              <div key={inv.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{inv.plan_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(inv.start_date), 'MMM d, yyyy')} → {format(new Date(inv.maturity_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(inv.current_value || inv.amount_invested).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className={`text-xs ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)} profit
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-1 capitalize">{inv.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invest Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Invest in {selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4 pt-2">
              <div className={`rounded-xl p-4 ${selectedPlan.color} border`}>
                <p className="text-sm font-semibold">{selectedPlan.roiRate}% p.a. · {selectedPlan.durationMonths} months</p>
                <p className="text-xs text-muted-foreground mt-1">Risk: {selectedPlan.risk} · Min: ${selectedPlan.minAmount.toLocaleString()}</p>
              </div>
              <div>
                <Label>Investment Amount ($)</Label>
                <Input type="number" className="mt-1" placeholder={`Min $${selectedPlan.minAmount}`} value={amount} onChange={e => setAmount(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Balance: ${(account?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              {amount && parseFloat(amount) >= selectedPlan.minAmount && (
                <div className="bg-secondary rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invested</span>
                    <span className="font-semibold">${parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected profit</span>
                    <span className="font-semibold text-emerald-600">
                      +${(parseFloat(amount) * selectedPlan.roiRate / 100 * selectedPlan.durationMonths / 12).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total at maturity</span>
                    <span className="text-primary">
                      ${(parseFloat(amount) * (1 + selectedPlan.roiRate / 100 * selectedPlan.durationMonths / 12)).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Matures {format(addMonths(new Date(), selectedPlan.durationMonths), 'MMM d, yyyy')}</p>
                </div>
              )}
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={invest} disabled={loading}>
                {loading ? 'Processing...' : 'Confirm Investment'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}