import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import NoticeBoard from "./NoticeBoard";
import { EventNotices } from "./EventNotices";
import { ManageEventResultsDialog } from "./ManageEventResultsDialog";
import { ManageTimelineDialog } from "./ManageTimelineDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Calendar, MapPin, Tag, FileText, Settings } from "lucide-react";
import { useState, useEffect } from "react";

interface Document {
  id: string;
  name: string;
  url: string;
  seriesId: string | null;
  type: string;
  eventId: string;
}

interface Notice {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    email: string;
  };
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  eventType: string;
  documents: Document[];
  notices: Notice[];
  series?: string;
  status?: 'Upcoming' | 'Past';
  description?: string;
}

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'table';
  onNoticeAdded?: () => void;
  isHighlighted?: boolean;
}

// Helper function to parse notice content
const parseNoticeContent = (content: string) => {
  const [subject, ...messageParts] = content.split('\n')
  return {
    subject,
    message: messageParts.join('\n')
  }
}

export function EventCard({ event, variant = 'default', onNoticeAdded, isHighlighted }: EventCardProps) {
  // Remove the state and useEffect since we always want to show the maintenance icon
  const showMaintenanceIcon = true;
  if (variant === 'table') {
    return (
      <div className="flex items-center w-full py-4 border-b border-gray-200">
        <div className="w-24">
          <div className="text-sm font-medium text-gray-500">Date</div>
          {format(new Date(event.startDate), 'yyyy-MM-dd')}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500">Event Name</div>
          <div className="font-medium">{event.title}</div>
          {event.description && <div className="text-sm text-gray-500">{event.description}</div>}
        </div>
        <div className="w-32">
          <div className="text-sm font-medium text-gray-500">Type</div>
          <Badge variant="secondary">{event.eventType}</Badge>
        </div>
        <div className="w-32">
          <div className="text-sm font-medium text-gray-500">Location</div>
          {event.location}
        </div>
        <div className="w-32">
          <div className="text-sm font-medium text-gray-500">Start Date</div>
          {format(new Date(event.startDate), 'MMM dd, yyyy')}
        </div>
        <div className="w-32">
          <div className="text-sm font-medium text-gray-500">End Date</div>
          {format(new Date(event.endDate), 'MMM dd, yyyy')}
        </div>
        <div className="w-48">
          <div className="text-sm font-medium text-gray-500">Series</div>
          {event.series || '-'}
        </div>
        <div className="w-24">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card className={`w-full p-6 relative ${isHighlighted ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
      {showMaintenanceIcon && (
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )}
      {event.status && (
        <Badge 
          variant="secondary" 
          className="mb-4 bg-pink-50 text-pink-700 hover:bg-pink-50 hover:text-pink-700"
        >
          {event.status}
        </Badge>
      )}

      <h2 className="text-xl font-semibold text-blue-600 mb-6">{event.title}</h2>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Start:</span>
              <span>{format(new Date(event.startDate), 'EEE, MMMM d')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">End:</span>
            <span>{format(new Date(event.endDate), 'EEE, MMMM d')}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Location:</span>
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Type:</span>
            <span>{event.eventType}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <NoticeBoard 
          eventId={event.id} 
          notices={event.notices || []} 
          onNoticeAdded={onNoticeAdded} 
        />

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <ManageEventResultsDialog eventId={event.id} />
            <ManageTimelineDialog eventId={event.id} isTimelineActive={false} onUpdate={() => {}} />
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-4 font-medium text-gray-600">Document Name</th>
                <th className="text-left py-2 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-2 px-4 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {event.documents && event.documents.length > 0 ? (
                event.documents.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-b-0">
                    <td className="py-2 px-4">{doc.name}</td>
                    <td className="py-2 px-4">
                      <Badge variant="outline" className={doc.seriesId ? "bg-blue-50" : ""}>
                        {doc.seriesId ? "Series" : "Event"}
                      </Badge>
                    </td>
                    <td className="py-2 px-4">
                      <a 
                        href={doc.url} 
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Link
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-gray-500">
                    No Documents Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}