import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

export function useTransactions(filters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => (await apiRequest('/transactions', { query: filters })).transactions,
    placeholderData: keepPreviousData,
  });
}

/** Any transaction change affects lists, the summary and budgets. */
function useInvalidateMoneyData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['transactions', 'summary', 'budgets'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
}

export function useSaveTransaction() {
  const invalidate = useInvalidateMoneyData();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      id
        ? apiRequest(`/transactions/${id}`, { method: 'PUT', body })
        : apiRequest('/transactions', { method: 'POST', body }),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoneyData();
  return useMutation({
    mutationFn: (id) => apiRequest(`/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
