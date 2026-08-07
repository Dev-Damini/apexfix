import React from 'react';
import { Link } from 'react-router-dom';
import { haptic } from '@/utils/haptics';
import { Send, ArrowLeftRight, CreditCard, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const actions = [
  { label: 'Add Money', icon: Plus, path: '/deposit', color: 'bg-primary/10 text-primary' },
  { label: 'Transfer', icon: Send, path: '/transfers', color: 'bg-primary/10 text-primary' },
  { label: 'Transactions', icon: ArrowLeftRight, path: '/transactions', color: 'bg-primary/10 text-primary' },
  { label: 'Cards', icon: CreditCard, path: '/cards', color: 'bg-primary/10 text-primary' },
];


export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Link
            to={action.path}
            onClick={() => haptic('light')}
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300 group active:scale-95"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground">{action.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}