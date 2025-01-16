import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Notice {
  id: string;
  content: string;
  createdAt: string;
  sequence: number;
  createdBy: {
    email: string;
  };
}

interface EventNoticesProps {
  notices: Notice[];
}

export function EventNotices({ notices }: EventNoticesProps) {
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});

  const toggleNotice = (noticeId: string) => {
    setExpandedNotices(prev => ({
      ...prev,
      [noticeId]: !prev[noticeId]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Sort notices by sequence to maintain consistent order
  const sortedNotices = [...notices].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="space-y-4">
      <div className="font-medium">Notices</div>
      {sortedNotices.map((notice) => {
        const isExpanded = expandedNotices[notice.id];

        return (
          <div
            key={notice.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="p-4 space-y-2">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium leading-none">{notice.content}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleNotice(notice.id)}
                  >
                    {isExpanded ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {isExpanded && (
                  <div className="text-sm text-muted-foreground">
                    <p>This is a notice from the sailing club.</p>
                    <p>Please read it carefully and take any necessary actions.</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Added: {formatDate(notice.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}