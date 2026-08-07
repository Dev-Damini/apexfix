import React from 'react';
import { Shield, Lock, Activity } from 'lucide-react';

export default function SecurityBadge({ className = '' }) {
  const badges = [
    { Icon: Lock, text: '256-bit encryption secured' },
    { Icon: Shield, text: 'Protected by multi-layer authentication' },
    { Icon: Activity, text: 'Transaction monitoring active' },
  ];

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {badges.map(({ Icon, text }) => (
        <div key={text} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <Icon className="w-3 h-3 text-primary/60 flex-shrink-0" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}