import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BalanceCard({ account }) {
  const [showBalance, setShowBalance] = useState(true);

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(account?.account_number || '');
    toast.success('Account number copied');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85 text-primary-foreground p-5 sm:p-8 shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-70 tracking-widest uppercase">Available Balance</p>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="font-heading text-2xl sm:text-4xl font-bold">
                {showBalance 
                  ? `$${(account?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : '••••••'
                }
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-50 tracking-widest uppercase mb-1">Account</p>
            <p className="text-sm font-medium text-primary">
              {account?.account_type === 'checking' ? 'Checking' : 'Savings'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <p className="text-xs opacity-50 mb-1">Account Number</p>
            <p className="text-sm font-mono tracking-wider">{account?.account_number || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${account?.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs capitalize opacity-70">{account?.status || 'active'}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 text-xs"
            onClick={copyAccountNumber}
          >
            <Copy className="w-3 h-3 mr-1" /> Copy
          </Button>
        </div>
      </div>
    </motion.div>
  );
}