import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimelineManagement } from './TimelineManagement';

interface ManageTimelineDialogProps {
  eventId: string;
}

export function ManageTimelineDialog({ eventId }: ManageTimelineDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-left">
          Manage Timeline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Race Timeline</DialogTitle>
        </DialogHeader>
        <TimelineManagement eventId={eventId} />
      </DialogContent>
    </Dialog>
  );
}