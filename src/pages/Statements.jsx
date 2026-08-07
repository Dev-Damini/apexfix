import React, { useState, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccount } from '@/hooks/useAccount';
import { FileText, Download, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

function generateStatementHTML(account, transactions, user, period) {
  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  const rows = transactions.map(t => `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:10px 8px;font-size:13px;color:#555;">${t.created_date ? format(new Date(t.created_date), 'MMM dd, yyyy') : '—'}</td>
      <td style="padding:10px 8px;font-size:13px;">${t.description || t.category || '—'}</td>
      <td style="padding:10px 8px;font-size:13px;">${t.reference || '—'}</td>
      <td style="padding:10px 8px;font-size:13px;text-align:right;color:${t.type === 'credit' ? '#16a34a' : '#dc2626'};">
        ${t.type === 'credit' ? '+' : '-'}$${(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: 'Arial', sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
      .header { display:flex; justify-content:space-between; align-items:center; border-bottom: 3px solid #c9a84c; padding-bottom: 20px; margin-bottom: 30px; }
      .bank-name { font-size: 28px; font-weight: bold; } .bank-name span { color: #c9a84c; }
      .badge { background: #c9a84c; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
      .title { font-size: 22px; font-weight: bold; margin-bottom: 6px; }
      .period { color: #888; font-size: 13px; margin-bottom: 20px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
      .info-box { background: #f9f9f9; border-radius: 10px; padding: 16px; }
      .info-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .info-val { font-size: 16px; font-weight: bold; }
      .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 30px; }
      .sum-box { border-radius: 10px; padding: 14px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1a1a1a; color: white; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      tr:nth-child(even) { background: #fafafa; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 11px; }
    </style></head><body>
    <div class="header">
      <div class="bank-name">Apex<span>Bank</span></div>
      <div>
        <div class="badge">OFFICIAL STATEMENT</div>
        <div style="font-size:11px;color:#888;margin-top:6px;text-align:right;">FDIC Insured · Premium Banking</div>
      </div>
    </div>
    <div class="title">Account Statement</div>
    <div class="period">Period: ${period} · Generated: ${format(new Date(), 'MMMM dd, yyyy')}</div>
    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">Account Holder</div>
        <div class="info-val">${account?.owner_name || user?.full_name || '—'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Email</div>
        <div class="info-val" style="font-size:13px;">${user?.email || '—'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Account Number</div>
        <div class="info-val" style="font-family:monospace;">${account?.account_number || '—'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Current Balance</div>
        <div class="info-val" style="color:#c9a84c;">$${(account?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>
    <div class="summary">
      <div class="sum-box" style="background:#f0fdf4;">
        <div class="info-label">Total Credits</div>
        <div class="info-val" style="color:#16a34a;">+$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="sum-box" style="background:#fef2f2;">
        <div class="info-label">Total Debits</div>
        <div class="info-val" style="color:#dc2626;">-$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="sum-box" style="background:#fff7ed;">
        <div class="info-label">Net Flow</div>
        <div class="info-val" style="color:#c9a84c;">$${(totalCredits - totalDebits).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>Date</th><th>Description</th><th>Reference</th><th style="text-align:right;">Amount</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">No transactions in this period</td></tr>'}</tbody>
    </table>
    <div class="footer">
      ApexBank · 1 Apex Financial Tower, Wall Street, NY 10005 · 1-800-APEXBANK<br>
      This statement is auto-generated and is an official record of your account activity.
    </div>
  </body></html>`;
}

export default function Statements() {
  const { user } = useOutletContext();
  const { account } = useAccount(user?.email);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [generating, setGenerating] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions-all', account?.id],
    queryFn: () => base44.entities.Transaction.filter({ account_id: account?.id }, '-created_date', 200),
    enabled: !!account?.id,
    initialData: [],
  });

  const months = useMemo(() => {
    const seen = new Set();
    const list = [{ value: 'all', label: 'All Time' }];
    transactions.forEach(t => {
      if (!t.created_date) return;
      const d = new Date(t.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ value: key, label: format(d, 'MMMM yyyy') });
      }
    });
    return list;
  }, [transactions]);

  const filtered = selectedMonth === 'all' ? transactions : transactions.filter(t => {
    if (!t.created_date) return false;
    const d = new Date(t.created_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
  });

  const downloadPDF = () => {
    setGenerating(true);
    const period = months.find(m => m.value === selectedMonth)?.label || 'All Time';
    const html = generateStatementHTML(account, filtered, user, period);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.print();
      setGenerating(false);
    };
    toast.success('Statement opened for printing/saving as PDF');
  };

  const totalCredits = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-2xl lg:text-3xl font-bold">PDF Statements</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Download official account statements</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-primary/90" onClick={downloadPDF} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Credits', value: `+$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Debits', value: `-$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Net Flow', value: `$${(totalCredits - totalDebits).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-primary', bg: 'bg-primary/5' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-border`}>
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <p className="font-heading font-semibold">{filtered.length} Transactions</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No transactions in this period</p>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30"
              >
                <div>
                  <p className="text-sm font-medium">{t.description || t.category}</p>
                  <p className="text-xs text-muted-foreground">{t.created_date ? format(new Date(t.created_date), 'MMM dd, yyyy') : ''} · {t.reference}</p>
                </div>
                <p className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'credit' ? '+' : '-'}${(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}