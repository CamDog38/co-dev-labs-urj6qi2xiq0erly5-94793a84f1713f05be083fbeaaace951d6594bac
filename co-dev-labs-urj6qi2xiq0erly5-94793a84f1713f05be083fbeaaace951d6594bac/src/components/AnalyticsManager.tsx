import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface Analytics {
  id: string;
  type: string;
  code: string;
  enabled: boolean;
}

const ANALYTICS_TYPES = [
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Paste your Google Analytics tracking code here',
    placeholder: '<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag(\'js\', new Date());\n  gtag(\'config\', \'GA_MEASUREMENT_ID\');\n</script>'
  },
  {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    description: 'Paste your Meta Pixel tracking code here',
    placeholder: '<!-- Meta Pixel Code -->\n<script>\n  !function(f,b,e,v,n,t,s)\n  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n  n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\'2.0\';\n  n.queue=[];t=b.createElement(e);t.async=!0;\n  t.src=v;s=b.getElementsByTagName(e)[0];\n  s.parentNode.insertBefore(t,s)}(window, document,\'script\',\n  \'https://connect.facebook.net/en_US/fbevents.js\');\n  fbq(\'init\', \'YOUR-PIXEL-ID\');\n  fbq(\'track\', \'PageView\');\n</script>'
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Paste your Hotjar tracking code here',
    placeholder: '<!-- Hotjar Tracking Code -->\n<script>\n  (function(h,o,t,j,a,r){\n    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};\n    h._hjSettings={hjid:YOUR_HJID,hjsv:6};\n    a=o.getElementsByTagName(\'head\')[0];\n    r=o.createElement(\'script\');r.async=1;\n    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;\n    a.appendChild(r);\n  })(window,document,\'https://static.hotjar.com/c/hotjar-\',\'.js?sv=\');\n</script>'
  }
];

export default function AnalyticsManager() {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: string, code: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, code, enabled }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      setAnalytics(prev => {
        const existing = prev.findIndex(a => a.type === type);
        if (existing >= 0) {
          return prev.map(a => a.type === type ? data : a);
        }
        return [...prev, data];
      });

      toast({
        title: "Success",
        description: "Analytics settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save analytics settings",
        variant: "destructive",
      });
    }
  };

  const getAnalytics = (type: string) => {
    return analytics.find(a => a.type === type) || { code: '', enabled: false };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {ANALYTICS_TYPES.map((type) => {
        const current = getAnalytics(type.id);
        return (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{type.name}</span>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${type.id}-enabled`}
                    checked={current.enabled}
                    onCheckedChange={(checked) => 
                      handleSave(type.id, current.code || '', checked)
                    }
                  />
                  <Label htmlFor={`${type.id}-enabled`}>Enable</Label>
                </div>
              </CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={type.placeholder}
                value={current.code || ''}
                onChange={(e) => {
                  const newAnalytics = [...analytics];
                  const index = newAnalytics.findIndex(a => a.type === type.id);
                  if (index >= 0) {
                    newAnalytics[index] = { ...newAnalytics[index], code: e.target.value };
                  } else {
                    newAnalytics.push({ id: '', type: type.id, code: e.target.value, enabled: false });
                  }
                  setAnalytics(newAnalytics);
                }}
                className="min-h-[200px] font-mono text-sm"
              />
              <Button
                className="mt-4"
                onClick={() => handleSave(type.id, current.code || '', current.enabled)}
              >
                Save {type.name} Code
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}