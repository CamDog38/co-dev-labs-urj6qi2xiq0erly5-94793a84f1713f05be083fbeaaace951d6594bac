import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import '../styles/globals.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AppearanceProvider } from '@/components/AppearanceProvider';
import AnalyticsScripts from '@/components/AnalyticsScripts';
import { logger } from '@/lib/logger';
import React from 'react';

// Error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught an error', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-4">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4">We apologize for the inconvenience. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Log navigation errors
    const handleRouteError = (err: Error, url: string) => {
      logger.error('Navigation error', { error: err.toString(), url });
    };

    router.events.on('routeChangeError', handleRouteError);

    return () => {
      router.events.off('routeChangeError', handleRouteError);
    };
  }, []);

  // **DO NOT REMOVE** Send URL to parent on navigation changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      window.parent.postMessage({
        type: 'URL_CHANGE',
        url: window.location.href,
      }, '*');
    };
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Global error handler for unhandled promises
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Prevent flash while theme loads
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppearanceProvider>
          <div className="min-h-screen bg-background">
            <ProtectedRoute>
              <Component {...pageProps} />
            </ProtectedRoute>
            <Toaster />
          </div>
        </AppearanceProvider>
        <AnalyticsScripts />
      </AuthProvider>
    </ErrorBoundary>
  )
}