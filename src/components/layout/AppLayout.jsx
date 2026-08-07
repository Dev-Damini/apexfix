import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import SupportChatWidget from '@/components/support/SupportChatWidget';
import TransactionNotifier from '@/components/notifications/TransactionNotifier';
import XFloatingButton from '@/components/shared/XFloatingButton';
import NotificationBell from '@/components/notifications/NotificationBell';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshUser = () => base44.auth.me().then(setUser).catch(() => {});

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin('/dashboard'));
  }, []);

  const [account, setAccount] = React.useState(null);

  React.useEffect(() => {
    if (user?.email) {
      base44.entities.Account.filter({ owner_email: user.email }).then(res => {
        if (res?.length > 0) setAccount(res[0]);
      }).catch(() => {});
    }
  }, [user?.email]);

  return (
    <div className="flex bg-background" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 lg:hidden"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)', minHeight: '56px' }}>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-lg font-bold ml-2 flex-1">
            Apex<span className="text-primary">Bank</span>
          </h1>
          <ThemeToggle />
          <NotificationBell user={user} />
        </header>
        <main className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
          <Outlet context={{ user, refreshUser }} />
        </main>
      </div>
      <MobileBottomNav />
      <XFloatingButton />
      <SupportChatWidget user={user} />
      <TransactionNotifier user={user} account={account} />
    </div>
  );
}