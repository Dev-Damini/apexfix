import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck, Lock, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = ['fee', 'confirm', 'success'];

export default function ActivateCard({ card, open, onOpenChange, onActivate, isActivating }) {
  const [step, setStep] = useState('fee');

  const handleClose = (val) => {
    if (!val) setStep('fee');
    onOpenChange(val);
  };

  const handleConfirm = async () => {
    setStep('processing');
    await onActivate(card);
    setStep('success');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'fee' && (
            <motion.div
              key="fee"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-5"
            >
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Activate Your Card</DialogTitle>
              </DialogHeader>

              {/* Card preview */}
              <div className="rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-4">
                  {card?.card_tier} • {card?.card_type}
                </p>
                <p className="font-mono text-base tracking-[0.2em] mb-4">
                  •••• •••• •••• {card?.card_number?.slice(-4)}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] uppercase opacity-50">Expires</p>
                    <p className="text-sm font-medium">{card?.expiry_date}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 opacity-60" />
                  </div>
                </div>
              </div>

              {/* Fee notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Activation Fee Required</p>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                  A one-time <strong>$100.00 activation fee</strong> is required to unlock full card functionality including virtual card details and international transactions.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Activation Fee</span>
                <span className="text-lg font-bold text-foreground">$100.00</span>
              </div>

              <div className="space-y-2">
                <Button onClick={() => setStep('confirm')} className="w-full bg-primary hover:bg-primary/90 font-semibold">
                  Continue
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-5"
            >
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Confirm Activation</DialogTitle>
              </DialogHeader>

              <div className="bg-secondary/60 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Card ending in</span>
                  <span className="font-semibold">•••• {card?.card_number?.slice(-4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Card type</span>
                  <span className="font-semibold capitalize">{card?.card_tier} {card?.card_type}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-muted-foreground text-sm">Activation fee</span>
                  <span className="font-bold text-base">$100.00</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  After activation, your card will be temporarily frozen for your security. Contact support to unfreeze and start transacting.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleConfirm}
                  disabled={isActivating}
                  className="w-full bg-primary hover:bg-primary/90 font-semibold"
                >
                  {isActivating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Pay $100.00 & Activate
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep('fee')}>
                  Back
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-10 flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Activating your card…</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 space-y-5 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <div>
                <h2 className="font-heading text-xl font-bold mb-1">Card Activated!</h2>
                <p className="text-sm text-muted-foreground">Your card has been successfully activated.</p>
              </div>

              {/* Security freeze notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 text-left space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Security Freeze Applied</p>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-500 leading-relaxed">
                  Your card has been successfully activated and is temporarily frozen for security. Please contact support to unfreeze and begin using your card.
                </p>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 font-semibold"
                onClick={() => handleClose(false)}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}