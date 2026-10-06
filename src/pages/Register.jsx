import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep('otp');
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode: otp });
      base44.auth.setToken(res.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider('google', '/dashboard');
  };

  const resend = async () => {
    setError('');
    try {
      await base44.auth.resendOtp(email);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12"
      style={{ paddingTop: 'env(safe-area-inset-top, 1rem)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Apex<span className="text-primary">Bank</span></h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          {step === 'form' ? (
            <>
              <button type="button" onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary transition-all text-sm font-medium">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" required autoComplete="email" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <div className="relative mt-1.5">
                    <Input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="pr-10" required />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Confirm Password</Label>
                  <Input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1.5" required />
                </div>
                {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive">{error}</div>}
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create Account
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
              </div>
              <div>
                <Label className="text-sm font-medium">Verification Code</Label>
                <Input type="text" inputMode="numeric" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} className="mt-1.5 text-center tracking-widest text-lg font-mono" maxLength={6} required />
              </div>
              {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive">{error}</div>}
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Verify Email
              </Button>
              <button type="button" onClick={resend} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
                Didn't receive a code? <span className="text-primary font-medium">Resend</span>
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}