import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ManageDocumentsDialog } from './ManageDocumentsDialog';
import { ManageNoticesDialog } from './ManageNoticesDialog';
import { ManageEventResultsDialog } from './ManageEventResultsDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface Series {
  id: string;
  title: string;
}

export function SeriesManagementRibbon() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [series, setSeries] = useState<Series[]>([]);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isSeriesSelectOpen, setIsSeriesSelectOpen] = useState(false);
  const [actionType, setActionType] = useState<'documents' | 'notices' | 'results' | null>(null);
  const { toast } = useToast();

  const fetchSeries = async () => {
    try {
      const response = await fetch('/api/series');
      const data = await response.json();
      setSeries(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch series',
        variant: 'destructive',
      });
    }
  };

  const handleActionClick = (type: 'documents' | 'notices' | 'results') => {
    setActionType(type);
    fetchSeries();
    setIsSeriesSelectOpen(true);
  };

  const handleSeriesSelect = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setIsSeriesSelectOpen(false);

    switch (actionType) {
      case 'documents':
        setIsDocumentsOpen(true);
        break;
      case 'notices':
        setIsNoticesOpen(true);
        break;
      case 'results':
        setIsResultsOpen(true);
        break;
    }
  };

  return (
    <>
      <div className="flex space-x-2 mb-4">
        <Button
          variant="outline"
          onClick={() => handleActionClick('documents')}
        >
          Manage Documents
        </Button>
        <Button
          variant="outline"
          onClick={() => handleActionClick('notices')}
        >
          Manage Notices
        </Button>
        <Button
          variant="outline"
          onClick={() => handleActionClick('results')}
        >
          Manage Results
        </Button>
      </div>

      <Dialog open={isSeriesSelectOpen} onOpenChange={setIsSeriesSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Series</DialogTitle>
          </DialogHeader>
          <Select onValueChange={handleSeriesSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a series" />
            </SelectTrigger>
            <SelectContent>
              {series.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      {selectedSeriesId && (
        <>
          <ManageDocumentsDialog
            open={isDocumentsOpen}
            onOpenChange={setIsDocumentsOpen}
            seriesId={selectedSeriesId}
          />
          <ManageNoticesDialog
            open={isNoticesOpen}
            onOpenChange={setIsNoticesOpen}
            seriesId={selectedSeriesId}
          />
          <ManageEventResultsDialog
            open={isResultsOpen}
            onOpenChange={setIsResultsOpen}
            seriesId={selectedSeriesId}
          />
        </>
      )}
    </>
  );
}