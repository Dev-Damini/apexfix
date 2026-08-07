import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Share2, Check, ChevronRight, X, Info } from 'lucide-react';
import SecurityBadge from '@/components/shared/SecurityBadge';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/hooks/useAccount';
import { toast } from 'sonner';
import GiftCardDeposit from '@/components/deposit/GiftCardDeposit';

const QR_PLACEHOLDER = (address) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(address)}&color=000000&bgcolor=ffffff&margin=10`;

const cryptoAssets = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Network',
    address: 'bc1qtmhz8ywjax4y300qu60ypn68y0hzh9kw5xgktt',
    color: 'bg-orange-100 text-orange-600',
    logo: null,
    isBTC: true,
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'ERC-20',
    address: '0xcF3DF53fdb1c36CB245fAf8C87542F59fd469c1A',
    color: 'bg-blue-100 text-blue-600',
    logo: 'Ξ',
  },
  {
    id: 'usdt_trc',
    name: 'USDT',
    symbol: 'USDT',
    network: 'TRC-20 (TRON)',
    address: 'TPrkEJohRjyuisvvxCRfXXNyr4AmQ4q5mw',
    color: 'bg-emerald-100 text-emerald-600',
    logo: '₮',
  },
  {
    id: 'usdt_erc',
    name: 'USDT',
    symbol: 'USDT',
    network: 'ERC-20 (Ethereum)',
    address: '0xcF3DF53fdb1c36CB245fAf8C87542F59fd469c1A',
    color: 'bg-emerald-100 text-emerald-600',
    logo: '₮',
  },
  {
    id: 'bnb',
    name: 'BNB',
    symbol: 'BNB',
    network: 'BEP-20 (BSC)',
    address: '0xcF3DF53fdb1c36CB245fAf8C87542F59fd469c1A',
    color: 'bg-yellow-100 text-yellow-600',
    logo: 'B',
  },
];

const depositMethods = [
  {
    id: 'wire',
    icon: '🏦',
    label: 'Wire Transfer / ACH',
    desc: 'Transfer from any US bank account — free, 1–3 days',
    contact: true,
  },
  {
    id: 'card',
    icon: '💳',
    label: 'Debit / Credit Card',
    desc: 'Visa, Mastercard, Discover — instant deposit',
    contact: true,
  },
  {
    id: 'zelle',
    icon: null,
    logo: 'https://img.icons8.com/color/96/zelle.png',
    label: 'Zelle®',
    desc: 'Send money directly using your email or phone number',
    contact: true,
  },
  {
    id: 'paypal',
    icon: null,
    logo: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg',
    label: 'PayPal',
    desc: 'Link your PayPal account to fund instantly',
    contact: true,
  },
  {
    id: 'cashapp',
    icon: null,
    logo: null,
    isCashApp: true,
    label: 'Cash App',
    desc: 'Send via $Cashtag — instant, no fees',
    contact: true,
  },
  {
    id: 'crypto',
    icon: '₿',
    label: 'Cryptocurrency',
    desc: 'BTC, ETH, USDT (TRC20/ERC20), BNB — auto-credited',
    contact: false,
    isCrypto: true,
  },
  {
    id: 'giftcard',
    icon: '🎁',
    label: 'Gift Cards',
    desc: 'Amazon, Apple, Visa & more — upload card details for credit',
    contact: false,
    isGiftCard: true,
  },
];

function CryptoDeposit({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  const copy = (address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (selected) return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-sm">{selected.name} ({selected.symbol})</p>
          <p className="text-xs text-muted-foreground">{selected.network}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Only send <strong>{selected.symbol}</strong> on the <strong>{selected.network}</strong> network to this address. Sending the wrong asset may result in permanent loss.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="p-3 bg-white rounded-2xl border border-border shadow-sm">
            <img
              src={QR_PLACEHOLDER(selected.address)}
              alt="QR Code"
              className="w-44 h-44"
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Deposit Address</p>
          <div className="bg-secondary rounded-xl p-3 flex items-center gap-2">
            <p className="text-xs font-mono flex-1 break-all text-foreground">{selected.address}</p>
            <button
              onClick={() => copy(selected.address)}
              className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3">
          <div><p className="font-semibold text-foreground">Network</p><p>{selected.network}</p></div>
          <div><p className="font-semibold text-foreground">Min. Deposit</p><p>$10 equivalent</p></div>
          <div><p className="font-semibold text-foreground">Confirmations</p><p>3 required</p></div>
          <div><p className="font-semibold text-foreground">Arrival Time</p><p>~10–30 minutes</p></div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-sm">Crypto Deposit</p>
          <p className="text-xs text-muted-foreground">Select a cryptocurrency to deposit</p>
        </div>
      </div>
      <div className="space-y-2">
        {cryptoAssets.map(asset => (
          <button
            key={asset.id}
            onClick={() => setSelected(asset)}
            className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-secondary/60 hover:border-primary/30 transition-all text-left"
          >
            <div className={`w-10 h-10 rounded-full ${asset.color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
              {asset.logo}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{asset.name} <span className="text-muted-foreground font-normal">({asset.symbol})</span></p>
              <p className="text-xs text-muted-foreground">{asset.network}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ContactSupportModal({ method, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-heading text-lg font-bold">Contact Support</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-2xl">
          {method?.icon}
        </div>
        <div className="text-center">
          <p className="font-semibold">{method?.label}</p>
          <p className="text-sm text-muted-foreground mt-1">
            To complete your deposit via <strong>{method?.label}</strong>, please contact our support team. A specialist will assist you with the process and verify your payment.
          </p>
        </div>
        <div className="bg-secondary rounded-xl p-3 space-y-1 text-xs">
          <p className="font-semibold">Available Support Hours</p>
          <p className="text-muted-foreground">Mon–Fri: 8:00 AM – 8:00 PM EST</p>
          <p className="text-muted-foreground">Sat–Sun: 10:00 AM – 4:00 PM EST</p>
        </div>
        <Button className="w-full bg-primary hover:bg-primary/90" onClick={onClose}>
          Open Support Chat
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function Deposit() {
  const { user } = useOutletContext();
  const { account } = useAccount(user?.email);
  const navigate = useNavigate();
  const [view, setView] = useState('main'); // 'main' | 'crypto' | 'giftcard'
  const [contactMethod, setContactMethod] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyAccountNumber = () => {
    if (!account?.account_number) return;
    navigator.clipboard.writeText(account.account_number);
    setCopied(true);
    toast.success('Account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMethod = (method) => {
    if (method.isCrypto) {
      setView('crypto');
    } else if (method.isGiftCard) {
      setView('giftcard');
    } else {
      setContactMethod(method);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto pb-24 lg:pb-8">
      <AnimatePresence mode="wait">
        {view === 'crypto' ? (
          <CryptoDeposit key="crypto" onBack={() => setView('main')} />
        ) : view === 'giftcard' ? (
          <GiftCardDeposit key="giftcard" onBack={() => setView('main')} user={user} />
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate('/dashboard')}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="font-heading text-xl font-bold">Add Money</h1>
                <p className="text-xs text-muted-foreground">Choose a deposit method</p>
              </div>
            </div>

            {/* Account Number Card */}
            <div className="bg-gradient-to-br from-foreground to-foreground/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">🏦</span>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium">Wire Transfer / Direct Deposit</p>
                  <p className="text-white text-xs">Use these details to receive money</p>
                </div>
              </div>

              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Apex Bank Account Number</p>
                <p className="text-white font-mono text-3xl font-bold tracking-widest">
                  {account?.account_number
                    ? account.account_number.replace(/(.{3})(.{3})(.{4})/, '$1 $2 $3')
                    : '— — ——'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-white/70">
                <div><p className="text-white/40 text-[10px]">Routing No.</p><p className="font-mono font-semibold">021000021</p></div>
                <div><p className="text-white/40 text-[10px]">Bank</p><p className="font-semibold">Apex Bank</p></div>
                <div><p className="text-white/40 text-[10px]">Account Type</p><p className="font-semibold capitalize">{account?.account_type || 'Checking'}</p></div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyAccountNumber}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Number
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'My Apex Bank Account', text: `Account: ${account?.account_number}\nRouting: 021000021\nBank: Apex Bank` });
                    } else {
                      toast.info('Share not supported on this browser');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Details
                </button>
              </div>
            </div>

            {/* OR divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">OR DEPOSIT VIA</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Deposit Methods */}
            <div className="space-y-2">
              {depositMethods.map((method, i) => (
                <motion.button
                  key={method.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleMethod(method)}
                  className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-secondary/60 hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {method.isCashApp ? (
                      <svg viewBox="0 0 64 64" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                        <rect width="64" height="64" rx="14" fill="#00D64F"/>
                        <text x="32" y="46" textAnchor="middle" fontSize="36" fontWeight="bold" fill="white" fontFamily="Arial">$</text>
                      </svg>
                    ) : method.logo
                      ? <img src={method.logo} alt={method.label} className="w-8 h-8 object-contain" onError={e => { e.target.style.display='none'; }}/>
                      : method.icon
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>
              ))}
            </div>
          <SecurityBadge className="pt-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Support Modal */}
      <AnimatePresence>
        {contactMethod && (
          <ContactSupportModal method={contactMethod} onClose={() => setContactMethod(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}