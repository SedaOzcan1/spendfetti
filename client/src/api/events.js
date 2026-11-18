import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient.js';

export function useEvents(filters) {
  return useInfiniteQuery({
    queryKey: ['events', filters],
    queryFn: ({ pageParam }) => apiRequest('/events', { query: { ...filters, page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useEventMeta() {
  return useQuery({
    queryKey: ['events', 'meta'],
    queryFn: () => apiRequest('/events/meta'),
    staleTime: 60 * 60 * 1000,
  });
}

/** Fire-and-forget analytics for outbound ticket links. */
export function trackEventClick(id) {
  apiRequest(`/events/${id}/click`, { method: 'POST' }).catch(() => {});
}
