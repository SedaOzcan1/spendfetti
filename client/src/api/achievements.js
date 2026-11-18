import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

export function useMarkAchievementsSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, keys }) =>
      apiRequest('/achievements/seen', { method: 'POST', body: { month, keys } }),
    onSuccess: (_data, { month }) => {
      queryClient.setQueryData(['summary', month], (summary) =>
        summary ? { ...summary, achievements: [] } : summary,
      );
    },
  });
}
