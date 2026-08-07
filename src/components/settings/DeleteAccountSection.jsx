import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Trash2, CheckCircle2, Loader2, ArrowRight, Info } from 'lucide-react';

const STEPS = { FORM: 'form', PROCESSING: 'processing', SUCCESS: 'success' };

export default function DeleteAccountSection({ user }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEPS.FORM);
  const [destType, setDestType] = useState('');
  const [destDetails, setDestDetails] = useState('');
  const [destName, setDestName] = useState('');

  const handleClose = () => {
    if (step === STEPS.PROCESSING) return;
    setOpen(false);
    setTimeout(() => { setStep(STEPS.FORM); setDestType(''); setDestDetails(''); setDestName(''); }, 300);
  };

  const handleSubmit = async () => {
    if (!destType || !destDetails.trim()) return;
    setStep(STEPS.PROCESSING);
    await new Promise(r => setTimeout(r, 3000));
    setStep(STEPS.SUCCESS);
  };

  const isValid = destType && destDetails.trim();

  return (
    <>
      {/* Danger Zone Card */}
      <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-destructive">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Request the closure of your Apex Bank account. Your remaining balance will be transferred to your specified destination.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => { setOpen(true); setStep(STEPS.FORM); }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Request Account Deletion
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Account
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">

            {/* STEP 1: FORM */}
            {step === STEPS.FORM && (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5 pt-2">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Submitting this request will begin the account closure process. Please specify where you'd like your remaining balance transferred.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Destination Type</Label>
                    <Select value={destType} onValueChange={setDestType}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">External Bank Account</SelectItem>
                        <SelectItem value="wallet">Digital Wallet</SelectItem>
                        <SelectItem value="apex">Another Apex Bank Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {destType && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">
                          {destType === 'bank' ? 'Account Number / IBAN' :
                           destType === 'wallet' ? 'Wallet Address / Phone Number' :
                           'Apex Bank Account Number'}
                        </Label>
                        <Input
                          className="mt-1.5"
                          placeholder={
                            destType === 'bank' ? 'e.g. GB29NWBK60161331926819' :
                            destType === 'wallet' ? 'e.g. +1 555 000 0000 or wallet ID' :
                            'e.g. 1234567890'
                          }
                          value={destDetails}
                          onChange={e => setDestDetails(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Account / Wallet Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                          className="mt-1.5"
                          placeholder="Name on account"
                          value={destName}
                          onChange={e => setDestName(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <Button
                  className="w-full bg-destructive hover:bg-destructive/90 text-white h-11"
                  onClick={handleSubmit}
                  disabled={!isValid}
                >
                  Submit Deletion Request
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2: PROCESSING */}
            {step === STEPS.PROCESSING && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-heading font-semibold text-lg">Processing Request</p>
                  <p className="text-sm text-muted-foreground mt-1">Please wait while we process your request...</p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === STEPS.SUCCESS && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 pt-2">
                <div className="flex flex-col items-center text-center py-6 gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xl">Request Accepted</p>
                    <p className="text-sm text-muted-foreground mt-1">Account deletion request accepted.</p>
                  </div>
                </div>

                <div className="bg-secondary border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">
                      A <span className="font-semibold text-primary">5% account closure and fund transfer fee</span> is required before your account can be closed and funds transferred to your selected destination.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                    Please contact support via <span className="text-primary font-medium">email</span> or <span className="text-primary font-medium">live chat</span> to complete the account closure process.
                  </p>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90 h-11" onClick={handleClose}>
                  Close
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}