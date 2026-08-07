import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Lock, Unlock, Trash2, Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const colorGradients = {
  gold: 'from-amber-500 via-yellow-400 to-amber-600',
  midnight: 'from-slate-800 via-slate-900 to-black',
  platinum: 'from-slate-300 via-slate-400 to-slate-500',
  rose: 'from-rose-300 via-pink-400 to-rose-500',
  ocean: 'from-blue-500 via-cyan-600 to-blue-700',
  forest: 'from-emerald-600 via-green-700 to-teal-800',
};

const tierGradients = {
  standard: 'from-slate-700 via-slate-800 to-slate-900',
  gold: 'from-amber-600 via-yellow-700 to-amber-800',
  platinum: 'from-slate-400 via-slate-500 to-slate-600',
};

export default function CardDisplay({ card, onToggleFreeze, onDelete, onActivate }) {
  const isFrozen = card.status === 'frozen';
  const isInactive = !card.activated;
  const isFreezeLocked = card.freeze_locked === true;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className={`
        relative overflow-hidden rounded-2xl p-6 text-white shadow-xl
        bg-gradient-to-br ${card.custom_color ? (colorGradients[card.custom_color] || colorGradients.midnight) : (tierGradients[card.card_tier] || tierGradients.standard)}
        ${isFrozen ? 'opacity-60' : ''}
      `}>
        <div className="absolute top-4 right-4">
          <Wifi className="w-6 h-6 opacity-40" />
        </div>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />

        <p className="text-xs uppercase tracking-widest opacity-60 mb-6">
          {card.card_tier} • {card.card_type}
        </p>
        
        {/* Card number */}
        {card.activated && showDetails ? (
          <p className="font-mono text-base tracking-[0.18em] mb-6">
            {card.card_number?.match(/.{1,4}/g)?.join(' ') || '0000 0000 0000 0000'}
          </p>
        ) : (
          <p className="font-mono text-lg tracking-[0.25em] mb-6">
            •••• •••• •••• {card.card_number?.slice(-4) || '0000'}
          </p>
        )}

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase opacity-50 mb-0.5">Expires</p>
            <p className="text-sm font-medium">{card.expiry_date || '12/28'}</p>
          </div>
          {card.activated && showDetails && card.cvv && (
            <div>
              <p className="text-[10px] uppercase opacity-50 mb-0.5">CVV</p>
              <p className="text-sm font-medium">{card.cvv}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] uppercase opacity-50 mb-0.5">Daily Limit</p>
            <p className="text-sm font-medium">${card.daily_limit?.toLocaleString()}</p>
          </div>
        </div>

        {isFrozen && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-sm font-semibold tracking-wider uppercase">Frozen</span>
          </div>
        )}

        {isInactive && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px] rounded-2xl gap-1">
            <span className="text-xs font-semibold tracking-wider uppercase opacity-80">Not Activated</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        {isInactive ? (
          <Button
            size="sm"
            className="flex-1 text-xs bg-primary hover:bg-primary/90 font-semibold"
            onClick={() => onActivate(card)}
          >
            <Zap className="w-3 h-3 mr-1" /> Activate Card
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 text-xs ${isFrozen && isFreezeLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => { if (!(isFrozen && isFreezeLocked)) onToggleFreeze(card); }}
              disabled={isFrozen && isFreezeLocked}
              title={isFrozen && isFreezeLocked ? 'Awaiting admin approval to unfreeze' : undefined}
            >
              {isFrozen ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
              {isFrozen && isFreezeLocked ? 'Pending Approval' : isFrozen ? 'Unfreeze' : 'Freeze'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-xs text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(card)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}