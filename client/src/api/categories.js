import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiRequest('/categories')).categories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiRequest('/categories', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

/** Map<categoryId, category> for quick lookups. */
export function useCategoryMap() {
  const { data = [] } = useCategories();
  return new Map(data.map((category) => [category.id, category]));
}
