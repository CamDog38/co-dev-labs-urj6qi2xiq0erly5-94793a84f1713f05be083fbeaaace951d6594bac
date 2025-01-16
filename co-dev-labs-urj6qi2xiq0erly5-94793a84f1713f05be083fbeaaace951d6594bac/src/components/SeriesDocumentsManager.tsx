import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SeriesDocumentUpload } from './SeriesDocumentUpload';
import { useToast } from '@/components/ui/use-toast';

interface Document {
  id: number;
  title: string;
  url: string;
}

interface SeriesDocumentsManagerProps {
  seriesId: number;
  documents: Document[];
  onDocumentsChange: () => void;
}

export function SeriesDocumentsManager({
  seriesId,
  documents,
  onDocumentsChange,
}: SeriesDocumentsManagerProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (documentId: number) => {
    try {
      const response = await fetch(`/api/series/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      
      onDocumentsChange();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Series Documents</h3>
        <Button onClick={() => setIsUploadOpen(true)}>
          Upload Document
        </Button>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {doc.title}
            </a>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(doc.id)}
            >
              Delete
            </Button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-gray-500 text-center">No documents uploaded yet</p>
        )}
      </div>

      <SeriesDocumentUpload
        seriesId={seriesId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={onDocumentsChange}
      />
    </div>
  );
}