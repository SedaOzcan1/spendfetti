import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

const POLL_MS = 60_000;

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await apiRequest('/notifications/unread-count')).unreadCount,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotifications({ enabled }) {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) =>
      apiRequest('/notifications', { query: { limit: 15, before: pageParam } }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

function useNotificationMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export const useMarkNotificationRead = () =>
  useNotificationMutation((id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }));

export const useMarkAllNotificationsRead = () =>
  useNotificationMutation(() => apiRequest('/notifications/read-all', { method: 'POST' }));

export const useDeleteNotification = () =>
  useNotificationMutation((id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }));
