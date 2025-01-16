import { format } from 'date-fns';
import { Calendar, MapPin, Flag } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Document {
  id: string;
  name: string;
  url: string;
  seriesId?: string | null;
}

interface Notice {
  id: string;
  subject: string;
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
  location?: string;
  eventType?: string;
  classes?: string[];
  documents?: Document[];
  notices?: Notice[];
}

interface PublicEventViewProps {
  event: Event | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PublicEventView({ event, open, onOpenChange }: PublicEventViewProps) {
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});

  if (!event) {
    return null;
  }

  const isPast = new Date(event.endDate) < new Date();

  const toggleNotice = (noticeId: string) => {
    setExpandedNotices(prev => ({
      ...prev,
      [noticeId]: !prev[noticeId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <ScrollArea className="h-full max-h-[calc(90vh-2rem)]">
          <div className="space-y-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                {isPast && <Badge variant="destructive">Past</Badge>}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Start: {format(new Date(event.startDate), 'EEE, MMMM d, h:mm a')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>End: {format(new Date(event.endDate), 'EEE, MMMM d, h:mm a')}</span>
                </div>

                {event.classes && event.classes.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Classes:</span>
                    {event.classes.map((className, index) => (
                      <Badge key={index} variant="secondary">
                        {className}
                      </Badge>
                    ))}
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location: {event.location}</span>
                  </div>
                )}

                {event.eventType && (
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    <span>Type: {event.eventType}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notices</h3>
              {event.notices && event.notices.length > 0 ? (
                <div className="space-y-3">
                  {event.notices.map((notice) => {
                    const isExpanded = expandedNotices[notice.id];
                    return (
                      <div key={notice.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h4 className="font-medium">{notice.subject}</h4>
                            {isExpanded && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {notice.content}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Added: {format(new Date(notice.createdAt), 'MM/dd/yyyy, hh:mm:ss a')}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleNotice(notice.id)}
                          >
                            {isExpanded ? 'Hide' : 'Show'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No notices yet</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
              {event.documents && event.documents.length > 0 ? (
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 text-sm font-medium">Document Name</th>
                        <th className="text-right p-3 text-sm font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.documents.map((doc) => (
                        <tr key={doc.id} className="border-b last:border-b-0">
                          <td className="p-3">{doc.name}</td>
                          <td className="text-right p-3">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No Documents Available</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}