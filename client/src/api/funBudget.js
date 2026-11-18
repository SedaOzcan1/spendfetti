import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';
import { meQueryKey } from './auth.js';

export function useFunBudget(month) {
  return useQuery({
    queryKey: ['fun-budget', month],
    queryFn: () => apiRequest('/fun-budget', { query: { month } }),
  });
}

export function useFunBudgetPrompt(month, { enabled }) {
  return useQuery({
    queryKey: ['fun-budget', 'prompt', month],
    queryFn: () => apiRequest('/fun-budget/prompt', { query: { month } }),
    enabled,
    staleTime: 0,
  });
}

/** Allocate ({ month, amount }) or dismiss ({ month, dismissed: true, neverAsk }). */
export function useDecideFunBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiRequest('/fun-budget', { method: 'POST', body }),
    onSuccess: (_data, body) => {
      queryClient.invalidateQueries({ queryKey: ['fun-budget'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (body.neverAsk) queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}
