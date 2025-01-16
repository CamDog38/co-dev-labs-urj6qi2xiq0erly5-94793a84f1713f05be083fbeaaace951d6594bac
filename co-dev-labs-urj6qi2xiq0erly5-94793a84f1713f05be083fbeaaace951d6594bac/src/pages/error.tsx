import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { logger } from '@/lib/logger';

export default function ErrorPage() {
  const router = useRouter();
  const { statusCode, message } = router.query;

  useEffect(() => {
    if (statusCode) {
      logger.error('Page Error', {
        statusCode,
        message,
        path: router.asPath
      });
    }
  }, [statusCode, message, router.asPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-4">
        <h1 className="text-4xl font-bold mb-4">
          {statusCode === '404' ? 'Page Not Found' : 'Something went wrong'}
        </h1>
        <p className="mb-6 text-muted-foreground">
          {message || 'We apologize for the inconvenience. Please try again later.'}
        </p>
        <div className="space-x-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}