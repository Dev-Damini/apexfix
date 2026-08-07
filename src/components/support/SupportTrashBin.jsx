import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, RotateCcw, X, Loader2, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';
import PinVerification from '@/components/shared/PinVerification';
import { AnimatePresence, motion } from 'framer-motion';

export default function SupportTrashBin({ adminUser, open, onClose }) {
  const [trashConvs, setTrashConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showPinForPermanent, setShowPinForPermanent] = useState(false);
  const [pendingPermanentId, setPendingPermanentId] = useState(null);

  useEffect(() => {
    if (open) loadTrash();
  }, [open]);

  const loadTrash = async () => {
    setLoading(true);
    const all = await base44.entities.SupportMessage.filter({ deleted: true }, '-deleted_at', 500);
    // Group by conversation_id
    const map = {};
    all.forEach(m => {
      if (!map[m.conversation_id]) {
        map[m.conversation_id] = { id: m.conversation_id, email: '', name: '', messages: [], deletedAt: m.deleted_at, deletedBy: m.deleted_by };
      }
      map[m.conversation_id].messages.push(m);
      if (m.role === 'customer') {
        map[m.conversation_id].email = m.sender_email;
        map[m.conversation_id].name = m.sender_name;
      }
    });
    setTrashConvs(Object.values(map).sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)));
    setLoading(false);
  };

  const restoreConversation = async (convId) => {
    setRestoring(convId);
    const msgs = trashConvs.find(c => c.id === convId)?.messages || [];
    await Promise.all(msgs.map(m => base44.entities.SupportMessage.update(m.id, { deleted: false, deleted_at: null, deleted_by: null })));
    toast.success('Conversation restored');
    setRestoring(null);
    await loadTrash();
  };

  const requestPermanentDelete = (convId) => {
    setPendingPermanentId(convId);
    setShowPinForPermanent(true);
  };

  const handlePermanentDeletePin = async (enteredPin, onError) => {
    if (enteredPin !== adminUser?.transaction_pin) { onError('Incorrect PIN'); return; }
    setShowPinForPermanent(false);
    setDeleting(pendingPermanentId);
    const msgs = trashConvs.find(c => c.id === pendingPermanentId)?.messages || [];
    await Promise.all(msgs.map(m => base44.entities.SupportMessage.delete(m.id)));
    toast.success('Permanently deleted');
    setDeleting(null);
    setPendingPermanentId(null);
    await loadTrash();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Support Trash Bin
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : trashConvs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Trash bin is empty</p>
              </div>
            ) : trashConvs.map(conv => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-secondary/40 border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{conv.name || conv.email || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">{conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {conv.deletedAt ? new Date(conv.deletedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                {/* Preview last message */}
                {conv.messages[0] && (
                  <p className="text-xs text-muted-foreground bg-background rounded-lg px-3 py-2 mb-3 truncate italic">
                    "{conv.messages[conv.messages.length - 1]?.message}"
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={() => restoreConversation(conv.id)}
                    disabled={restoring === conv.id || deleting === conv.id}
                  >
                    {restoring === conv.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => requestPermanentDelete(conv.id)}
                    disabled={restoring === conv.id || deleting === conv.id}
                  >
                    {deleting === conv.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
                    Delete Forever
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {trashConvs.length > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Permanently deleted conversations cannot be recovered.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showPinForPermanent && (
          <PinVerification
            onConfirm={handlePermanentDeletePin}
            onCancel={() => { setShowPinForPermanent(false); setPendingPermanentId(null); }}
            title="Permanent Delete"
            subtitle="Enter your PIN to permanently delete this conversation"
          />
        )}
      </AnimatePresence>
    </>
  );
}