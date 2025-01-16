import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import CalendarWidget from '@/components/CalendarWidget';
import { useAppearance } from '@/components/AppearanceProvider';

export default function UserCalendar() {
  const router = useRouter();
  const { username } = router.query;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useAppearance();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) return;
      
      try {
        const response = await fetch(`/api/user?username=${username}`);
        const data = await response.json();
        
        if (response.ok) {
          setUserData(data);
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen w-full p-4 md:p-8" style={{ backgroundColor: settings.backgroundColor }}>
        <Card className="max-w-4xl mx-auto p-6">
          <div className="text-center">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen w-full p-4 md:p-8" style={{ backgroundColor: settings.backgroundColor }}>
        <Card className="max-w-4xl mx-auto p-6">
          <div className="text-center">User not found</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 md:p-8" style={{ backgroundColor: settings.backgroundColor }}>
      <Card className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">@{userData.username}&apos;s Calendar</h1>
        </div>
        <CalendarWidget 
          publicMode={true} 
          apiEndpoint={`/api/events/public?username=${encodeURIComponent(username as string)}`} 
          onError={(error) => console.error('Calendar error:', error)}
        />
      </Card>
    </div>
  );
}