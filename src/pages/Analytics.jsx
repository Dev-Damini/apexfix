import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccount } from '@/hooks/useAccount';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const COLORS = ['#C9A84C', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const { user } = useOutletContext();
  const { account } = useAccount(user?.email);

  const { data: transactions = [] } = useQuery({
    queryKey: ['all-transactions', account?.id],
    queryFn: () => base44.entities.Transaction.filter({ account_id: account?.id }, '-created_date', 500),
    enabled: !!account?.id,
  });

  const now = new Date();

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      const label = format(date, 'MMM');
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const inRange = transactions.filter(t =>
        isWithinInterval(new Date(t.created_date), { start, end })
      );
      const income = inRange.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const expenses = inRange.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      const net = income - expenses;
      return { label, income, expenses, net };
    });
  }, [transactions]);

  const categoryData = useMemo(() => {
    const cats = {};
    transactions.filter(t => t.type === 'debit').forEach(t => {
      const cat = t.category || 'other';
      cats[cat] = (cats[cat] || 0) + t.amount;
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const categoryGrowth = useMemo(() => {
    const last3 = Array.from({ length: 3 }, (_, i) => {
      const date = subMonths(now, 2 - i);
      return { label: format(date, 'MMM'), start: startOfMonth(date), end: endOfMonth(date) };
    });
    const topCats = categoryData.slice(0, 4).map(c => c.name.toLowerCase());
    return last3.map(({ label, start, end }) => {
      const inRange = transactions.filter(t =>
        t.type === 'debit' && isWithinInterval(new Date(t.created_date), { start, end })
      );
      const row = { label };
      topCats.forEach(cat => {
        row[cat] = inRange.filter(t => (t.category || 'other') === cat).reduce((s, t) => s + t.amount, 0);
      });
      return row;
    });
  }, [transactions, categoryData]);

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;
  const avgMonthlySpend = (totalExpenses / 6).toFixed(0);

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const topCatKeys = categoryData.slice(0, 4).map(c => c.name.toLowerCase());

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl lg:text-3xl font-bold">Financial Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your financial performance over the last 6 months</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Income', value: fmt(totalIncome), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+' },
          { label: 'Total Expenses', value: fmt(totalExpenses), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', trend: '-' },
          { label: 'Savings Rate', value: `${savingsRate}%`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', trend: '' },
          { label: 'Avg Monthly Spend', value: fmt(avgMonthlySpend), icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50', trend: '' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-4"
          >
            <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className="text-lg font-bold font-heading">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Income vs Expenses Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Income vs Expenses — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#C9A84C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Monthly Spending Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Monthly Spending Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
            <Area type="monotone" dataKey="expenses" name="Spending" stroke="#C9A84C" fill="url(#expGrad)" strokeWidth={2} dot={{ r: 4, fill: '#C9A84C' }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading text-base font-semibold mb-4">Spending by Category</h3>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{cat.name}</span>
                    <span className="font-medium ml-auto">{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Category Growth */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading text-base font-semibold mb-4">Category Growth (Last 3 Months)</h3>
          {categoryGrowth.length === 0 || topCatKeys.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={categoryGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Legend />
                {topCatKeys.map((cat, i) => (
                  <Line key={cat} type="monotone" dataKey={cat} name={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}