import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccount } from '@/hooks/useAccount';
import CardDisplay from '@/components/cards/CardDisplay';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, CreditCard, Loader2, Paintbrush } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog as PersonaliseDialog, DialogContent as PersonaliseContent, DialogHeader as PersonaliseHeader, DialogTitle as PersonaliseTitle } from '@/components/ui/dialog';
import PersonaliseCard from '@/components/cards/PersonaliseCard';
import ActivateCard from '@/components/cards/ActivateCard';

function generateCardNumber() {
  let num = '';
  for (let i = 0; i < 16; i++) num += Math.floor(Math.random() * 10);
  return num;
}

export default function Cards() {
  const { user } = useOutletContext();
  const { account } = useAccount(user?.email);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [personaliseCard, setPersonaliseCard] = useState(null);
  const [activateCard, setActivateCard] = useState(null);
  const [newCard, setNewCard] = useState({ card_type: 'visa', card_tier: 'standard', daily_limit: 5000 });

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards', user?.email],
    queryFn: () => base44.entities.Card.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Card.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setDialogOpen(false);
      toast.success('Card created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Card.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Card.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Card deleted');
    },
  });

  const activateMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Card.update(id, {
      activated: true,
      status: 'frozen',
      freeze_locked: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      base44.entities.Notification.create({
        owner_email: user.email,
        title: 'Card Activated & Frozen',
        message: 'Your card has been successfully activated and is temporarily frozen for security. Please contact support to unfreeze and begin using your card.',
        type: 'card',
      });
    },
  });

  const handleActivate = async (card) => {
    await activateMutation.mutateAsync({ id: card.id });
  };

  const handleCreate = () => {
    const expMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const expYear = String(new Date().getFullYear() + 4).slice(-2);
    const cvv = String(Math.floor(Math.random() * 900) + 100);
    createMutation.mutate({
      account_id: account?.id,
      card_number: generateCardNumber(),
      card_type: newCard.card_type,
      card_tier: newCard.card_tier,
      expiry_date: `${expMonth}/${expYear}`,
      cvv,
      daily_limit: Number(newCard.daily_limit),
      status: 'inactive',
      activated: false,
      owner_email: user.email,
    });
  };

  const handleToggleFreeze = (card) => {
    const newStatus = card.status === 'frozen' ? 'active' : 'frozen';
    updateMutation.mutate({ id: card.id, data: { status: newStatus } });
    toast.success(newStatus === 'frozen' ? 'Card frozen' : 'Card unfrozen');
  };

  const handleDelete = (card) => {
    deleteMutation.mutate(card.id);
  };

  return (
    <div className="p-4 lg:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold">Cards</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your debit and credit cards</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> New Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Request New Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Card Network</Label>
                <Select value={newCard.card_type} onValueChange={(v) => setNewCard({...newCard, card_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Card Tier</Label>
                <Select value={newCard.card_tier} onValueChange={(v) => setNewCard({...newCard, card_tier: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Daily Limit ($)</Label>
                <Input
                  type="number"
                  value={newCard.daily_limit}
                  onChange={(e) => setNewCard({...newCard, daily_limit: e.target.value})}
                />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-primary hover:bg-primary/90">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Create Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Personalise Card Banner */}
      <div
        onClick={() => cards.length > 0 && setPersonaliseCard(cards[0])}
        className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-secondary/50 transition-all group active:scale-[0.99]"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Paintbrush className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-heading font-bold text-base">Personalise card</p>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide">NEW!</span>
          </div>
          <p className="text-sm text-muted-foreground">Choose a style you like</p>
        </div>
        <span className="text-muted-foreground group-hover:text-primary transition-colors text-lg">›</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No cards yet. Create your first card.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map(card => (
            <div key={card.id}>
              <CardDisplay
                card={card}
                onToggleFreeze={handleToggleFreeze}
                onDelete={handleDelete}
                onActivate={() => setActivateCard(card)}
              />
              <button
                onClick={() => setPersonaliseCard(card)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-primary/40 text-xs text-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
              >
                <Paintbrush className="w-3 h-3" /> Personalise this card
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Activate Card Dialog */}
      <ActivateCard
        card={activateCard}
        open={!!activateCard}
        onOpenChange={(v) => { if (!v) setActivateCard(null); }}
        onActivate={handleActivate}
        isActivating={activateMutation.isPending}
      />

      {/* Personalise Dialog */}
      <PersonaliseDialog open={!!personaliseCard} onOpenChange={() => setPersonaliseCard(null)}>
        <PersonaliseContent className="max-w-sm">
          <PersonaliseHeader>
            <PersonaliseTitle className="font-heading">Personalise Card</PersonaliseTitle>
          </PersonaliseHeader>
          {personaliseCard && (
            <PersonaliseCard card={personaliseCard} onClose={() => setPersonaliseCard(null)} />
          )}
        </PersonaliseContent>
      </PersonaliseDialog>
    </div>
  );
}