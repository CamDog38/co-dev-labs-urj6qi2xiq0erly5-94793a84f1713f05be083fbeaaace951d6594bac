import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { Textarea } from "./ui/textarea";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface Notice {
  id: string;
  subject: string;
  content: string;
  eventId: string;
  createdAt: string;
  sequence: number;
}

interface ManageNoticesDialogProps {
  eventId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  embedded?: boolean;
}

export function ManageNoticesDialog({
  eventId,
  open,
  onOpenChange,
  embedded = false,
}: ManageNoticesDialogProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotices = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('eventId', eventId);
      
      const response = await fetch(`/api/notices?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch notices");
      const data = await response.json();
      setNotices(data.sort((a: Notice, b: Notice) => a.sequence - b.sequence));
    } catch (error) {
      toast({
        title: "Error fetching notices",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (eventId && (embedded || open)) {
      fetchNotices();
    }
  }, [eventId, embedded, open]);

  const handleAddNotice = async () => {
    if (!subject || !message) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/notices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          content: message,
          eventId,
          sequence: notices.length,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add notice');
      }

      toast({
        title: "Notice added successfully",
      });
      setSubject("");
      setMessage("");
      await fetchNotices();
    } catch (error) {
      toast({
        title: "Error adding notice",
        description: error instanceof Error ? error.message : "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notice");

      toast({
        title: "Notice deleted successfully",
      });
      await fetchNotices();
    } catch (error) {
      toast({
        title: "Error deleting notice",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (noticeId: string, direction: 'up' | 'down') => {
    const currentIndex = notices.findIndex(notice => notice.id === noticeId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === notices.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newNotices = [...notices];
    const [movedItem] = newNotices.splice(currentIndex, 1);
    newNotices.splice(newIndex, 0, movedItem);

    const updatedNotices = newNotices.map((notice, index) => ({
      ...notice,
      order: index,
    }));

    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sequence: newIndex,
        }),
      });

      if (!response.ok) throw new Error('Failed to update notice order');

      setNotices(updatedNotices);
    } catch (error) {
      toast({
        title: "Error updating notice order",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const NoticesContent = () => (
    <div className="space-y-4 p-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter notice subject"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notice message"
            rows={4}
          />
        </div>
        <Button onClick={handleAddNotice} disabled={isLoading}>
          Add Notice
        </Button>
      </div>

      <div className="mt-6">
        <h4 className="mb-4 font-medium">Existing Notices</h4>
        <div className="space-y-2">
          {notices.length === 0 ? (
            <p className="text-sm text-gray-500">No notices added yet</p>
          ) : (
            notices.map((notice, index) => (
              <div
                key={notice.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex-1">
                  <div className="font-medium">{notice.subject}</div>
                  <div className="text-sm text-gray-600 mt-1">{notice.content}</div>
                  <span className="text-xs text-gray-500">
                    Added: {formatDate(notice.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(notice.id, 'up')}
                      disabled={index === 0}
                      className="h-6 px-2"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(notice.id, 'down')}
                      disabled={index === notices.length - 1}
                      className="h-6 px-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteNotice(notice.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <ScrollArea className="h-[500px]">
        <NoticesContent />
      </ScrollArea>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Notices</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <ScrollArea className="h-[calc(90vh-200px)]">
            <NoticesContent />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}