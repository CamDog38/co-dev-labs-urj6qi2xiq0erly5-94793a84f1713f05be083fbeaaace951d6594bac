import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useEffect, useState, useMemo, useRef } from "react"
import { useAppearance } from './AppearanceProvider'
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Result {
  id: string
  url: string
  dateRange: string
  boatClass: string
}

interface Event {
  id: string
  name: string
  results: Result[]
}

interface GroupedResults {
  [year: string]: Result[]
}

const extractYearFromDateRange = (dateRange: string): number | null => {
  try {
    const firstDate = dateRange.split(' to ')[0];
    const year = parseInt(firstDate.split('-')[0]);
    return isNaN(year) ? null : year;
  } catch (error) {
    console.error('Error extracting year from dateRange:', error);
    return null;
  }
}

interface ResultsWidgetProps {
  userId?: string;
  username?: string;
  publicMode?: boolean;
  apiEndpoint?: string;
}

export function ResultsWidget({ userId, username, publicMode = false, apiEndpoint }: ResultsWidgetProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { settings } = useAppearance();
  const [selectedYears, setSelectedYears] = useState<{ [key: string]: string }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const groupResultsByYear = (results: Result[]): GroupedResults => {
    return results.reduce((acc: GroupedResults, result) => {
      const year = extractYearFromDateRange(result.dateRange);
      if (year) {
        const yearStr = year.toString();
        if (!acc[yearStr]) {
          acc[yearStr] = [];
        }
        acc[yearStr].push(result);
      }
      return acc;
    }, {});
  };

  const processedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      groupedResults: groupResultsByYear(event.results)
    }));
  }, [events]);

  useEffect(() => {
    // Initialize selected years for each event
    const initialSelectedYears: { [key: string]: string } = {};
    processedEvents.forEach(event => {
      const years = Object.keys(event.groupedResults).sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        initialSelectedYears[event.id] = years[0];
      }
    });
    setSelectedYears(initialSelectedYears);
  }, [processedEvents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = apiEndpoint;
        if (!url) {
          const params = new URLSearchParams();
          if (debouncedSearch) params.append('search', debouncedSearch);
          if (userId) params.append('userId', userId);
          if (username) params.append('username', username);
          if (publicMode) params.append('public', 'true');
          const queryString = params.toString() ? `?${params.toString()}` : '';
          url = `/api/results${queryString}`;
        } else if (debouncedSearch) {
          url += `${url.includes('?') ? '&' : '?'}search=${debouncedSearch}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch results: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected array');
        }
        
        setEvents(data);
      } catch (error) {
        console.error('Error in fetchResults:', error);
        setError('Unable to load results. Please try again later.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch, userId]);

  const handleScroll = (direction: 'left' | 'right', eventId: string) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  if (loading) {
    return (
      <Card className="w-full bg-white rounded-lg shadow">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-full max-w-sm" />
            <div className="h-20 bg-slate-200 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAccordionView = (event: Event & { groupedResults: GroupedResults }) => {
    const years = Object.keys(event.groupedResults).sort((a, b) => b.localeCompare(a));
    
    return (
      <div key={event.id} className="mb-8">
        <h2 className="text-3xl font-bold mb-4">{event.name}</h2>
        <Accordion type="single" collapsible className="w-full">
          {years.map((year) => (
            <AccordionItem key={year} value={year}>
              <AccordionTrigger className="text-lg">
                {`${parseInt(year) - 1}-${year}`}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {event.groupedResults[year].map((result) => (
                    <a
                      key={result.id}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      {result.boatClass}
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  const renderTimelineView = (event: Event & { groupedResults: GroupedResults }) => {
    const years = Object.keys(event.groupedResults).sort((a, b) => b.localeCompare(a));
    const selectedYear = selectedYears[event.id] || years[0];

    return (
      <div key={event.id} className="mb-12">
        <h2 className="text-3xl font-bold mb-6">{event.name}</h2>
        
        {/* Timeline scroll container */}
        <div className="mb-6">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex p-4" ref={scrollContainerRef}>
              {years.map((year) => {
                const yearRange = `${parseInt(year) - 1}-${year}`;
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYears({ ...selectedYears, [event.id]: year })}
                    className={`inline-flex items-center justify-center px-4 py-2 mx-1 rounded-full transition-colors ${
                      selectedYear === year
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {yearRange}
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Results for selected year */}
        {selectedYear && event.groupedResults[selectedYear] && (
          <div className="space-y-2">
            {event.groupedResults[selectedYear].map((result) => (
              <div key={result.id} className="space-y-2">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 hover:bg-muted rounded-md transition-colors border"
                >
                  {result.boatClass}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full h-full bg-white rounded-lg shadow">
      <CardContent className="p-4 h-full">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search results..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {error ? (
          <div className="text-center text-red-600 py-4">
            {error}
          </div>
        ) : processedEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No results available
          </div>
        ) : (
          <div>
            {processedEvents.map((event) =>
              settings.resultsView === 'accordion'
                ? renderAccordionView(event)
                : renderTimelineView(event)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}