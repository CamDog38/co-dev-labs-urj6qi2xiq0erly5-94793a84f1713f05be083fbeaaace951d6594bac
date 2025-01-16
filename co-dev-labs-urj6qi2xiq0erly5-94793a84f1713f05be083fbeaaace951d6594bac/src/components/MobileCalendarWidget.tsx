import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import { useAppearance } from './AppearanceProvider';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PublicEventView } from './PublicEventView';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  color?: string;
  eventType?: string;
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    seriesId?: string | null;
  }>;
  notices?: Array<{
    id: string;
    subject: string;
    message: string;
    createdAt: string;
  }>;
}

interface MobileCalendarWidgetProps {
  onEventClick?: (eventId: string) => void;
  apiEndpoint?: string;
  onError?: (error: Error) => void;
}

import { EventSearch } from './EventSearch';

export function MobileCalendarWidget({ 
  onEventClick, 
  apiEndpoint = '/api/events/public',
  onError 
}: MobileCalendarWidgetProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [calendarApi, setCalendarApi] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');

  useEffect(() => {
    fetchEvents();
    // Set initial title
    setTitle(format(new Date(), 'MMMM yyyy'));
  }, []);

  const { settings } = useAppearance();

  // Refetch events when appearance settings change
  useEffect(() => {
    if (settings?.eventColors) {
      fetchEvents();
    }
  }, [settings?.eventColors]);

  const fetchEvents = async () => {
    try {
      setError(null);
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEvents(data.map((event: any) => {
        // Map event type to color from appearance settings
        const eventType = event.type?.toLowerCase() || 'default';
        const color = settings?.eventColors?.[eventType] || settings?.eventColors?.default || '#2563eb';
        
        return {
          id: event.id,
          title: event.title,
          start: new Date(event.startDate).toISOString(),
          end: new Date(event.endDate).toISOString(),
          description: event.description,
          location: event.location,
          color: color, // Use color from appearance settings
          eventType: event.type,
          documents: event.documents || [],
          notices: event.notices || [],
          backgroundColor: color, // Set backgroundColor for FullCalendar
        };
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
      setError(errorMessage);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Failed to fetch events'));
      }
    }
  };

  const handlePrevClick = () => {
    if (calendarApi) {
      calendarApi.prev();
    }
  };

  const handleNextClick = () => {
    if (calendarApi) {
      calendarApi.next();
    }
  };

  const handleDateClick = (arg: any) => {
    if (calendarApi) {
      calendarApi.changeView('timeGridDay', arg.date);
      setActiveView('timeGridDay');
    }
  };

  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    if (calendarApi) {
      calendarApi.changeView(view);
      setActiveView(view);
    }
  };

  const handleDatesSet = (arg: any) => {
    if (!calendarApi) return;
    
    const view = calendarApi.view;
    setActiveView(view.type as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay');
    
    const date = calendarApi.getDate();
    switch (view.type) {
      case 'timeGridDay':
        setTitle(format(date, 'MMMM d, yyyy'));
        break;
      case 'timeGridWeek':
        const start = view.currentStart;
        const end = view.currentEnd;
        const startStr = format(start, 'MMM d');
        const endStr = format(new Date(end.getTime() - 24 * 60 * 60 * 1000), 'MMM d');
        setTitle(`${startStr} – ${endStr}`);
        break;
      default:
        setTitle(format(date, 'MMMM yyyy'));
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow flex flex-col overflow-hidden">
      {error && (
        <Alert variant="destructive" className="m-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="p-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevClick}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextClick}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-base font-semibold ml-2">{title}</span>
          </div>
          <div className="flex items-center">
            <Select
              value={activeView}
              onValueChange={(value: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => handleViewChange(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dayGridMonth">Month</SelectItem>
                <SelectItem value="timeGridWeek">Week</SelectItem>
                <SelectItem value="timeGridDay">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="calendar-container flex-grow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          nowIndicator={true}
          scrollTime="00:00:00"
          headerToolbar={false}
          events={events}
          height="auto"
          dayMaxEvents={2}
          moreLinkClick="day"
          expandRows={false}
          stickyHeaderDates={true}
          handleWindowResize={true}
          selectable={true}
          selectMirror={true}
          editable={false}
          navLinks={true}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          dateClick={handleDateClick}
          eventClick={(arg) => {
            if (onEventClick) {
              onEventClick(arg.event.id);
            } else {
              const event = events.find(e => e.id === arg.event.id);
              if (event) {
                setSelectedEvent(event);
                setIsEventDialogOpen(true);
              }
            }
          }}
          ref={(el) => {
            if (el) {
              setCalendarApi(el.getApi());
            }
          }}
          datesSet={handleDatesSet}
          eventContent={(arg) => {
            return (
              <div className="w-full px-2 py-1 rounded-md text-white text-sm font-medium" style={{ backgroundColor: arg.event.backgroundColor }}>
                {arg.event.title}
              </div>
            )
          }}
          views={{
            dayGridMonth: {
              dayHeaderFormat: { weekday: 'narrow' },
              dayHeaderClassNames: 'text-sm font-semibold',
              dayCellClassNames: 'text-sm cursor-pointer hover:bg-gray-50',
              eventClassNames: 'text-xs rounded-md border-none shadow-sm',
              titleFormat: { year: 'numeric', month: 'long' },
              fixedWeekCount: false,
              showNonCurrentDates: false,
            },
            timeGridWeek: {
              dayHeaderFormat: { weekday: 'short' },
              slotDuration: '00:30:00',
              slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }
            },
            timeGridDay: {
              dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' },
              slotDuration: '00:30:00',
              slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }
            }
          }}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'PPPP') : 'Events'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDateEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border"
                onClick={() => {
                  if (onEventClick) {
                    onEventClick(event.id);
                  } else {
                    setSelectedEvent(event);
                    setIsEventDialogOpen(true);
                    setIsDialogOpen(false);
                  }
                }}
              >
                <h4 className="font-semibold">{event.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start), 'p')} - {format(new Date(event.end), 'p')}
                </p>
                {event.description && (
                  <p className="text-sm mt-2">{event.description}</p>
                )}
                {event.location && (
                  <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                )}
              </div>
            ))}
            {selectedDateEvents.length === 0 && (
              <p className="text-center text-muted-foreground">No events for this day</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .calendar-container {
          height: 100%;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          position: relative;
          z-index: 0;
        }
        /* Z-index management for proper stacking */
        :global([data-radix-popper-content-wrapper]) {
          z-index: 50 !important;
        }
        /* Ensure Select component's dropdown stays on top */
        :global(.select-content) {
          z-index: 50 !important;
        }
        /* Calendar elements stacking */
        .fc-view-harness,
        .fc-scrollgrid,
        .fc-scroller {
          z-index: 0;
        }
        /* Header controls stacking */
        .fc-header-toolbar {
          position: relative;
          z-index: 1;
        }
        .fc .fc-daygrid-day {
          min-height: 100px !important;
        }
        .fc .fc-daygrid-day-events {
          min-height: 70px !important;
        }
        .fc-theme-standard td {
          border: 1px solid #e5e7eb;
        }
        .fc-theme-standard th {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .fc-day-today {
          background-color: #f3f4f6 !important;
        }
        .fc-daygrid-day-number {
          padding: 4px 8px !important;
          color: #374151;
        }
        .fc-daygrid-day-top {
          flex-direction: row !important;
        }
        .fc-more-link {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 4px;
          margin: 2px;
          display: block;
          text-align: center;
          font-size: 12px;
          color: #374151;
        }
        .fc-timegrid-slot {
          height: 40px !important;
        }
        .fc-timegrid-slot-label {
          font-size: 12px;
          color: #374151;
        }
        .fc-timegrid-axis {
          padding: 0 8px !important;
        }
        .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
        }
        .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          color: #ef4444;
        }
        .fc-event {
          border: none !important;
          background: none !important;
          margin: 2px !important;
        }
        .fc-event-time {
          display: none !important;
        }
        .fc-event-dot {
          display: none !important;
        }
        .fc-daygrid-event-dot {
          display: none !important;
        }
      `}</style>

      <PublicEventView
        event={selectedEvent ? {
          ...selectedEvent,
          startDate: selectedEvent.start,
          endDate: selectedEvent.end,
          type: selectedEvent.eventType || 'General',
          documents: selectedEvent.documents?.map(doc => ({
            ...doc,
            seriesId: doc.seriesId || null,
            isSeriesDocument: !!doc.seriesId
          })) || [],
          notices: selectedEvent.notices || []
        } : null}
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
      />
    </div>
  );
}