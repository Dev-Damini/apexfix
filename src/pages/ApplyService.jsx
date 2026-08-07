import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, Shield, FileText, Landmark, HandCoins, Receipt, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const serviceConfig = {
  loans: {
    icon: Landmark,
    title: 'Personal Loan',
    subtitle: 'Quick approval — funds in 1–3 business days',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    fields: [
      { key: 'loan_amount', label: 'Loan Amount ($)', type: 'number', placeholder: 'e.g. 5,000', required: true },
      { key: 'loan_purpose', label: 'Purpose of Loan', type: 'select', options: ['Home Improvement', 'Debt Consolidation', 'Medical Expenses', 'Business', 'Education', 'Vehicle', 'Other'], required: true },
      { key: 'employment_status', label: 'Employment Status', type: 'select', options: ['Full-time Employed', 'Part-time Employed', 'Self-Employed', 'Unemployed', 'Retired'], required: true },
      { key: 'annual_income', label: 'Annual Income ($)', type: 'number', placeholder: 'e.g. 60,000', required: true },
      { key: 'ssn_last4', label: 'Last 4 digits of SSN', type: 'text', placeholder: 'XXXX', maxLength: 4, required: true },
      { key: 'repayment_term', label: 'Repayment Term', type: 'select', options: ['12 months', '24 months', '36 months', '48 months', '60 months'], required: true },
    ],
    steps: ['Personal Info', 'Loan Details', 'Review'],
  },
  grants: {
    icon: HandCoins,
    title: 'Financial Grant',
    subtitle: 'No repayment required — subject to eligibility review',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    fields: [
      { key: 'grant_type', label: 'Grant Category', type: 'select', options: ['Small Business Grant', 'Education Grant', 'Housing Assistance', 'Medical Hardship', 'Community Development'], required: true },
      { key: 'grant_amount', label: 'Requested Amount ($)', type: 'number', placeholder: 'e.g. 2,500', required: true },
      { key: 'reason', label: 'Why do you need this grant?', type: 'textarea', placeholder: 'Briefly describe your situation...', required: true },
      { key: 'household_income', label: 'Annual Household Income ($)', type: 'number', placeholder: 'e.g. 35,000', required: true },
      { key: 'dependents', label: 'Number of Dependents', type: 'number', placeholder: '0', required: true },
      { key: 'ssn_last4', label: 'Last 4 digits of SSN', type: 'text', placeholder: 'XXXX', maxLength: 4, required: true },
    ],
  },
  'tax-refunds': {
    icon: Receipt,
    title: 'Tax Refund Advance',
    subtitle: 'Fast processing — get your refund sooner',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    fields: [
      { key: 'tax_year', label: 'Tax Year', type: 'select', options: ['2024', '2023', '2022', '2021'], required: true },
      { key: 'expected_refund', label: 'Expected Refund Amount ($)', type: 'number', placeholder: 'e.g. 1,200', required: true },
      { key: 'filing_status', label: 'Filing Status', type: 'select', options: ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household'], required: true },
      { key: 'employer_name', label: 'Primary Employer', type: 'text', placeholder: 'Employer name', required: true },
      { key: 'ssn_last4', label: 'Last 4 digits of SSN', type: 'text', placeholder: 'XXXX', maxLength: 4, required: true },
      { key: 'advance_amount', label: 'Advance Amount Requested ($)', type: 'number', placeholder: 'Up to your expected refund', required: true },
    ],
  },
};

export default function ApplyService() {
  const { type } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const config = serviceConfig[type];

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [step, setStep] = useState(0); // 0=personal, 1=details, 2=review, 3=submitted
  const [submitting, setSubmitting] = useState(false);

  if (!config) return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <p className="text-muted-foreground">Service not found.</p>
      <Link to="/dashboard" className="text-primary underline mt-2 text-sm">Back to Dashboard</Link>
    </div>
  );

  const ServiceIcon = config.icon;

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    setStep(3);
  };

  const renderField = (field) => {
    if (field.type === 'select') return (
      <div key={field.key}>
        <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
        <select
          value={form[field.key] || ''}
          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
          className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
    if (field.type === 'textarea') return (
      <div key={field.key}>
        <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
        <textarea
          value={form[field.key] || ''}
          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
          placeholder={field.placeholder}
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>
    );
    return (
      <div key={field.key}>
        <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
        <Input
          type={field.type}
          value={form[field.key] || ''}
          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className="mt-1"
        />
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 0 && step < 3 ? setStep(step - 1) : navigate('/dashboard')}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-heading text-xl font-bold">{config.title}</h1>
          <p className="text-xs text-muted-foreground">{config.subtitle}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SUBMITTED STATE */}
        {step === 3 && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold">Application Submitted!</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your {config.title} application has been received and is currently under review.
              </p>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">KYC Verification Required</p>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  To finalize your application, identity verification is required. Please contact our support team with a valid government-issued ID and proof of address.
                </p>
              </div>

              <div className="bg-secondary rounded-xl p-4 text-left space-y-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Next Steps</p>
                {[
                  { icon: Clock, text: 'Application under review (1–2 business days)' },
                  { icon: Shield, text: 'KYC identity verification via Support Chat' },
                  { icon: CheckCircle2, text: 'Approval decision & fund disbursement' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">{step.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>Dashboard</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => navigate('/dashboard')}>
                  Contact Support
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 0: Personal Info */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                  <ServiceIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Step 1 of 3 — Personal Information</p>
                  <p className="text-xs text-muted-foreground">Please confirm your personal details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Legal Name <span className="text-destructive">*</span></Label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Email Address <span className="text-destructive">*</span></Label>
                  <Input value={form.email} disabled className="mt-1 opacity-60" />
                </div>
                <div>
                  <Label>Phone Number <span className="text-destructive">*</span></Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="mt-1" />
                </div>
                <div>
                  <Label>Street Address <span className="text-destructive">*</span></Label>
                  <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" className="mt-1" />
                </div>
                <div>
                  <Label>City <span className="text-destructive">*</span></Label>
                  <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="New York" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>State <span className="text-destructive">*</span></Label>
                    <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="NY" maxLength={2} className="mt-1" />
                  </div>
                  <div>
                    <Label>ZIP Code <span className="text-destructive">*</span></Label>
                    <Input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} placeholder="10001" maxLength={5} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setStep(1)}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* STEP 1: Service-specific details */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                  <ServiceIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Step 2 of 3 — {config.title} Details</p>
                  <p className="text-xs text-muted-foreground">Provide the details of your application</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {config.fields.map(renderField)}
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setStep(2)}>
              Review Application <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* STEP 2: Review & Submit */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                  <ServiceIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Step 3 of 3 — Review & Submit</p>
                  <p className="text-xs text-muted-foreground">Please review your details before submitting</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personal Info</p>
                {[
                  { label: 'Name', value: form.full_name },
                  { label: 'Email', value: form.email },
                  { label: 'Phone', value: form.phone },
                  { label: 'Address', value: [form.address, form.city, form.state, form.zip].filter(Boolean).join(', ') },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm py-1 border-b border-border/40">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">{r.value || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Application Details</p>
                {config.fields.map(f => (
                  <div key={f.key} className="flex justify-between text-sm py-1 border-b border-border/40">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium">{form[f.key] || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/80 rounded-xl p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  By submitting, you authorize Apex Bank to verify your identity and credit information. Your data is protected under 256-bit encryption.
                </p>
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 h-11"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Application...
                </span>
              ) : (
                'Submit Application'
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}