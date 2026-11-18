import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

export function useSummary(month) {
  return useQuery({
    queryKey: ['summary', month],
    queryFn: () => apiRequest('/summary', { query: { month } }),
    placeholderData: keepPreviousData,
  });
}
