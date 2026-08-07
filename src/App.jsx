import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Cards from '@/pages/Cards';
import Transfers from '@/pages/Transfers';
import Admin from '@/pages/Admin';
import Investments from '@/pages/Investments';
import CurrencyConverter from '@/pages/CurrencyConverter';
import AccountSettings from '@/pages/AccountSettings';
import Statements from '@/pages/Statements';
import Analytics from '@/pages/Analytics';
import ApplyService from '@/pages/ApplyService';
import Deposit from '@/pages/Deposit';
import Notifications from '@/pages/Notifications';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">
            Apex<span style={{ color: 'hsl(43, 56%, 56%)' }}>Bank</span>
          </h1>
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    else if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/converter" element={<CurrencyConverter />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/apply/:type" element={<ApplyService />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;