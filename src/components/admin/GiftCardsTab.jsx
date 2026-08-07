import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Gift, CheckCircle, XCircle, Loader2, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';

const STATUS_COLORS = {
  pending: 'text-amber-600 border-amber-200 bg-amber-50',
  processing: 'text-blue-600 border-blue-200 bg-blue-50',
  credited: 'text-emerald-600 border-emerald-200 bg-emerald-50',
  rejected: 'text-red-600 border-red-200 bg-red-50',
};

export default function GiftCardsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [imageModal, setImageModal] = useState(null);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['admin-giftcards'],
    queryFn: () => base44.entities.GiftCard.list('-created_date', 200),
    initialData: [],
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, status, admin_note, credited_amount, owner_email, amount }) => {
      await base44.entities.GiftCard.update(id, { status, admin_note, credited_amount: credited_amount ? parseFloat(credited_amount) : undefined });
      if (status === 'credited' && owner_email && amount) {
        const accounts = await base44.entities.Account.filter({ owner_email });
        if (accounts.length > 0) {
          const acc = accounts[0];
          await base44.entities.Account.update(acc.id, { balance: (acc.balance || 0) + parseFloat(amount) });
          await base44.entities.Transaction.create({
            account_id: acc.id, type: 'credit', amount: parseFloat(amount),
            description: `Gift card deposit credited`, category: 'deposit',
            status: 'completed', reference: 'GC' + Date.now().toString(36).toUpperCase(),
            owner_email,
          });
          await base44.entities.Notification.create({
            owner_email, title: 'Gift Card Credited',
            message: `Your gift card worth $${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} has been credited to your account.`,
            type: 'deposit', amount: parseFloat(amount),
          });
        }
      }
      if (status === 'rejected' && owner_email) {
        await base44.entities.Notification.create({
          owner_email, title: 'Gift Card Rejected',
          message: admin_note || 'Your gift card submission was rejected.',
          type: 'admin',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-giftcards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      setSelected(null);
      setAdminNote('');
      setCreditAmount('');
      haptic('success');
      toast.success('Gift card updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const filtered = cards.filter(c =>
    !search ||
    c.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.brand?.toLowerCase().includes(search.toLowerCase()) ||
    c.card_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {['pending', 'processing', 'credited', 'rejected'].map(s => (
          <div key={s} className={`rounded-xl border p-3 text-center ${STATUS_COLORS[s]}`}>
            <p className="text-lg font-bold">{cards.filter(c => c.status === s).length}</p>
            <p className="text-[10px] capitalize font-medium">{s}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by email, brand, code..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No gift card submissions yet</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
          {filtered.map((card, i) => (
            <motion.div key={card.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 hover:bg-secondary/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Gift className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <p className="text-sm font-semibold">{card.brand || 'Unknown Brand'}</p>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[card.status]}`}>{card.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{card.owner_email} · {card.created_date ? format(new Date(card.created_date), 'MMM dd, yyyy HH:mm') : ''}</p>
                <p className="text-xs font-mono text-foreground/70 mt-0.5">Code: {card.card_code || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-emerald-600">${(card.declared_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { haptic('light'); setSelected(card); setCreditAmount(card.declared_amount || ''); setAdminNote(card.admin_note || ''); }}>
                  <Eye className="w-3 h-3 mr-1" /> Review
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" /> Gift Card Review
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-1">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Brand</p>
                  <p className="font-semibold">{selected.brand || '—'}</p>
                </div>
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Declared Value</p>
                  <p className="font-bold text-emerald-600">${(selected.declared_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-secondary rounded-xl p-3 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Card Code</p>
                  <p className="font-mono font-semibold break-all">{selected.card_code || '—'}</p>
                </div>
                {selected.pin_code && (
                  <div className="bg-secondary rounded-xl p-3 col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">PIN</p>
                    <p className="font-mono font-semibold">{selected.pin_code}</p>
                  </div>
                )}
                <div className="bg-secondary rounded-xl p-3 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Submitted By</p>
                  <p className="font-medium">{selected.owner_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{selected.owner_email}</p>
                </div>
                {selected.notes && (
                  <div className="bg-secondary rounded-xl p-3 col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Notes</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              {(selected.front_image_url || selected.back_image_url) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Card Images</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ url: selected.front_image_url, label: 'Front' }, { url: selected.back_image_url, label: 'Back' }].map(({ url, label }) =>
                      url ? (
                        <div key={label} className="relative group">
                          <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                          <div className="relative rounded-xl overflow-hidden border border-border aspect-video cursor-pointer" onClick={() => setImageModal(url)}>
                            <img src={url} alt={label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="space-y-3 border-t border-border pt-3">
                <div>
                  <Label className="text-xs mb-1 block">Credit Amount ($)</Label>
                  <Input type="number" placeholder="Amount to credit" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Admin Note (sent to customer)</Label>
                  <Input placeholder="e.g. Card verified and credited" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    disabled={updateCard.isPending || !creditAmount}
                    onClick={() => updateCard.mutate({ id: selected.id, status: 'credited', admin_note: adminNote, credited_amount: creditAmount, owner_email: selected.owner_email, amount: creditAmount })}
                  >
                    {updateCard.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />} Credit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                    disabled={updateCard.isPending}
                    onClick={() => updateCard.mutate({ id: selected.id, status: 'rejected', admin_note: adminNote, owner_email: selected.owner_email })}
                  >
                    {updateCard.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />} Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Fullscreen Modal */}
      {imageModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
          <img src={imageModal} alt="Card" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}