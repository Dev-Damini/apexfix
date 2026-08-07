import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Delete } from 'lucide-react';

export default function PinVerification({ onConfirm, onCancel, title = 'Confirm Transaction', subtitle = 'Enter your 4-digit PIN to proceed' }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleKey = (val) => {
    setError('');
    if (val === 'del') {
      const newDigits = [...digits];
      for (let i = 3; i >= 0; i--) {
        if (newDigits[i] !== '') { newDigits[i] = ''; break; }
      }
      setDigits(newDigits);
    } else {
      const newDigits = [...digits];
      for (let i = 0; i < 4; i++) {
        if (newDigits[i] === '') { newDigits[i] = val; break; }
      }
      setDigits(newDigits);
      if (newDigits.every(d => d !== '')) {
        setTimeout(() => handleSubmit(newDigits.join('')), 200);
      }
    }
  };

  const handleSubmit = (pinVal) => {
    onConfirm(pinVal, (err) => {
      setError(err || 'Incorrect PIN');
      setShake(true);
      setDigits(['', '', '', '']);
      setTimeout(() => setShake(false), 500);
    });
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="bg-card rounded-3xl border border-border p-6 w-full max-w-xs space-y-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-heading font-bold">{title}</p>
              <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* PIN Dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-4"
        >
          {digits.map((d, i) => (
            <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
              d ? 'border-primary bg-primary/10' : 'border-border bg-secondary'
            }`}>
              {d ? <span className="w-3 h-3 rounded-full bg-primary block" /> : null}
            </div>
          ))}
        </motion.div>

        {error && (
          <p className="text-center text-xs text-destructive font-medium">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {keys.map((k, i) => (
            <button
              key={i}
              onClick={() => k !== '' && handleKey(k)}
              className={`h-14 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all ${
                k === '' ? 'pointer-events-none' :
                k === 'del' ? 'bg-secondary hover:bg-border text-muted-foreground' :
                'bg-secondary hover:bg-border active:scale-95 text-foreground'
              }`}
            >
              {k === 'del' ? <Delete className="w-5 h-5" /> : k}
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          🔒 Secured with 256-bit encryption
        </p>
      </motion.div>
    </motion.div>
  );
}