import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter'; // Import useLocation
import { User as UserType } from '@shared/schema';
import { Redirect } from 'wouter';

export default function CreateCompanyPage() {
  const { data: currentUser, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
  });
  const [, navigate] = useLocation(); // Get navigate function

  React.useEffect(() => {
    if (!userLoading) {
      if (currentUser?.role === 'super_admin') {
        // If super_admin, redirect to the companies list page where creation is now handled
        navigate('/sentinelzone/companies');
      } else {
        // If not super_admin, redirect to home or login
        navigate('/');
      }
    }
  }, [currentUser, userLoading, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">
            Cargando información de usuario...
          </p>
        </div>
      </div>
    );
  }

  // This component will now primarily handle redirects
  return (
    <Redirect
      to={currentUser?.role === 'super_admin' ? '/sentinelzone/companies' : '/'}
    />
  );
}
