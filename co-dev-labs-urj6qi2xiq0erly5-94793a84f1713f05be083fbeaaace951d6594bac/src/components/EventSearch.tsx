import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import debounce from 'lodash/debounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { PublicEventView } from './PublicEventView';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  type?: string;
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

export function EventSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const { toast } = useToast();

  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/events/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        toast({
          title: "Search Error",
          description: "Failed to perform search. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="mt-2 border rounded-md divide-y">
          {searchResults.map((event) => (
            <button
              key={event.id}
              className="w-full px-4 py-3 text-left hover:bg-gray-50"
              onClick={() => handleEventClick(event)}
            >
              <h3 className="font-medium">{event.title}</h3>
              <div className="mt-1 space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="font-medium">Start:</span>
                  <span className="ml-1">{format(new Date(event.startDate), 'EEE, MMMM d')}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="font-medium">End:</span>
                  <span className="ml-1">{format(new Date(event.endDate), 'EEE, MMMM d')}</span>
                </div>
                {event.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-medium">Location:</span>
                    <span className="ml-1">{event.location}</span>
                  </div>
                )}
                {event.type && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-medium">Type:</span>
                    <span className="ml-1">{event.type}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Searching...
        </div>
      )}

      {searchQuery.length > 0 && !isSearching && searchResults.length === 0 && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          No events found
        </div>
      )}

      <PublicEventView
        event={selectedEvent}
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
      />
    </div>
  );
}