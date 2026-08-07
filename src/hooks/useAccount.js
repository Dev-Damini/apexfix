import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function generateAccountNumber() {
  const prefix = '20';
  let num = prefix;
  for (let i = 0; i < 8; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
}

export function useAccount(userEmail) {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', userEmail],
    queryFn: () => base44.entities.Account.filter({ owner_email: userEmail }),
    enabled: !!userEmail,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (userData) => {
      const account = await base44.entities.Account.create({
        account_number: generateAccountNumber(),
        account_type: 'checking',
        balance: 0,
        currency: 'USD',
        status: 'active',
        owner_email: userData.email,
        owner_name: userData.full_name || 'User',
      });
      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const account = accounts?.[0] || null;

  return { account, accounts, isLoading, createAccount: createAccountMutation.mutate };
}