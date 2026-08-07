import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Shield, Key, Bell, Check, Eye, EyeOff, Fingerprint, Scan, Trash2 } from 'lucide-react';
import DeleteAccountSection from '@/components/settings/DeleteAccountSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useAccount } from '@/hooks/useAccount';

const sections = [
  { id: 'profile', label: 'Profile Information', icon: User, desc: 'Name, email, phone, date of birth' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Password, PIN, 2FA settings' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Manage your alert preferences' },
  { id: 'danger', label: 'Delete Account', icon: Trash2, desc: 'Close your account permanently' },
];

export default function AccountSettings() {
  const { user, refreshUser } = useOutletContext();
  const { account } = useAccount(user?.email);
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);

  // Profile form — initialize once when user data first arrives
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    dob: '',
    email: '',
  });
  const profileLoaded = useRef(false);

  useEffect(() => {
    if (user?.email && !profileLoaded.current) {
      profileLoaded.current = true;
      setProfile({
        full_name: user?.display_name || user?.full_name || '',
        phone: user?.phone || '',
        dob: user?.dob || '',
        email: user?.email || '',
      });
    }
  }, [user]);

  // Security
  const [pinDialog, setPinDialog] = useState(false);
  const [pwDialog, setPwDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [twoFA, setTwoFA] = useState(user?.two_fa_enabled || false);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [biometricTransfers, setBiometricTransfers] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported).catch(() => {});
    }
    if (user) {
      setBiometricLogin(user?.biometric_login || false);
      setBiometricTransfers(user?.biometric_transfers || false);
    }
  }, [user?.email]);

  // Notifications
  const [notifs, setNotifs] = useState({
    transfers: true,
    login: true,
    promotions: false,
    statements: true,
  });
  const [alertThreshold, setAlertThreshold] = useState(user?.alert_threshold ?? 100);

  const saveProfile = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      display_name: profile.full_name,
      phone: profile.phone,
      dob: profile.dob,
    });
    await refreshUser();
    toast.success('Profile updated successfully');
    setSaving(false);
  };

  const savePin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast.error('PIN must be 4 digits');
    if (pin !== pin2) return toast.error('PINs do not match');
    await base44.auth.updateMe({ transaction_pin: pin });
    toast.success('Transaction PIN set!');
    setPinDialog(false);
    setPin(''); setPin2('');
  };

  const toggleBiometricLogin = async (val) => {
    setBiometricLogin(val);
    await base44.auth.updateMe({ biometric_login: val });
    toast.success(val ? 'Biometric login enabled' : 'Biometric login disabled');
  };

  const toggleBiometricTransfers = async (val) => {
    setBiometricTransfers(val);
    await base44.auth.updateMe({ biometric_transfers: val });
    toast.success(val ? 'Biometric transfer confirmation enabled' : 'Biometric transfer confirmation disabled');
  };

  const toggleTwoFA = async (val) => {
    setTwoFA(val);
    await base44.auth.updateMe({ two_fa_enabled: val });
    toast.success(val ? '2FA enabled' : '2FA disabled');
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl lg:text-3xl font-bold">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, security, and preferences</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-foreground to-foreground/80 rounded-2xl p-5 space-y-4">
        {/* Top row: avatar + name/role */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-primary overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
            {user?.profile_picture
              ? <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-2xl">😊</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-lg font-bold text-white truncate">{user?.display_name || user?.full_name || 'User'}</p>
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mt-0.5">
              {user?.role === 'admin' ? 'Administrator' : 'Premium Member'}
            </p>
          </div>
        </div>
        {/* Bottom row: email | account number */}
        <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Email</p>
            <p className="text-xs text-white/70 truncate font-medium">{user?.email}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Account No.</p>
            <p className="text-xs font-mono text-white/80 tracking-wider">{account?.account_number || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Nav */}
        <div className="lg:col-span-1 space-y-1">
          {sections.map(s => {
            const isDanger = s.id === 'danger';
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  isActive && isDanger ? 'bg-destructive text-white shadow-md' :
                  isActive ? 'bg-primary text-white shadow-md' :
                  isDanger ? 'bg-card border border-destructive/30 hover:bg-destructive/5 text-destructive' :
                  'bg-card border border-border hover:bg-secondary text-muted-foreground'
                }`}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            {activeSection === 'profile' && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-semibold">Profile Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profile.full_name}
                      onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                      className="mt-1"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input value={profile.email} disabled className="mt-1 opacity-60" />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      className="mt-1"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={profile.dob}
                      onChange={e => setProfile({ ...profile, dob: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/90" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-semibold">Security Settings</h2>

                {/* Transaction PIN */}
                <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Transaction PIN</p>
                      <p className="text-xs text-muted-foreground">4-digit PIN for authorizing transfers</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPinDialog(true)}>
                    {user?.transaction_pin ? 'Change PIN' : 'Set PIN'}
                  </Button>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Password</p>
                      <p className="text-xs text-muted-foreground">Change your account password</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPwDialog(true)}>Change</Button>
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Extra layer of security for your account</p>
                    </div>
                  </div>
                  <Switch checked={twoFA} onCheckedChange={toggleTwoFA} />
                </div>

                {/* Biometric Auth */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] text-muted-foreground font-semibold px-2 tracking-wide uppercase">Biometric Authentication</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {!biometricSupported && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900">
                      <p className="text-xs text-amber-700 dark:text-amber-400">Biometric authentication is not available on this device or browser.</p>
                    </div>
                  )}
                  <div className={`flex items-center justify-between p-4 bg-secondary rounded-xl transition-opacity ${!biometricSupported ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
                        <Scan className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Face ID / Biometric Login</p>
                        <p className="text-xs text-muted-foreground">Sign in faster using your device biometrics</p>
                      </div>
                    </div>
                    <Switch checked={biometricLogin} onCheckedChange={toggleBiometricLogin} />
                  </div>
                  <div className={`flex items-center justify-between p-4 bg-secondary rounded-xl transition-opacity ${!biometricSupported ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/30 rounded-xl flex items-center justify-center">
                        <Fingerprint className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Fingerprint for Transfers</p>
                        <p className="text-xs text-muted-foreground">Confirm transfers and withdrawals with fingerprint</p>
                      </div>
                    </div>
                    <Switch checked={biometricTransfers} onCheckedChange={toggleBiometricTransfers} />
                  </div>
                </div>

                {/* Account Info */}
                <div className="p-4 bg-secondary rounded-xl space-y-2">
                  <p className="text-sm font-semibold mb-3">Account Information</p>
                  {[
                    { label: 'Account Number', value: account?.account_number },
                    { label: 'Account Type', value: account?.account_type === 'checking' ? 'Checking' : 'Savings' },
                    { label: 'Member Since', value: account?.created_date ? new Date(account.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
                    { label: 'Status', value: account?.status || 'Active' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium capitalize">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'danger' && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-semibold">Account Closure</h2>
                <p className="text-sm text-muted-foreground">
                  Closing your account is permanent and cannot be undone. Please read the information below carefully before proceeding.
                </p>
                <DeleteAccountSection user={user} />
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-semibold">Notification Preferences</h2>
                {[
                  { key: 'transfers', label: 'Transfer Alerts', desc: 'Get notified for all incoming and outgoing transfers' },
                  { key: 'login', label: 'Login Notifications', desc: 'Alert me when someone logs into my account' },
                  { key: 'statements', label: 'Monthly Statements', desc: 'Receive your monthly statement by email' },
                  { key: 'promotions', label: 'Promotions & Offers', desc: 'News about products, offers, and services' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                    <div>
                      <p className="text-sm font-semibold">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch
                      checked={notifs[n.key]}
                      onCheckedChange={v => setNotifs({ ...notifs, [n.key]: v })}
                    />
                  </div>
                ))}
                {/* Alert Threshold */}
                <div className="p-4 bg-secondary rounded-xl space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Transaction Alert Threshold</p>
                    <p className="text-xs text-muted-foreground">Get a toast alert when a transaction exceeds this amount</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      value={alertThreshold}
                      onChange={e => setAlertThreshold(Number(e.target.value))}
                      className="w-32"
                      placeholder="100"
                    />
                    <span className="text-xs text-muted-foreground">USD</span>
                  </div>
                </div>

                <Button className="bg-primary hover:bg-primary/90" onClick={async () => {
                  await base44.auth.updateMe({ alert_threshold: alertThreshold });
                  toast.success('Notification preferences saved');
                }}>
                  Save Preferences
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* PIN Dialog */}
      <Dialog open={pinDialog} onOpenChange={setPinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Set Transaction PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Enter 4-digit PIN</Label>
              <Input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="mt-1 text-center text-2xl tracking-widest"
                placeholder="••••"
              />
            </div>
            <div>
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                maxLength={4}
                value={pin2}
                onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="mt-1 text-center text-2xl tracking-widest"
                placeholder="••••"
              />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={savePin}>Set PIN</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={pwDialog} onOpenChange={setPwDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Password changes are handled through the authentication system. Please use the "Forgot Password" option on the login page to securely reset your password.</p>
            <Button variant="outline" className="w-full" onClick={() => { base44.auth.logout(); }}>
              Go to Login Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}