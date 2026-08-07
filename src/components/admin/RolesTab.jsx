import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCog, Users, Loader2, ShieldOff, ShieldCheck, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SUPER_ADMIN = 'walletcnct@gmail.com';

export default function RolesTab({ currentUser }) {
  const [roleEmail, setRoleEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const queryClient = useQueryClient();

  const isSuperAdmin = currentUser?.email?.toLowerCase() === SUPER_ADMIN.toLowerCase();

  const { data: allUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ['all-users-roles'],
    queryFn: () => base44.entities.User.list(),
  });

  const adminUsers = allUsers.filter(u => u.role === 'admin');

  const grantAdmin = async () => {
    if (!roleEmail.trim()) return;
    setLoading(true);
    const target = allUsers.find(u => u.email?.toLowerCase() === roleEmail.trim().toLowerCase());
    if (!target) {
      toast.error('User not found. They must have logged in at least once.');
      setLoading(false);
      return;
    }
    if (target.role === 'admin') {
      toast.info(`${roleEmail} is already an admin.`);
      setLoading(false);
      return;
    }
    await base44.entities.User.update(target.id, { role: 'admin', admin_since: new Date().toISOString() });
    toast.success(`${target.email} has been granted admin access.`);
    setRoleEmail('');
    refetchUsers();
    setLoading(false);
  };

  const removeAdmin = async (targetUser) => {
    if (targetUser.email?.toLowerCase() === SUPER_ADMIN.toLowerCase()) {
      toast.error('The primary admin account cannot be demoted.');
      return;
    }
    setRemovingId(targetUser.id);
    await base44.entities.User.update(targetUser.id, { role: 'user' });
    toast.success(`Admin access removed from ${targetUser.email}.`);
    refetchUsers();
    setRemovingId(null);
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Grant Admin Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-semibold">Grant Admin Access</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Enter a user's email address to grant them full administrative privileges. They must have logged in at least once.
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">User Email</Label>
            <Input
              type="email"
              placeholder="user@gmail.com"
              value={roleEmail}
              onChange={e => setRoleEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && grantAdmin()}
            />
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading || !roleEmail.trim()}
            onClick={grantAdmin}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            Grant Admin Role
          </Button>
        </div>
      </motion.div>

      {/* Current Admins */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold">Admin Users</h3>
          </div>
          <Badge variant="outline" className="text-xs">{adminUsers.length} admins</Badge>
        </div>

        {adminUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No admin users found.</p>
        ) : (
          <div className="space-y-2">
            {adminUsers.map((u, i) => {
              const isPrimary = u.email?.toLowerCase() === SUPER_ADMIN.toLowerCase();
              const isRemoving = removingId === u.id;
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isPrimary
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-secondary/40 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPrimary ? 'bg-primary/15' : 'bg-secondary'
                    }`}>
                      {isPrimary
                        ? <Crown className="w-4 h-4 text-primary" />
                        : <UserCog className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{u.full_name || u.email}</p>
                        {isPrimary && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5">Primary</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Only super admin can remove, and only non-primary accounts */}
                  {isSuperAdmin && !isPrimary && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0 ml-2"
                      disabled={isRemoving}
                      onClick={() => removeAdmin(u)}
                    >
                      {isRemoving
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <><ShieldOff className="w-3 h-3 mr-1" /> Remove</>
                      }
                    </Button>
                  )}
                  {isPrimary && (
                    <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 ml-2">Protected</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}