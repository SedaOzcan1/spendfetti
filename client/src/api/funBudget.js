import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';
import { meQueryKey } from './auth.js';

/**
 * Refreshes fun budget data except the month-close prompt itself: refetching
 * it while the prompt is open would swap its content and unmount the form
 * before the mutation's success handlers (navigate / close) run. The prompt
 * has staleTime 0, so it is fetched fresh the next time it opens.
 */
export function invalidateFunBudget(queryClient) {
  return queryClient.invalidateQueries({
    queryKey: ['fun-budget'],
    predicate: (query) => query.queryKey[1] !== 'prompt',
  });
}

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
      invalidateFunBudget(queryClient);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (body.neverAsk) queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}
