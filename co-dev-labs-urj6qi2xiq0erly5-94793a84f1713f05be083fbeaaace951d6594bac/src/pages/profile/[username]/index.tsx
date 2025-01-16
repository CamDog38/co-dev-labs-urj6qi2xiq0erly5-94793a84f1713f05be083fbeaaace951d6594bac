import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarWidget from '@/components/CalendarWidget';
import ResultsWidget from '@/components/ResultsWidget';
import { SocialMediaGroup } from '@/components/SocialMediaGroup';
import { NoticeBoard } from '@/components/NoticeBoard';

export default function PublicProfile() {
  const router = useRouter();
  const { username, tab } = router.query;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleTabChange = (value) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab: value },
    }, undefined, { shallow: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <Card className="max-w-4xl mx-auto p-6">
          <div className="text-center">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <Card className="max-w-4xl mx-auto p-6">
          <div className="text-center">User not found</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          {userData.appearance?.[0]?.profileImage && (
            <img
              src={userData.appearance[0].profileImage}
              alt={userData.username}
              className="w-24 h-24 rounded-full mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold">@{userData.username}</h1>
          {userData.appearance?.[0]?.bio && (
            <p className="mt-2 text-muted-foreground">{userData.appearance[0].bio}</p>
          )}
        </div>

        <Tabs 
          defaultValue={tab || "links"} 
          value={tab || "links"}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="links">
            <div className="space-y-4">
              <SocialMediaGroup links={userData.links} />
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <CalendarWidget userId={userData.id} />
          </TabsContent>
          
          <TabsContent value="results">
            <ResultsWidget userId={userData.id} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}