import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import LinkManager from "@/components/LinkManager";
import EventsManager from "@/components/EventsManager";
import { UserSettings } from "@/components/UserSettings";
import UserTickets from "@/components/UserTickets";
import { DashboardCalendarWidget } from "@/components/DashboardCalendarWidget";
import { useRouter } from 'next/router';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  description?: string;
  location?: string;
  documents: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    order: number;
  }>;
  notices: Array<{
    id: string;
    subject: string;
    content: string;
    sequence: number;
  }>;
  series: {
    id: string;
    name: string;
  } | null;
}

const MainDashboardContent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    pastEvents: 0,
    series: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };

        const [eventsResponse, seriesResponse] = await Promise.all([
          fetch('/api/events', { headers }).then(async (res) => {
            if (!res.ok) {
              if (res.status === 401) {
                throw new Error('Unauthorized');
              }
              throw new Error(`Events API error: ${res.status}`);
            }
            return res.json();
          }),
          fetch('/api/series', { headers }).then(async (res) => {
            if (!res.ok) {
              if (res.status === 401) {
                throw new Error('Unauthorized');
              }
              throw new Error(`Series API error: ${res.status}`);
            }
            return res.json();
          })
        ]);
        
        const now = new Date();
        
        const upcomingEvents = Array.isArray(eventsResponse) ? 
          eventsResponse.filter((event: Event) => new Date(event.startDate) >= now).length : 0;
        const pastEvents = Array.isArray(eventsResponse) ? 
          eventsResponse.filter((event: Event) => new Date(event.startDate) < now).length : 0;
        
        setStats({
          upcomingEvents,
          pastEvents,
          series: Array.isArray(seriesResponse) ? seriesResponse.length : 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        if (error.message === 'Unauthorized') {
          // Handle unauthorized error - user might need to re-login
          router.push('/login');
          return;
        }
        setStats({
          upcomingEvents: 0,
          pastEvents: 0,
          series: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, router]);

  const handleCardClick = (tab: string) => {
    console.log('Card clicked with tab:', tab);
    
    const tabMapping: { [key: string]: string } = {
      'upcoming': 'upcoming-events',
      'past': 'past-events',
      'series': 'manage-series'
    };
    
    const mappedTab = tabMapping[tab];
    localStorage.setItem('selectedEventsTab', mappedTab);
    
    try {
      const eventsTab = document.querySelector('[data-value="events"]') as HTMLButtonElement;
      if (eventsTab) {
        console.log('Found events tab, clicking...');
        eventsTab.click();
        
        setTimeout(() => {
          const targetTab = document.querySelector(`[value="${mappedTab}"]`) as HTMLButtonElement;
          if (targetTab) {
            console.log('Found target tab, clicking...', targetTab);
            targetTab.click();
          } else {
            console.warn('Target tab not found:', mappedTab);
          }
        }, 100);
      } else {
        console.warn('Events tab not found');
      }
    } catch (error) {
      console.error('Error in handleCardClick:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('upcoming')}
        >
          <CardContent className="flex items-center p-6">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Events</p>
              <h3 className="text-2xl font-bold">{isLoading ? "..." : stats.upcomingEvents}</h3>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('past')}
        >
          <CardContent className="flex items-center p-6">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Past Events</p>
              <h3 className="text-2xl font-bold">{isLoading ? "..." : stats.pastEvents}</h3>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('series')}
        >
          <CardContent className="flex items-center p-6">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Series</p>
              <h3 className="text-2xl font-bold">{isLoading ? "..." : stats.series}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <DashboardCalendarWidget />
        </CardContent>
      </Card>
    </div>
  );
};

function DashboardContent() {
  const { user, signOut, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !user) {
      router.push('/login');
    }
  }, [user, initializing, router]);

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full"
                />
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {user?.email ? user.email[0].toUpperCase() : ''}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Here's what's happening at your sailing club</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="px-4 sm:px-0">
              <TabsList className="h-auto p-1 w-full sm:w-auto flex flex-nowrap">
                <TabsTrigger value="dashboard" data-value="dashboard" className="flex-1 sm:flex-none">Dashboard</TabsTrigger>
                <TabsTrigger value="links" data-value="links" className="flex-1 sm:flex-none">Links</TabsTrigger>
                <TabsTrigger value="events" data-value="events" className="flex-1 sm:flex-none">Events</TabsTrigger>
                <TabsTrigger value="support" data-value="support" className="flex-1 sm:flex-none">Support</TabsTrigger>
                <TabsTrigger value="settings" data-value="settings" className="flex-1 sm:flex-none">Settings</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="dashboard">
            <MainDashboardContent />
          </TabsContent>

          <TabsContent value="links">
            <LinkManager />
          </TabsContent>

          <TabsContent value="events">
            <EventsManager />
          </TabsContent>

          <TabsContent value="support">
            <UserTickets />
          </TabsContent>

          <TabsContent value="settings">
            <UserSettings />
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={() => signOut()}
            variant="destructive"
            className="ml-2"
          >
            Log Out
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}