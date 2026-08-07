import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowLeftRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'NGN', flag: '🇳🇬', name: 'Nigerian Naira' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'ZAR', flag: '🇿🇦', name: 'South African Rand' },
  { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real' },
  { code: 'MXN', flag: '🇲🇽', name: 'Mexican Peso' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'KES', flag: '🇰🇪', name: 'Kenyan Shilling' },
  { code: 'GHS', flag: '🇬🇭', name: 'Ghanaian Cedi' },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal' },
  { code: 'QAR', flag: '🇶🇦', name: 'Qatari Riyal' },
  { code: 'PKR', flag: '🇵🇰', name: 'Pakistani Rupee' },
];

export default function CurrencyConverter() {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('NGN');
  const [amount, setAmount] = useState('1000');
  const [result, setResult] = useState(null);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const convert = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Get the current live exchange rate from ${from} to ${to}. Convert ${amount} ${from} to ${to}. Return ONLY a JSON object with keys: rate (number, the exchange rate per 1 ${from}), result (number, the converted amount), from_code, to_code.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          rate: { type: 'number' },
          result: { type: 'number' },
          from_code: { type: 'string' },
          to_code: { type: 'string' },
        },
      },
    });
    setRate(res.rate);
    setResult(res.result);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setResult(null);
    setRate(null);
  };

  const fromCur = CURRENCIES.find(c => c.code === from);
  const toCur = CURRENCIES.find(c => c.code === to);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-2xl lg:text-3xl font-bold">Currency Converter</h1>
        </div>
        <p className="text-sm text-muted-foreground">Live USD to any world currency conversion</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div>
          <Label>Amount</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
              {fromCur?.flag}
            </span>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="pl-10 text-lg font-semibold"
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 items-end">
          <div className="col-span-2">
            <Label>From</Label>
            <Select value={from} onValueChange={v => { setFrom(v); setResult(null); }}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 flex justify-center pb-1">
            <Button variant="outline" size="icon" className="rounded-full" onClick={swap}>
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="col-span-2">
            <Label>To</Label>
            <Select value={to} onValueChange={v => { setTo(v); setResult(null); }}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90 py-6 text-base font-semibold" onClick={convert} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Globe className="w-5 h-5 mr-2" />}
          {loading ? 'Getting live rate...' : 'Convert Now'}
        </Button>

        {result !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-foreground to-foreground/90 rounded-2xl p-6 text-white"
          >
            <p className="text-sm text-white/60 mb-1">Conversion Result</p>
            <div className="flex items-end gap-2 mb-3">
              <p className="font-heading text-4xl font-bold">
                {toCur?.flag} {result?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-white/60 text-sm pb-1">{to}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <p className="text-sm text-white/60">
                1 {from} = {rate?.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {to}
              </p>
              {lastUpdated && (
                <p className="text-xs text-white/40 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> {lastUpdated}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Popular Pairs */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-heading text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Popular Pairs from USD</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { to: 'NGN', rate: '~1,600' },
            { to: 'EUR', rate: '~0.92' },
            { to: 'GBP', rate: '~0.79' },
            { to: 'JPY', rate: '~149' },
            { to: 'GHS', rate: '~15.4' },
            { to: 'ZAR', rate: '~18.7' },
          ].map(p => (
            <button
              key={p.to}
              onClick={() => { setFrom('USD'); setTo(p.to); setResult(null); }}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-border transition-colors"
            >
              <span className="text-sm font-medium">USD → {p.to}</span>
              <span className="text-xs text-muted-foreground">{p.rate}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}