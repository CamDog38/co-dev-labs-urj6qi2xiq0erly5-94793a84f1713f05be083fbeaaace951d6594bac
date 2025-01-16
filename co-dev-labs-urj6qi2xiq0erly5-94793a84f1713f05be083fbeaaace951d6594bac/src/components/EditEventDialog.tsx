import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ManageDocumentsDialog } from "./ManageDocumentsDialog";
import { ManageNoticesDialog } from "./ManageNoticesDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

interface Event {
  id: string;
  title: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  seriesName?: string;
  description?: string;
  classes?: string[];
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
}

export function EditEventDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
}: EditEventDialogProps) {
  const [formData, setFormData] = useState<Event>(event);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    // Ensure we're setting all fields, including classes
    setFormData({
      ...event,
      classes: event.classes || [] // Ensure classes is always an array
    });
    
    // Extract times from dates if they exist
    if (event.startDate) {
      const startDateTime = new Date(event.startDate);
      setStartTime(
        `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`
      );
    }
    if (event.endDate) {
      const endDateTime = new Date(event.endDate);
      setEndTime(
        `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`
      );
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Combine dates with times
      const startDateTime = new Date(formData.startDate);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(formData.endDate);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      const updatedFormData = {
        ...formData,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      };

      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFormData),
      });

      if (!response.ok) throw new Error("Failed to update event");

      toast({
        title: "Event updated successfully",
      });
      onEventUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error updating event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete event");

      toast({
        title: "Event deleted successfully",
      });
      onEventUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error deleting event",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startTime') {
      setStartTime(value);
      return;
    }
    if (name === 'endTime') {
      setEndTime(value);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Date') && value ? new Date(value).toISOString() : value,
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Modify the event details, manage documents, and notices.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Name</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Input
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="classes">Boat Classes</Label>
                  <Input
                    id="classes"
                    name="classes"
                    value={(formData.classes || []).join(', ')}
                    onChange={(e) => {
                      const classes = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                      setFormData(prev => ({
                        ...prev,
                        classes
                      }));
                    }}
                    placeholder="e.g., Laser, 420, Optimist (comma-separated)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <div className="flex gap-2">
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                      required
                      className="flex-1"
                    />
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={startTime}
                      onChange={handleInputChange}
                      required
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <div className="flex gap-2">
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                      required
                      className="flex-1"
                    />
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={endTime}
                      onChange={handleInputChange}
                      required
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    Save Changes
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="documents">
              <ManageDocumentsDialog eventId={event.id} embedded={true} />
            </TabsContent>
            <TabsContent value="notices">
              <ManageNoticesDialog eventId={event.id} embedded={true} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}