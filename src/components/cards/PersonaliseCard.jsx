import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Paintbrush, Check, Wifi } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const colorOptions = [
  { id: 'gold', label: 'Apex Gold', gradient: 'from-amber-500 via-yellow-400 to-amber-600', textColor: 'text-white' },
  { id: 'midnight', label: 'Midnight', gradient: 'from-slate-800 via-slate-900 to-black', textColor: 'text-white' },
  { id: 'platinum', label: 'Platinum', gradient: 'from-slate-300 via-slate-400 to-slate-500', textColor: 'text-white' },
  { id: 'rose', label: 'Rose Gold', gradient: 'from-rose-300 via-pink-400 to-rose-500', textColor: 'text-white' },
  { id: 'ocean', label: 'Ocean Blue', gradient: 'from-blue-500 via-cyan-600 to-blue-700', textColor: 'text-white' },
  { id: 'forest', label: 'Forest', gradient: 'from-emerald-600 via-green-700 to-teal-800', textColor: 'text-white' },
];

const styleOptions = [
  { id: 'classic', label: 'Classic', desc: 'Clean, minimal look' },
  { id: 'frosted', label: 'Frosted', desc: 'Glass-like finish' },
  { id: 'carbon', label: 'Carbon', desc: 'Textured carbon fiber' },
];

export default function PersonaliseCard({ card, onClose }) {
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState(card.custom_color || 'gold');
  const [selectedStyle, setSelectedStyle] = useState(card.custom_style || 'classic');
  const [saving, setSaving] = useState(false);

  const color = colorOptions.find(c => c.id === selectedColor) || colorOptions[0];

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Card.update(card.id, { custom_color: selectedColor, custom_style: selectedStyle });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    toast.success('Card personalised!');
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex justify-center">
        <motion.div
          key={selectedColor + selectedStyle}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl w-72 bg-gradient-to-br ${color.gradient} ${
            selectedStyle === 'frosted' ? 'backdrop-blur-sm bg-opacity-80' : ''
          }`}
        >
          {selectedStyle === 'carbon' && (
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
              backgroundSize: '8px 8px'
            }} />
          )}
          {selectedStyle === 'frosted' && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          )}
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <p className="text-xs uppercase tracking-widest opacity-70 font-semibold">
                {card.card_tier} · {card.card_type}
              </p>
              <Wifi className="w-5 h-5 opacity-50" />
            </div>
            <p className="font-mono text-lg tracking-[0.25em] mb-6">
              •••• •••• •••• {card.card_number?.slice(-4) || '0000'}
            </p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] opacity-50 uppercase mb-0.5">Expires</p>
                <p className="text-sm font-medium">{card.expiry_date}</p>
              </div>
              <p className="font-heading text-sm font-bold opacity-80">ApexBank</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Color Selection */}
      <div>
        <p className="text-sm font-semibold mb-3">Card Color</p>
        <div className="grid grid-cols-3 gap-2">
          {colorOptions.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedColor(c.id)}
              className={`relative h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center transition-all ${
                selectedColor === c.id ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            >
              {selectedColor === c.id && (
                <Check className="w-4 h-4 text-white drop-shadow-md" />
              )}
              <span className="absolute bottom-1 text-[9px] text-white/80 font-medium">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div>
        <p className="text-sm font-semibold mb-3">Card Style</p>
        <div className="grid grid-cols-3 gap-2">
          {styleOptions.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStyle(s.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStyle === s.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary hover:bg-border'
              }`}
            >
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Personalisation'}
      </Button>
    </div>
  );
}