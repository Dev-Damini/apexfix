import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Send, CreditCard, MoreHorizontal, TrendingUp, BarChart2, FileText, Globe, Settings, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const tabs = [
  { icon: ArrowLeftRight, label: 'Activity', path: '/transactions' },
  { icon: Send, label: 'Transfer', path: '/transfers' },
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard', center: true },
  { icon: CreditCard, label: 'Cards', path: '/cards' },
  { icon: MoreHorizontal, label: 'More', path: null },
];

const moreLinks = [
  { icon: TrendingUp, label: 'Investments', path: '/investments', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { icon: FileText, label: 'Statements', path: '/statements', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { icon: Globe, label: 'FX Converter', path: '/converter', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { icon: Settings, label: 'Settings', path: '/settings', color: 'text-foreground', bg: 'bg-secondary' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const isActive = (path) => path && location.pathname === path;
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More Sheet Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card rounded-t-3xl border-t border-border shadow-2xl pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-border rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="font-heading font-semibold text-base">More Services</p>
                <button onClick={() => setShowMore(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 px-4 pb-6">
                {moreLinks.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-secondary active:scale-95 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch justify-around px-1 h-14">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            if (tab.path === null) {
              // More button
              return (
                <button
                  key="more"
                  onClick={() => setShowMore(!showMore)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 active:scale-95 transition-transform"
                >
                  <div className={`w-6 h-6 flex items-center justify-center transition-colors ${showMore ? 'text-primary' : 'text-muted-foreground'}`}>
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${showMore ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    More
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 active:scale-95 transition-transform relative"
              >
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className={`absolute inset-0 ${tab.center ? 'bg-primary/15' : 'bg-primary/10'} rounded-xl`}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <tab.icon className={`transition-colors relative z-10 ${tab.center ? 'w-6 h-6' : 'w-5 h-5'} ${active ? 'text-primary' : 'text-muted-foreground'} ${tab.center && active ? 'stroke-[2.5]' : ''}`} />
                <span className={`transition-colors relative z-10 ${tab.center ? 'text-[11px]' : 'text-[10px]'} ${active ? 'text-primary font-bold' : tab.center ? 'text-muted-foreground font-semibold' : 'text-muted-foreground font-medium'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}