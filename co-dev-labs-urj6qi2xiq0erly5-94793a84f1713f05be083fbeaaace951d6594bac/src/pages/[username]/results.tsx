import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ResultsWidget } from '@/components/ResultsWidget';
import { useAppearance } from '@/components/AppearanceProvider';

export default function UserResults() {
  const router = useRouter();
  const { username } = router.query;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { settings } = useAppearance();

  // Log component mount and props
  useEffect(() => {
    console.log('UserResults mounted', {
      username,
      hasRouter: !!router,
      query: router.query,
    });
  }, []);

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
          <h1 className="text-2xl font-bold">@{userData.username}&apos;s Results</h1>
        </div>
        <ResultsWidget userId={userData.id} />
      </Card>
    </div>
  );
}