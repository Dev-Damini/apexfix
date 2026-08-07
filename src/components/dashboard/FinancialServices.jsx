import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Globe, TrendingUp, FileText, CreditCard, Repeat, Landmark, HandCoins, Receipt, Wallet, BarChart2, Settings } from 'lucide-react';

const primaryServices = [
  {
    icon: Landmark,
    label: 'Loans',
    desc: 'Quick approval process',
    path: '/apply/loans',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnColor: 'bg-primary hover:bg-primary/90',
    status: 'Available',
  },
  {
    icon: HandCoins,
    label: 'Grants',
    desc: 'No repayment required',
    path: '/apply/grants',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnColor: 'bg-foreground hover:bg-foreground/90',
    status: 'Available',
  },
  {
    icon: Receipt,
    label: 'Tax Refunds',
    desc: 'Fast processing',
    path: '/apply/tax-refunds',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnColor: 'bg-primary hover:bg-primary/90',
    status: 'Available',
  },
  {
    icon: CreditCard,
    label: 'Virtual Cards',
    desc: 'Instant virtual cards',
    path: '/cards',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnColor: 'bg-foreground hover:bg-foreground/90',
    status: 'Available',
  },
];

const quickLinks = [
  { icon: Send, label: 'Wire Transfer', path: '/transfers?type=wire', color: 'bg-primary/10 text-primary' },
  { icon: Globe, label: 'FX Converter', path: '/converter', color: 'bg-primary/10 text-primary' },
  { icon: TrendingUp, label: 'Investments', path: '/investments', color: 'bg-primary/10 text-primary' },
  { icon: FileText, label: 'Statements', path: '/statements', color: 'bg-primary/10 text-primary' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics', color: 'bg-primary/10 text-primary' },
  { icon: Settings, label: 'Settings', path: '/settings', color: 'bg-secondary text-foreground' },
];

export default function FinancialServices() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Primary Services Grid */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-base font-semibold">Financial Services</h3>
          <span className="text-xs text-primary font-medium cursor-pointer hover:underline">View All →</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {primaryServices.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-secondary/50 rounded-xl p-3 border border-border/50 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{s.label}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background rounded-full px-1.5 py-0.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {s.status}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              <Link
                to={s.path}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all ${s.btnColor}`}
              >
                <s.icon className="w-3 h-3" />
                Apply Now
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Quick Access</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickLinks.map((s) => (
            <Link
              key={s.label}
              to={s.path}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}