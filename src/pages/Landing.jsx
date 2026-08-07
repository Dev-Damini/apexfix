import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import XFloatingButton from '@/components/shared/XFloatingButton';
import {
  Shield, Smartphone, Globe, Clock, Star, ArrowRight,
  CreditCard, Send, TrendingUp, Building2, Phone, Mail,
  MapPin, CheckCircle, Users, DollarSign, Lock, Wifi,
  ChevronRight, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const navLinks = ['Home', 'About', 'Services', 'Contact'];

const stats = [
  { value: '50K+', label: 'Happy Clients' },
  { value: '$2.5B+', label: 'Assets Managed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

const infoCards = [
  { label: 'ROUTING #', value: '112400818', icon: Building2, color: 'bg-primary' },
  { label: 'BRANCH HOURS', value: 'Mon–Fri: 9AM–5PM', sub: 'Sat: 9AM–1PM', icon: Clock, color: 'bg-foreground' },
  { label: '24/7 SUPPORT', value: '1-800-APEXBANK', sub: 'Always here to help', icon: Phone, color: 'bg-primary/80' },
];

const rates = [
  { rate: '3.75%', label: 'APY*', type: 'HIGH YIELD SAVINGS', desc: 'High Yield Savings Rate', featured: true },
  { rate: '3.65%', label: 'APY*', type: '18 MONTH CERTIFICATE', desc: 'Certificate Deposit Rates', featured: false },
  { rate: '4.00%', label: 'APR*', type: 'CREDIT CARDS', desc: 'Apex Gold Card Rates', featured: false },
  { rate: '15.49%', label: 'APR*', type: 'LOANS', desc: 'Standard Loan Rates', featured: false },
];

const services = [
  { icon: CreditCard, title: 'Deposit Accounts', desc: 'Secure your money with high-yield savings and checking accounts designed for growth.' },
  { icon: DollarSign, title: 'Credit Cards', desc: 'Find the perfect card for your lifestyle with competitive gold-tier rates.' },
  { icon: TrendingUp, title: 'Investments', desc: 'Grow your wealth with expert-managed portfolios and retirement planning.' },
  { icon: Send, title: 'Instant Transfers', desc: 'Send money anywhere, instantly, 24/7 with zero hidden fees.' },
  { icon: Building2, title: 'Business Banking', desc: 'Comprehensive solutions designed to help your business thrive and scale.' },
  { icon: Shield, title: 'Wealth & Retire', desc: 'Secure your future with personalized financial planning from our experts.' },
];

const testimonials = [
  { name: 'Sarah Mitchell', role: 'Verified Customer', text: 'Apex Bank has completely transformed my banking experience. The gold tier service is exceptional.', rating: 5 },
  { name: 'James Okafor', role: 'Business Owner', text: 'Excellent service and competitive rates. My business accounts have never been managed better.', rating: 5 },
  { name: 'Emily Chen', role: 'Personal Banking', text: "The mobile app is fantastic and transfers are instant. Best banking decision I've made.", rating: 5 },
];

const features = [
  'No minimum balance required',
  'Free online and mobile banking',
  '24/7 customer support',
  'FDIC insured deposits',
  'Zero transfer fees',
  'Advanced fraud protection',
];

const heroImg = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1800&q=80';
const ctaImg = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => base44.auth.redirectToLogin('/dashboard');
  const handleSignUp = () => base44.auth.redirectToLogin('/dashboard');

  return (
    <div className="min-h-screen bg-white font-body">
      <XFloatingButton />
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <span className="font-heading text-2xl font-bold text-foreground">
              Apex<span className="text-primary">Bank</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-muted-foreground ml-2 tracking-widest uppercase">Premium Banking</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:flex text-sm" onClick={handleLogin}>Login</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white text-sm" onClick={handleSignUp}>Open Account</Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-border px-6 py-4 space-y-2">
            {navLinks.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground hover:text-foreground font-medium">
                {l}
              </a>
            ))}
            <Button variant="outline" className="w-full mt-2" onClick={handleLogin}>Login</Button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <img src={heroImg} alt="Banking" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-xl">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">Your Digital Banking Partner</p>
            <h1 className="font-heading text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">Apex Bank</h1>
            <p className="text-white/80 text-lg leading-relaxed mb-10">
              We do banking differently. We believe that people come first, and that everyone deserves a great experience every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-8 py-6 shadow-xl" onClick={handleSignUp}>
                <Users className="w-4 h-4 mr-2" /> Open Account Today
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm text-sm font-semibold px-8 py-6" onClick={handleLogin}>
                Login to Banking <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="mt-16 flex flex-wrap gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-white">
                <p className="font-heading text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-white/60 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* INFO CARDS */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {infoCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`${card.color} rounded-2xl p-6 text-white flex items-center gap-4 shadow-xl`}>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-1">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
                {card.sub && <p className="text-xs opacity-60">{card.sub}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RATES */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Apex Bank Rates</p>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">Competitive Rates for You</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Discover rates designed to help your money grow faster and your costs stay low.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rates.map((r, i) => (
            <motion.div key={r.type} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 text-center transition-all hover:shadow-lg ${r.featured ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20' : 'border-border bg-card hover:border-primary/30'}`}>
              {r.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Featured</span>}
              <p className={`font-heading text-4xl font-bold mb-1 ${r.featured ? 'text-white' : 'text-primary'}`}>{r.rate}</p>
              <p className={`text-xs font-semibold mb-3 ${r.featured ? 'text-white/70' : 'text-muted-foreground'}`}>{r.label}</p>
              <div className={`w-10 h-px mx-auto mb-3 ${r.featured ? 'bg-white/30' : 'bg-border'}`} />
              <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${r.featured ? 'text-white/80' : 'text-muted-foreground'}`}>{r.type}</p>
              <p className={`text-xs ${r.featured ? 'text-white/70' : 'text-muted-foreground'}`}>{r.desc}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">*Annual Percentage Yield/Rate. Rates subject to change. Terms and conditions apply.</p>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-20 bg-secondary/50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Our Services</p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">How Can We Help You Today?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Comprehensive banking solutions tailored to your needs.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                  <s.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <img src={ctaImg} alt="Banking" className="rounded-3xl shadow-2xl w-full object-cover h-80 lg:h-96" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">Limited Offer</span>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-4">Get <span className="text-primary">$200</span> When You Open an Account</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">For a limited time, receive a $200 bonus when you open any new Apex Bank account. Start building your financial strength today.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {features.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white" onClick={handleSignUp}>
              Open Account Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* MOCK APP CARD */}
      <section className="py-20 bg-foreground px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-4">Mobile Banking</p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-4">Banking Made Simple with the Apex Bank App</h2>
            <p className="text-white/60 mb-8 leading-relaxed">Experience next-generation digital banking. Manage accounts, send transfers, and track spending all from one elegant interface.</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Wifi, label: 'Works Offline', sub: 'Access anywhere' },
                { icon: TrendingUp, label: 'Lightning Fast', sub: 'Instant responses' },
                { icon: Lock, label: 'Bank-Level Security', sub: 'Always protected' },
                { icon: Smartphone, label: 'Push Alerts', sub: 'Real-time updates' },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-white/50">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white" onClick={handleLogin}>
              Open Web Banking <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex justify-center">
            <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white/10">
              <div className="bg-gradient-to-br from-foreground to-foreground/80 p-6 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs opacity-50 uppercase tracking-widest">Welcome Back</p>
                    <p className="font-heading text-lg font-bold mt-1">Apex<span className="text-primary">Bank</span></p>
                  </div>
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary text-sm font-bold">A</span>
                  </div>
                </div>
                <p className="text-xs opacity-50 mb-1">Available Balance</p>
                <p className="font-heading text-3xl font-bold mb-1">$12,847.50</p>
                <p className="text-xs opacity-40 font-mono">•••• •••• •••• 1234</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: 'Transfer to James', amount: '-$250.00', type: 'debit', date: 'Today' },
                  { label: 'Salary Deposit', amount: '+$4,200.00', type: 'credit', date: 'Yesterday' },
                  { label: 'Netflix', amount: '-$15.99', type: 'debit', date: 'Apr 26' },
                ].map((t) => (
                  <div key={t.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-medium">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground">{t.date}</p>
                    </div>
                    <p className={`text-xs font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>{t.amount}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <button onClick={handleLogin} className="w-full bg-primary text-white text-xs font-semibold py-2.5 rounded-xl">
                  Login to Your Account →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Testimonials</p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold">Hear From Our Customers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Contact</p>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold">We're Here to Help</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Clock, title: 'Banking Hours', lines: ['Mon–Fri: 9AM–5PM', 'Sat: 9AM–1PM', 'Sun: Closed'] },
            { icon: Phone, title: 'Phone Banking', lines: ['Available 24/7', 'Call: 1-800-APEXBANK', 'Intl: +1-555-0123'] },
            { icon: Mail, title: 'Email Support', lines: ['Response within 24hrs', 'Myapex@mail2usa.com'] },
            { icon: MapPin, title: 'Visit Us', lines: ['1 Apex Financial Tower', 'Wall Street District', 'New York, NY 10005'] },
          ].map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold mb-3">{c.title}</h3>
              {c.lines.map(l => <p key={l} className="text-sm text-muted-foreground">{l}</p>)}
            </motion.div>
          ))}
        </div>
      </section>

      {/* X FOLLOW BANNER */}
      <section className="bg-foreground/95 py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="https://x.com/apexbankhq?s=21" target="_blank" rel="noopener noreferrer"
              className="w-12 h-12 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <div>
              <p className="text-white font-semibold text-sm">Follow us on X</p>
              <p className="text-white/50 text-xs">Stay updated with Apex Bank news and announcements</p>
            </div>
          </div>
          <a href="https://x.com/apexbankhq?s=21" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @apexbankhq
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-foreground text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-heading text-xl font-bold">Apex<span className="text-primary">Bank</span></h3>
              <p className="text-xs text-white/40 mt-1">Premium Banking · FDIC Insured</p>
            </div>
            <a href="https://x.com/apexbankhq?s=21" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 bg-white/10 hover:bg-primary/30 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <p className="text-xs text-white/30 text-center">
            © {new Date().getFullYear()} ApexBank. All rights reserved. Member FDIC. Equal Housing Lender.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" className="border-white/20 text-white bg-transparent hover:bg-white/10 text-xs" onClick={handleLogin}>Login</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs" onClick={handleSignUp}>Open Account</Button>
          </div>
        </div>
      </footer>
    </div>
  );
}