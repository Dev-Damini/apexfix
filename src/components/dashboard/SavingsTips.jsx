import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, Target, Lightbulb, ChevronRight } from 'lucide-react';

const tips = [
  { icon: '💡', title: 'Save Regularly', desc: 'Set aside 20% of every deposit automatically for savings.', color: 'bg-amber-50 border-amber-200' },
  { icon: '📉', title: 'Reduce Subscriptions', desc: 'Review recurring charges — small leaks sink big ships.', color: 'bg-blue-50 border-blue-200' },
  { icon: '🎯', title: 'Set a Goal', desc: 'Define a savings target. People with goals save 30% more.', color: 'bg-emerald-50 border-emerald-200' },
];

const achievements = [
  { icon: '🏆', label: 'First Deposit', earned: true },
  { icon: '⭐', label: '5 Transactions', earned: true },
  { icon: '💎', label: 'Save $1,000', earned: false },
  { icon: '🚀', label: 'Power User', earned: false },
];

export default function SavingsTips({ account, transactions = [] }) {
  const [tipIdx, setTipIdx] = useState(0);
  const tip = tips[tipIdx];
  const transactionCount = transactions.length;
  const hasDeposit = transactions.some(t => t.type === 'credit');
  const has5Txns = transactionCount >= 5;
  const hasSavings = (account?.balance || 0) >= 1000;

  const earnedAchievements = [
    hasDeposit, has5Txns, hasSavings, false
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Savings Tip */}
      <div className={`rounded-2xl border p-5 ${tip.color}`}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Money Tip</p>
        </div>
        <p className="text-xl mb-1">{tip.icon}</p>
        <p className="font-heading font-semibold text-sm mb-1">{tip.title}</p>
        <p className="text-xs text-muted-foreground">{tip.desc}</p>
        <button
          onClick={() => setTipIdx((tipIdx + 1) % tips.length)}
          className="flex items-center gap-1 mt-3 text-xs text-primary font-medium"
        >
          Next Tip <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold">Achievements</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((a, i) => (
            <div
              key={a.label}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center ${
                earnedAchievements[i]
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-secondary border-border opacity-50'
              }`}
            >
              <span className="text-xl">{a.icon}</span>
              <span className="text-[10px] font-medium leading-tight">{a.label}</span>
              {earnedAchievements[i] && <span className="text-[9px] text-primary font-bold">✓ Earned</span>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}