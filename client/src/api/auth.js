import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '../lib/apiClient.js';

export const meQueryKey = ['me'];

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      try {
        return (await apiRequest('/auth/me')).user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useSessionMutation(path) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiRequest(path, { method: 'POST', body }),
    onSuccess: ({ user }) => {
      queryClient.clear();
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

export const useLogin = () => useSessionMutation('/auth/login');
export const useRegister = () => useSessionMutation('/auth/register');

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(meQueryKey, null);
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiRequest('/auth/me', { method: 'PATCH', body }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(meQueryKey, user);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body) => apiRequest('/auth/password', { method: 'PUT', body }),
  });
}
