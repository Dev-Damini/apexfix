import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#c9a84c', '#2d6a4f', '#e63946', '#457b9d', '#f4a261'];

export default function FinancialInsights({ transactions = [], account }) {
  // Spending by category
  const debits = transactions.filter(t => t.type === 'debit');
  const credits = transactions.filter(t => t.type === 'credit');

  const totalSpent = debits.reduce((s, t) => s + (t.amount || 0), 0);
  const totalReceived = credits.reduce((s, t) => s + (t.amount || 0), 0);

  const categoryTotals = debits.reduce((acc, t) => {
    const cat = t.category || 'other';
    acc[cat] = (acc[cat] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  // Last 5 days activity
  const barData = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const dayTxns = transactions.filter(t => {
      const td = new Date(t.created_date);
      return td.toDateString() === d.toDateString();
    });
    const spent = dayTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const received = dayTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    return { label, spent, received };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-lg font-semibold">Financial Insights</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-emerald-700 font-medium">Total In</p>
          </div>
          <p className="text-xl font-bold text-emerald-700">${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-600" />
            <p className="text-xs text-red-700 font-medium">Total Out</p>
          </div>
          <p className="text-xl font-bold text-red-700">${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">5-Day Activity</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={barData} barSize={12}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v) => `$${v.toFixed(2)}`}
            />
            <Bar dataKey="received" fill="#2d6a4f" radius={[4, 4, 0, 0]} name="In" />
            <Bar dataKey="spent" fill="#e63946" radius={[4, 4, 0, 0]} name="Out" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by Category */}
      {pieData.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Spending Breakdown</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={90} height={90}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={42} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {pieData.slice(0, 4).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground capitalize">{item.name.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs font-semibold">${item.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No transactions to analyze yet</p>
      )}
    </motion.div>
  );
}