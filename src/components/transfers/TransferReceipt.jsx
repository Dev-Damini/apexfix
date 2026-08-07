import React, { useRef } from 'react';
import { CheckCircle, XCircle, Printer, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function TransferReceipt({ receipt, onClose }) {
  const receiptRef = useRef(null);
  const isSuccess = receipt.status === 'completed' || receipt.status === 'scheduled';
  const isScheduled = receipt.status === 'scheduled';

  const print = () => {
    const el = receiptRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>ApexBank Transfer Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 480px; margin: 0 auto; color: #1a1a1a; }
        .header { text-align:center; margin-bottom:30px; }
        .bank { font-size:24px; font-weight:bold; } .bank span{color:#c9a84c;}
        .status-icon { font-size:48px; display:block; margin:16px auto; text-align:center; }
        .status-text { font-size:20px; font-weight:bold; text-align:center; margin-bottom:4px; }
        .status-sub { font-size:13px; text-align:center; color:#888; margin-bottom:20px; }
        .amount { text-align:center; font-size:40px; font-weight:bold; color:${isSuccess ? '#c9a84c' : '#dc2626'}; margin:20px 0; }
        .divider { border:none; border-top:1px dashed #ddd; margin:20px 0; }
        .row { display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px; }
        .label { color:#888; } .val { font-weight:600; }
        .ref { background:#f5f5f5; border-radius:8px; padding:12px; text-align:center; margin:20px 0; font-family:monospace; font-size:14px; font-weight:bold; letter-spacing:1px; }
        .footer { text-align:center; font-size:11px; color:#aaa; margin-top:30px; }
      </style></head><body>
      <div class="header">
        <div class="bank">Apex<span>Bank</span></div>
        <div style="font-size:11px;color:#aaa;letter-spacing:2px;text-transform:uppercase;">Transfer Receipt</div>
      </div>
      <div class="status-icon">${isScheduled ? '🕐' : isSuccess ? '✅' : '❌'}</div>
      <div class="status-text">${isScheduled ? 'Transfer Scheduled' : isSuccess ? 'Transfer Successful' : 'Transfer Failed'}</div>
      <div class="status-sub">${receipt.date ? format(new Date(receipt.date), 'MMMM dd, yyyy · hh:mm a') : ''}</div>
      <div class="amount">$${(receipt.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <hr class="divider"/>
      <div class="row"><span class="label">From</span><span class="val">${receipt.from_name} (${receipt.from_account})</span></div>
      <div class="row"><span class="label">To</span><span class="val">${receipt.to_account_name || receipt.to_account_number}</span></div>
      <div class="row"><span class="label">Account</span><span class="val">${receipt.to_account_number}</span></div>
      ${receipt.bank_name ? `<div class="row"><span class="label">Bank</span><span class="val">${receipt.bank_name}</span></div>` : ''}
      ${receipt.swift_code ? `<div class="row"><span class="label">SWIFT</span><span class="val">${receipt.swift_code}</span></div>` : ''}
      <div class="row"><span class="label">Type</span><span class="val">${receipt.type?.toUpperCase()}</span></div>
      ${receipt.description ? `<div class="row"><span class="label">Memo</span><span class="val">${receipt.description}</span></div>` : ''}
      <div class="ref">REF: ${receipt.ref}</div>
      ${receipt.error ? `<div style="color:#dc2626;font-size:12px;text-align:center;">Reason: ${receipt.error}</div>` : ''}
      <div class="footer">ApexBank · 1 Apex Financial Tower, NY · This is an official receipt.</div>
      </body></html>`);
    win.document.close();
    win.onload = () => win.print();
  };

  return (
    <div ref={receiptRef} className="bg-white">
      {/* Top colored bar */}
      <div className={`h-2 ${isSuccess ? 'bg-primary' : 'bg-destructive'}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-xl font-bold">Apex<span className="text-primary">Bank</span></h2>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Transfer Receipt</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          {isScheduled ? (
            <Clock className="w-14 h-14 text-blue-500 mx-auto mb-3" />
          ) : isSuccess ? (
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          ) : (
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-3" />
          )}
          <p className="font-heading text-xl font-bold">
            {isScheduled ? 'Transfer Scheduled' : isSuccess ? 'Transfer Successful' : 'Transfer Failed'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {receipt.date ? format(new Date(receipt.date), 'MMMM dd, yyyy · hh:mm a') : ''}
          </p>
        </div>

        {/* Amount */}
        <div className={`text-center rounded-2xl p-5 mb-6 ${isSuccess ? 'bg-primary/5 border border-primary/20' : 'bg-destructive/5 border border-destructive/20'}`}>
          <p className="text-xs text-muted-foreground mb-1">Amount</p>
          <p className={`font-heading text-4xl font-bold ${isSuccess ? 'text-primary' : 'text-destructive'}`}>
            ${(receipt.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-2.5 mb-5">
          {[
            { label: 'From', value: `${receipt.from_name} (${receipt.from_account})` },
            { label: 'To', value: `${receipt.to_account_name || receipt.to_account_number}` },
            { label: 'Account', value: receipt.to_account_number },
            receipt.bank_name && { label: 'Bank', value: receipt.bank_name },
            receipt.swift_code && { label: 'SWIFT/BIC', value: receipt.swift_code },
            { label: 'Type', value: receipt.type?.toUpperCase() },
            receipt.description && { label: 'Memo', value: receipt.description },
            { label: 'Status', value: receipt.status?.toUpperCase() },
          ].filter(Boolean).map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium max-w-[60%] text-right">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Reference */}
        <div className="bg-secondary rounded-xl p-3 text-center mb-5">
          <p className="text-xs text-muted-foreground mb-1">Reference Number</p>
          <p className="font-mono text-sm font-bold tracking-widest text-primary">{receipt.ref}</p>
        </div>

        {receipt.error && (
          <p className="text-xs text-destructive text-center mb-4 bg-destructive/5 rounded-lg p-3">
            Reason: {receipt.error}
          </p>
        )}

        <Button className="w-full bg-primary hover:bg-primary/90" onClick={print}>
          <Printer className="w-4 h-4 mr-2" /> Print / Save Receipt
        </Button>
      </div>
    </div>
  );
}