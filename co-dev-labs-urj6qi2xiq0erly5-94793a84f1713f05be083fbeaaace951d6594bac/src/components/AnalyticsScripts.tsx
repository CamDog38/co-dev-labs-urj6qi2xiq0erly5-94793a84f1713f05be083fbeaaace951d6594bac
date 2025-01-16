import { useEffect, useState } from 'react';
import Script from 'next/script';

interface Analytics {
  id: string;
  type: string;
  code: string;
  enabled: boolean;
}

export default function AnalyticsScripts() {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        setAnalytics(data.filter((item: Analytics) => item.enabled));
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <>
      {analytics.map((item) => (
        <div key={item.id}>
          <Script
            id={`analytics-${item.type}`}
            strategy="afterInteractive"
          >
            {item.code}
          </Script>
        </div>
      ))}
    </>
  );
}