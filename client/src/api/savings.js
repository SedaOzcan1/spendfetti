import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

export function useSavings(month) {
  return useQuery({
    queryKey: ['savings', 'overview', month],
    queryFn: () => apiRequest('/savings', { query: { month } }),
    placeholderData: keepPreviousData,
  });
}

export function useSavingsEntries(goalId) {
  return useQuery({
    queryKey: ['savings', 'entries', goalId ?? 'all'],
    queryFn: async () =>
      (await apiRequest('/savings/entries', { query: { goalId, limit: 10 } })).entries,
  });
}

function useSavingsMutation(mutationFn, extraKeys = []) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        ['savings', 'notifications', ...extraKeys].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}

export const useSaveGoal = () =>
  useSavingsMutation(({ id, ...body }) =>
    id
      ? apiRequest(`/savings/goals/${id}`, { method: 'PATCH', body })
      : apiRequest('/savings/goals', { method: 'POST', body }),
  );

export const useDeleteGoal = () =>
  useSavingsMutation((id) => apiRequest(`/savings/goals/${id}`, { method: 'DELETE' }));

export const useAddSavingsEntry = () =>
  useSavingsMutation((body) => apiRequest('/savings/entries', { method: 'POST', body }));

export const useDeleteSavingsEntry = () =>
  useSavingsMutation((id) => apiRequest(`/savings/entries/${id}`, { method: 'DELETE' }));

/** Closes a month: { month, funAmount, savings: [{ goalId, amount }] }. */
export const useCloseMonth = () =>
  useSavingsMutation(
    (body) => apiRequest('/savings/month-close', { method: 'POST', body }),
    ['fun-budget', 'events', 'summary'],
  );
