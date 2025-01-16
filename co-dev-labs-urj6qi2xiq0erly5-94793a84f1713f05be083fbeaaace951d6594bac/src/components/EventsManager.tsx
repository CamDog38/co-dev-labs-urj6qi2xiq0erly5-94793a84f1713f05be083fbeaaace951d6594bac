import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateEventForm } from "./CreateEventForm";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditEventDialog } from "./EditEventDialog";
import { ManageDocumentsDialog } from "./ManageDocumentsDialog";
import { EditSeriesDialog } from "./EditSeriesDialog";
import { ManageNoticesDialog } from "./ManageNoticesDialog";
import { ManageEventResultsDialog } from "./ManageEventResultsDialog";
import { ManageTimelineDialog } from "./ManageTimelineDialog";
import { SeriesActionsDropdown } from "./SeriesActionsDropdown";
import { ManageSeriesDocumentsDialog } from "./ManageSeriesDocumentsDialog";

interface Event {
  id: string;
  title: string;
  type: string;
  location?: string;
  startDate: string;
  endDate: string;
  seriesName?: string;
  description?: string;
}

interface Series {
  id: string;
  title: string;
  events: Event[];
}

const EventsManager = () => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEventDocumentsDialog, setShowEventDocumentsDialog] = useState(false);
  const [showSeriesDocumentsDialog, setShowSeriesDocumentsDialog] = useState(false);
  const [showNoticesDialog, setShowNoticesDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('selectedEventsTab');
      // Map dashboard tab values to EventsManager tab values
      switch (savedTab) {
        case 'upcoming':
          return 'upcoming-events';
        case 'past':
          return 'past-events';
        case 'series':
          return 'manage-series';
        case 'all':
          return 'all-events';
        default:
          return 'upcoming-events';
      }
    }
    return 'upcoming-events';
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [eventsResponse, seriesResponse] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/series')
      ]);
      
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch events');
      }
      if (!seriesResponse.ok) {
        throw new Error('Failed to fetch series');
      }
      
      const eventsData = await eventsResponse.json();
      const seriesData = await seriesResponse.json();
      
      setEvents(eventsData);
      setSeries(seriesData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateSuccess = async () => {
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: "Event created successfully",
    });
    await fetchEvents();
  };

  const handleEditEvent = (event: Event) => {
    // Ensure dates are properly formatted
    const formattedEvent = {
      ...event,
      startDate: event.startDate ? new Date(event.startDate).toISOString() : new Date().toISOString(),
      endDate: event.endDate ? new Date(event.endDate).toISOString() : new Date().toISOString(),
    };
    setSelectedEvent(formattedEvent);
    setShowEditDialog(true);
  };

  const handleHighlightEvent = (eventId: string) => {
    setHighlightedEventId(eventId);
    // Clear the highlight after 2 seconds
    setTimeout(() => {
      setHighlightedEventId(null);
    }, 2000);
  };

  const handleManageDocuments = (event: Event) => {
    setSelectedEvent(event);
    setShowSeriesDocumentsDialog(true);
  };
  const handleManageEventDocuments = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDocumentsDialog(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete event');
        }
        
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
        
        await fetchEvents();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        });
      }
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const [showEditSeriesDialog, setShowEditSeriesDialog] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  const handleEditSeries = (series: Series) => {
    setSelectedSeries(series);
    setShowEditSeriesDialog(true);
  };

  const handleManageSeriesDocuments = (seriesId: string) => {
    setSelectedEvent({
      id: seriesId,
      title: "Series Documents",
      type: "series",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });
    setShowSeriesDocumentsDialog(true);
  };

  const handleDeleteSeries = async (seriesId: string) => {
    if (confirm("Are you sure you want to delete this series? This will not delete the events in the series.")) {
      try {
        const response = await fetch(`/api/series/${encodeURIComponent(seriesId)}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete series');
        }

        toast({
          title: "Success",
          description: "Series deleted successfully",
        });

        await fetchEvents();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete series",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Events and Series</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <CreateEventForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {selectedEvent && (
        <>
          <EditEventDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            event={selectedEvent}
            onEventUpdated={fetchEvents}
          />

          <ManageDocumentsDialog
            eventId={selectedEvent.id}
            open={showEventDocumentsDialog}
            onOpenChange={setShowEventDocumentsDialog}
          />

          <ManageSeriesDocumentsDialog
            seriesId={selectedEvent.id}
            open={showSeriesDocumentsDialog}
            onOpenChange={setShowSeriesDocumentsDialog}
          />

          <ManageNoticesDialog
            open={showNoticesDialog}
            onOpenChange={setShowNoticesDialog}
            eventId={selectedEvent.id}
          />
        </>
      )}

      {selectedSeries && (
        <EditSeriesDialog
          open={showEditSeriesDialog}
          onOpenChange={setShowEditSeriesDialog}
          series={selectedSeries}
          onSeriesUpdated={fetchEvents}
        />
      )}
      
      <Tabs 
        defaultValue="all-events" 
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
          <TabsTrigger value="all-events" data-tab-value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming-events" data-tab-value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past-events" data-tab-value="past">Past Events</TabsTrigger>
          <TabsTrigger value="manage-series" data-tab-value="series">Manage Series</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming-events">
          {events.filter(event => new Date(event.startDate) >= new Date()).length === 0 ? (
            <Card className="p-4">
              <p className="text-center text-muted-foreground">No upcoming events found</p>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Series</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events
                  .filter(event => new Date(event.startDate) >= new Date())
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((event) => (
                    <TableRow 
                      key={event.id}
                      className={`${highlightedEventId === event.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      ref={highlightedEventId === event.id ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                    >
                      <TableCell>
                        <div className="bg-blue-600 text-white p-2 text-center rounded-lg w-20">
                          <div className="text-2xl font-bold">
                            {new Date(event.startDate).getDate()}
                          </div>
                          <div className="text-xs uppercase">
                            {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{event.type}</TableCell>
                      <TableCell>{event.location || '-'}</TableCell>
                      <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(event.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{event.seriesName || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary">
                              Actions <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              handleHighlightEvent(event.id);
                              handleEditEvent(event);
                            }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageEventDocuments(event)}>
                              Manage Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedEvent(event);
                              setShowNoticesDialog(true);
                            }}>
                              Manage Notices
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              setSelectedEvent(event);
                            }}>
                              <ManageEventResultsDialog eventId={event.id} />
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                            }}>
                              <ManageTimelineDialog eventId={event.id} />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="past-events">
          {events.filter(event => new Date(event.startDate) < new Date()).length === 0 ? (
            <Card className="p-4">
              <p className="text-center text-muted-foreground">No past events found</p>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Series</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events
                  .filter(event => new Date(event.startDate) < new Date())
                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                  .map((event) => (
                    <TableRow 
                      key={event.id}
                      className={`${highlightedEventId === event.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      ref={highlightedEventId === event.id ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                    >
                      <TableCell>
                        <div className="bg-blue-600 text-white p-2 text-center rounded-lg w-20">
                          <div className="text-2xl font-bold">
                            {new Date(event.startDate).getDate()}
                          </div>
                          <div className="text-xs uppercase">
                            {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{event.type}</TableCell>
                      <TableCell>{event.location || '-'}</TableCell>
                      <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(event.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{event.seriesName || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary">
                              Actions <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              handleHighlightEvent(event.id);
                              handleEditEvent(event);
                            }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageDocuments(event)}>
                              Manage Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedEvent(event);
                              setShowNoticesDialog(true);
                            }}>
                              Manage Notices
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              setSelectedEvent(event);
                            }}>
                              <ManageEventResultsDialog eventId={event.id} />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="all-events">
          {events.length === 0 ? (
            <Card className="p-4">
              <p className="text-center text-muted-foreground">No events found</p>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Series</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow 
                    key={event.id}
                    className={`${highlightedEventId === event.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    ref={highlightedEventId === event.id ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                  >
                    <TableCell>
                      <div className="bg-blue-600 text-white p-2 text-center rounded-lg w-20">
                        <div className="text-2xl font-bold">
                          {new Date(event.startDate).getDate()}
                        </div>
                        <div className="text-xs uppercase">
                          {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>{event.location || '-'}</TableCell>
                    <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(event.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{event.seriesName || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary">
                            Actions <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            handleHighlightEvent(event.id);
                            handleEditEvent(event);
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageDocuments(event)}>
                            Manage Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedEvent(event);
                            setShowNoticesDialog(true);
                          }}>
                            Manage Notices
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault();
                            setSelectedEvent(event);
                          }}>
                            <ManageEventResultsDialog eventId={event.id} />
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="manage-series">
          <div className="space-y-8">
            {series.length === 0 ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground">No series found</p>
              </Card>
            ) : (
              series.map((series) => (
                <div key={series.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{series.title}</h2>
                      <p className="text-sm text-muted-foreground">ID: {series.id}</p>
                    </div>
                    <div className="space-x-2">
                      <SeriesActionsDropdown
                        seriesId={series.id}
                        onEdit={() => handleEditSeries(series)}
                        onManageDocuments={() => handleManageSeriesDocuments(series.id)}
                        onManageNotices={() => {
                          if (series.events.length > 0) {
                            setSelectedEvent(series.events[0]);
                            setShowNoticesDialog(true);
                          } else {
                            toast({
                              title: "No Events",
                              description: "This series has no events to manage notices for",
                              variant: "destructive",
                            });
                          }
                        }}
                        onManageResults={() => {
                          if (series.events.length > 0) {
                            setSelectedEvent(series.events[0]);
                          } else {
                            toast({
                              title: "No Events",
                              description: "This series has no events to manage results for",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <Button variant="destructive" onClick={() => handleDeleteSeries(series.id)}>
                        Delete Series
                      </Button>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {series.events.map((event) => (
                        <TableRow 
                          key={event.id}
                          className={`${highlightedEventId === event.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-2' : ''}`}
                          ref={highlightedEventId === event.id ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                        >
                          <TableCell>
                            <div className="bg-blue-600 text-white p-2 text-center rounded-lg w-20">
                              <div className="text-2xl font-bold">
                                {new Date(event.startDate).getDate()}
                              </div>
                              <div className="text-xs uppercase">
                                {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>{event.type}</TableCell>
                          <TableCell>{event.location || '-'}</TableCell>
                          <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(event.endDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventsManager;