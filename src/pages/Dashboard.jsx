import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccount } from '@/hooks/useAccount';
import BalanceCard from '@/components/dashboard/BalanceCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import FinancialInsights from '@/components/dashboard/FinancialInsights';
import FinancialServices from '@/components/dashboard/FinancialServices';
import SavingsTips from '@/components/dashboard/SavingsTips';
import ProfilePicture from '@/components/dashboard/ProfilePicture';
import SecurityBadge from '@/components/shared/SecurityBadge';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useOutletContext();
  const { account, isLoading: accountLoading, createAccount } = useAccount(user?.email);

  useEffect(() => {
    if (user?.email && !accountLoading && !account) {
      createAccount({ email: user.email, full_name: user.full_name });
    }
  }, [accountLoading, account, user]);

  const { data: transactions } = useQuery({
    queryKey: ['transactions', account?.id],
    queryFn: () => base44.entities.Transaction.filter({ account_id: account?.id }, '-created_date', 20),
    enabled: !!account?.id,
    initialData: [],
  });

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header with profile picture */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold">
            Welcome back, <span className="text-primary">{(user?.display_name || user?.full_name)?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's your financial overview</p>
        </div>
        <ProfilePicture user={user} />
      </div>

      <BalanceCard account={account} />
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentTransactions transactions={transactions} />
          <FinancialInsights transactions={transactions} account={account} />
        </div>
        <div className="space-y-6">
          <SavingsTips account={account} transactions={transactions} />
          <FinancialServices />
        </div>
      </div>

      {/* Security Badges Footer */}
      <SecurityBadge className="pt-2 pb-4" />
    </div>
  );
}