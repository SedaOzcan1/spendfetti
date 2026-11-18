import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

export function useBudgets(month) {
  return useQuery({
    queryKey: ['budgets', month],
    queryFn: async () => (await apiRequest('/budgets', { query: { month } })).budgets,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['budgets'] }),
      queryClient.invalidateQueries({ queryKey: ['summary'] }),
    ]);
}

export function useSaveBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ categoryId, limit }) =>
      apiRequest(`/budgets/${categoryId}`, { method: 'PUT', body: { limit } }),
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (categoryId) => apiRequest(`/budgets/${categoryId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
