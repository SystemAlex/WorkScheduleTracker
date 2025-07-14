import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { base } from '@shared/paths';
import type { User as BaseUser, MainCompany } from '@shared/schema';

// Define a more specific type for the user object returned by the /me endpoint
interface CompanyStatus {
  isActive: boolean;
  paymentControl: MainCompany['paymentControl'];
  lastPaymentDate: string | null; // Corrected type from Date to string
  nextPaymentDueDate: string | null; // Corrected type from Date to string
  isPaymentDueSoon: boolean;
  needsSetup: boolean;
}

export type UserWithStatus = BaseUser & {
  companyStatus?: CompanyStatus;
  mustChangePassword?: boolean; // Add the new flag
};

interface AuthContextType {
  user: UserWithStatus | null;
  isLoading: boolean;
  login: (data: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserWithStatus | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await fetch(base('/api/auth/me'), {
          credentials: 'include',
        });
        if (response.status === 401) {
          return null; // Not logged in
        }
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        return response.json();
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: (data: {
      username: string;
      password: string;
      rememberMe?: boolean;
    }) => apiRequest('POST', '/api/auth/login', data),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear(); // Clear all caches on logout
    },
  });

  const login = async (data: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    await loginMutation.mutateAsync(data);
    // After login is successful, invalidate the user query to refetch it.
    // Awaiting this ensures the user state is updated before proceeding.
    await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const value = {
    user: user || null,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
