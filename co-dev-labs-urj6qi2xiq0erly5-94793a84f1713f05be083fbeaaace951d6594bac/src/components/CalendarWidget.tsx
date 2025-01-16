import { useEffect, useState } from 'react';
import { EventSearch } from './EventSearch';
import { useAppearance } from './AppearanceProvider';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PublicEventView } from './PublicEventView';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

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
  }>;
  notices?: Array<{
    id: string;
    subject: string;
    message: string;
    createdAt: string;
  }>;
}

interface CalendarWidgetProps {
  onEventClick?: (eventId: string) => void;
  publicMode?: boolean;
  apiEndpoint?: string;
  onError?: (error: Error) => void;
  username?: string;
}

function CalendarWidget({ onEventClick, publicMode = false, apiEndpoint = '/api/events' }: CalendarWidgetProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [calendarApi, setCalendarApi] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetchEvents();
  }, [apiEndpoint]);

  const { settings } = useAppearance();

  const fetchEvents = async () => {
    try {
      console.log('Fetching events from:', apiEndpoint);
      const response = await fetch(apiEndpoint);
      let data;
      
      try {
        const textResponse = await response.text();
        data = JSON.parse(textResponse);
        console.log('Raw response:', textResponse);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response format');
      }

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Handle both array and object responses
      const eventsArray = Array.isArray(data) ? data : data.events || [];

      const transformedEvents = data.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        description: event.description,
        location: event.location,
        color: settings.eventColors?.[event.type || 'default'] || '#2563eb',
        eventType: event.type,
        documents: event.documents,
        notices: event.notices,
        series: event.series,
      }));

      console.log('Transformed events:', transformedEvents);
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]); // Clear events on error
      if (onError) {
        onError(error instanceof Error ? error : new Error('Failed to fetch events'));
      }
    }
  };

  const handleViewChange = (value: string) => {
    if (calendarApi) {
      calendarApi.changeView(value);
      setTitle(calendarApi.view.title);
    }
    setCurrentView(value);
  };

  const handlePrevClick = () => {
    if (calendarApi) {
      calendarApi.prev();
      setTitle(calendarApi.view.title);
    }
  };

  const handleNextClick = () => {
    if (calendarApi) {
      calendarApi.next();
      setTitle(calendarApi.view.title);
    }
  };

  const handleDateClick = (arg: any) => {
    const clickedDate = new Date(arg.date);
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart.toDateString() === clickedDate.toDateString();
    });
    
    setSelectedDate(clickedDate);
    setSelectedDateEvents(dayEvents);
    
    if (isMobile || dayEvents.length > 2) {
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    if (calendarApi) {
      setTitle(calendarApi.view.title);
    }
  }, [calendarApi]);

  const CustomViewSelector = () => {
    const viewOptions = [
      { value: 'dayGridMonth', label: 'Month' },
      { value: 'timeGridWeek', label: 'Week' },
      { value: 'timeGridDay', label: 'Day' }
    ];
    return (
      <Select value={currentView} onValueChange={handleViewChange}>
        <SelectTrigger className="w-[100px] h-8 text-sm">
          <SelectValue placeholder="View" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dayGridMonth">Month</SelectItem>
          <SelectItem value="timeGridWeek">Week</SelectItem>
          <SelectItem value="timeGridDay">Day</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  const EventContent = ({ event }: { event: any }) => {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div
            className="text-xs px-1 py-0.5 rounded-sm truncate cursor-pointer"
            style={{ backgroundColor: event.backgroundColor }}
          >
            {event.title}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{event.title}</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(event.start), 'PPp')}
            </p>
            {event.description && (
              <p className="text-sm">{event.description}</p>
            )}
            {event.location && (
              <p className="text-sm text-muted-foreground">{event.location}</p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow flex flex-col overflow-hidden">
      <div className="p-2 sm:p-4 border-b flex-shrink-0">
        <div className="w-full mb-4">
          <EventSearch />
        </div>
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
            <span className="text-lg font-semibold ml-2">{title}</span>
          </div>
          <CustomViewSelector />
        </div>
      </div>
      <div className="calendar-container flex-grow overflow-hidden relative">
        <FullCalendar
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
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
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
          dateClick={handleDateClick}
          eventContent={(arg) => <EventContent event={arg.event} />}
          views={{
            dayGridMonth: {
              dayHeaderFormat: { weekday: 'narrow' },
              dayHeaderClassNames: 'text-sm font-semibold sticky-header',
              dayCellClassNames: 'text-sm cursor-pointer hover:bg-gray-50',
              eventClassNames: 'text-xs px-1 py-0.5 rounded-sm truncate',
              titleFormat: { year: 'numeric', month: 'long' },
              fixedWeekCount: false,
              showNonCurrentDates: !isMobile,
              dayMaxEventRows: 2,
            },
            timeGridWeek: {
              dayHeaderFormat: { weekday: 'narrow' },
              slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: true,
                meridiem: 'short'
              },
              slotMinTime: '00:00:00',
              slotMaxTime: '24:00:00',
              slotDuration: '00:30:00'
            },
            timeGridDay: {
              dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' },
              slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: true,
                meridiem: 'short'
              },
              slotMinTime: '00:00:00',
              slotMaxTime: '24:00:00',
              slotDuration: '00:30:00'
            }
          }}
          allDaySlot={true}
          nowIndicator={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          eventDisplay="block"
          eventInteractive={true}
          className="custom-calendar"
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

      <PublicEventView
        event={selectedEvent ? {
          ...selectedEvent,
          startDate: selectedEvent.start,
          endDate: selectedEvent.end,
          eventType: selectedEvent.eventType || 'General',
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

      <style jsx global>{`
        .calendar-container {
          height: 100%;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }
        .calendar-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .calendar-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .calendar-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .calendar-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .fc .fc-scroller-liquid-absolute {
          position: static !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
        }
        .fc-direction-ltr .fc-timegrid-col-events {
          margin: 0 2px 0 2px !important;
        }
        .fc .fc-timegrid-now-indicator-arrow {
          border-color: #2563eb !important;
        }
        .fc .fc-timegrid-now-indicator-line {
          border-color: #2563eb !important;
        }
        .custom-calendar {
          height: 100% !important;
        }
        .fc-scroller {
          height: 100% !important;
        }
        .fc-scroller-liquid-absolute {
          position: absolute !important;
        }
        .fc-timegrid, .fc-timegrid-body, .fc-timegrid-slots {
          height: 100% !important;
        }
        .fc-timegrid .fc-scroller-liquid-absolute {
          overflow: auto !important;
        }
        .custom-calendar .fc-scrollgrid {
          border: none !important;
        }
        .custom-calendar .fc-scrollgrid td {
          border: 1px solid #e5e7eb !important;
        }
        .custom-calendar .fc-scrollgrid-section-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: white;
        }
        .custom-calendar .fc-scrollgrid-section-header > td {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: white;
        }
        .custom-calendar .fc-day-today {
          background-color: #f3f4f6 !important;
        }
        .custom-calendar .fc-daygrid-body {
          width: 100% !important;
        }
        .custom-calendar .fc-scrollgrid-sync-table {
          width: 100% !important;
        }
        .custom-calendar .fc-view-harness {
          height: 100% !important;
        }
        .custom-calendar .fc-daygrid-body {
          height: 100% !important;
        }
        .custom-calendar .fc-view {
          height: 100% !important;
        }
        .custom-calendar .fc-daygrid-body-balanced {
          height: auto !important;
        }
        .custom-calendar .fc-daygrid-body-unbalanced {
          height: auto !important;
        }
        .custom-calendar .fc-timegrid-slot {
          height: 40px !important;
        }
        .custom-calendar .fc-timegrid-axis {
          padding: 0.5rem;
        }
        .custom-calendar .fc-event {
          border-radius: 4px;
          padding: 2px 4px;
          touch-action: manipulation;
          margin: 1px 0;
          border: none !important;
        }
        .custom-calendar .fc-day-grid-event {
          margin: 1px 2px;
        }
        .custom-calendar .fc-timegrid-event {
          border-radius: 4px !important;
          margin: 0 !important;
          padding: 4px !important;
          min-height: 25px !important;
          border: none !important;
        }
        .custom-calendar .fc-timegrid-event .fc-event-main {
          padding: 4px !important;
        }
        .custom-calendar .fc-timegrid-event .fc-event-title {
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          white-space: normal !important;
          overflow: visible !important;
          line-height: 1.2 !important;
        }
        .custom-calendar .fc-timegrid-event .fc-event-time {
          font-size: 0.75rem !important;
          opacity: 0.9;
          padding-bottom: 2px;
          font-weight: 500 !important;
        }
        .custom-calendar .fc-v-event {
          border: none !important;
          background-color: var(--event-bg-color, #2563eb) !important;
        }
        .custom-calendar .fc-timegrid-event-harness {
          margin: 0 2px !important;
        }
        .custom-calendar .fc-timegrid-now-indicator-line {
          border-width: 2px;
        }
        .custom-calendar .fc-daygrid-day-number {
          padding: 4px 8px;
          color: #374151;
        }
        .custom-calendar .fc-daygrid-day-top {
          flex-direction: row;
        }
        .custom-calendar .fc-view-harness {
          touch-action: pan-y pinch-zoom;
        }
        .custom-calendar .fc-col-header {
          position: sticky;
          top: 0;
          z-index: 1;
          background: white;
        }
        /* Z-index management for proper stacking */
        .custom-calendar {
          position: relative;
          z-index: 0;
        }
        /* Ensure dropdowns appear above calendar */
        :global([data-radix-popper-content-wrapper]) {
          z-index: 50 !important;
        }
        /* Calendar container stacking */
        .calendar-container {
          position: relative;
          z-index: 0;
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
        /* Ensure Select component's dropdown stays on top */
        :global(.select-content) {
          z-index: 50 !important;
        }
        /* Ensure hover card content stays on top */
        :global(.hover-card-content) {
          z-index: 50 !important;
        }
        .custom-calendar .fc-daygrid-body {
          overflow-y: auto !important;
        }
        .custom-calendar .fc-daygrid-day {
          min-height: ${isMobile ? '100px' : '120px'} !important;
        }
        .custom-calendar .fc-daygrid-day-events {
          min-height: ${isMobile ? '70px' : '90px'} !important;
          overflow: visible;
        }
        .custom-calendar .fc-more-link {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 4px;
          margin: 2px;
          display: block;
          text-align: center;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .custom-calendar .fc-toolbar {
            flex-direction: row;
            gap: 0.5rem;
            padding: 0.5rem;
          }
          .custom-calendar .fc-view {
            touch-action: pan-y pinch-zoom;
          }
          .custom-calendar .fc-scrollgrid-sync-table {
            min-height: 400px;
          }
          .custom-calendar .fc-timegrid-axis {
            padding: 0.25rem;
          }
          .custom-calendar .fc-timegrid-slot {
            height: 50px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CalendarWidget;