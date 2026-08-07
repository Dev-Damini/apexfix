import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Gift, AlertTriangle, CheckCircle2, Loader2, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const BRANDS = ['Amazon', 'Apple', 'Google Play', 'Visa Gift Card', 'Mastercard Gift Card', 'Steam', 'Xbox', 'iTunes', 'Walmart', 'Target', 'eBay', 'Best Buy', 'Nike', 'Other'];

export default function GiftCardDeposit({ onBack, user }) {
  const [form, setForm] = useState({ brand: '', card_code: '', pin_code: '', declared_amount: '', notes: '' });
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImageChange = (side, file) => {
    if (!file) return;
    if (side === 'front') { setFrontImage(file); setFrontPreview(URL.createObjectURL(file)); }
    else { setBackImage(file); setBackPreview(URL.createObjectURL(file)); }
  };

  const removeImage = (side) => {
    if (side === 'front') { setFrontImage(null); setFrontPreview(null); }
    else { setBackImage(null); setBackPreview(null); }
  };

  const handleSubmit = async () => {
    if (!form.card_code.trim()) return toast.error('Please enter the gift card code');
    if (!form.declared_amount || parseFloat(form.declared_amount) <= 0) return toast.error('Please enter a valid card value');

    setSubmitting(true);
    try {
      let front_image_url = null;
      let back_image_url = null;

      if (frontImage) {
        const res = await base44.integrations.Core.UploadFile({ file: frontImage });
        front_image_url = res.file_url;
      }
      if (backImage) {
        const res = await base44.integrations.Core.UploadFile({ file: backImage });
        back_image_url = res.file_url;
      }

      await base44.entities.GiftCard.create({
        owner_email: user?.email,
        owner_name: user?.full_name,
        brand: form.brand || 'Other',
        card_code: form.card_code.trim(),
        pin_code: form.pin_code.trim(),
        declared_amount: parseFloat(form.declared_amount),
        front_image_url,
        back_image_url,
        notes: form.notes.trim(),
        status: 'pending',
      });

      setSubmitted(true);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold">Submitted!</h3>
          <p className="text-sm text-muted-foreground mt-1">Your gift card has been sent for review. We'll credit your account within 1–24 hours.</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-300 max-w-xs">
          <strong>Note:</strong> Gift card values may vary based on current exchange rates and card validity checks.
        </div>
        <Button className="w-full max-w-xs bg-primary" onClick={onBack}>Back to Deposit</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-sm">Gift Card Deposit</p>
          <p className="text-xs text-muted-foreground">Submit your gift card for instant credit</p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Only unused, valid gift cards are accepted. Submitting a used or fraudulent card may result in account suspension.
        </p>
      </div>

      {/* Brand */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Gift Card Brand</Label>
        <div className="grid grid-cols-3 gap-2">
          {BRANDS.map(b => (
            <button
              key={b}
              onClick={() => setForm(f => ({ ...f, brand: b }))}
              className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${form.brand === b ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:border-primary/50'}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Card Code */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Card Code <span className="text-destructive">*</span></Label>
        <Input
          placeholder="e.g. XXXX-XXXX-XXXX-XXXX"
          value={form.card_code}
          onChange={e => setForm(f => ({ ...f, card_code: e.target.value }))}
          className="font-mono tracking-wider"
        />
      </div>

      {/* PIN */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">PIN / Security Code <span className="text-xs text-muted-foreground">(if applicable)</span></Label>
        <Input
          placeholder="e.g. 1234"
          value={form.pin_code}
          onChange={e => setForm(f => ({ ...f, pin_code: e.target.value }))}
          className="font-mono"
        />
      </div>

      {/* Amount */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Card Value ($) <span className="text-destructive">*</span></Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">$</span>
          <Input
            type="number"
            placeholder="0.00"
            min="1"
            step="0.01"
            value={form.declared_amount}
            onChange={e => setForm(f => ({ ...f, declared_amount: e.target.value }))}
            className="pl-7"
          />
        </div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-3">
        {[{ side: 'front', label: 'Front of Card', preview: frontPreview }, { side: 'back', label: 'Back of Card', preview: backPreview }].map(({ side, label, preview }) => (
          <div key={side}>
            <Label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wide">{label}</Label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-video">
                <img src={preview} alt={label} className="w-full h-full object-cover" />
                <button onClick={() => removeImage(side)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border aspect-video cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Camera className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Tap to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange(side, e.target.files?.[0])} />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Additional Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Input
          placeholder="Any extra info about the card..."
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {/* Submit */}
      <Button
        className="w-full bg-primary hover:bg-primary/90 h-12 text-sm font-semibold"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
        ) : (
          <><Gift className="w-4 h-4 mr-2" /> Submit Gift Card</>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-2">
        Funds are credited after admin verification · Typically within 1–24 hours
      </p>
    </motion.div>
  );
}