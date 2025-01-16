import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/magic-link-login',
  '/auth/callback',
  '/reset-password',
  '/calendar-preview/[username]',
  '/results-preview/[username]',
  '/[username]',
  '/[username]/calendar',
  '/[username]/results',
  '/[username]/index',
  '/race/[slug]'
];

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      if (!initializing && !user && !publicRoutes.includes(router.pathname)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, initializing, router.pathname]);

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user && !publicRoutes.includes(router.pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;