import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Document {
  id: string;
  name: string;
  url: string;
  seriesId: string;
  createdAt: string;
  order: number;
}

interface ManageSeriesDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
}

export function ManageSeriesDocumentsDialog({
  open,
  onOpenChange,
  seriesId,
}: ManageSeriesDocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("file");
  const [documentUrl, setDocumentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('seriesId', seriesId);
      
      const response = await fetch(`/api/documents?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data.sort((a: Document, b: Document) => a.order - b.order));
    } catch (error) {
      toast({
        title: "Error fetching documents",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open, seriesId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Set document name if not already set
    if (!documentName) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setDocumentName(fileName);
    }

    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentName || file.name.replace(/\.[^/.]+$/, ""));
      formData.append('seriesId', seriesId);
      formData.append('order', documents.length.toString());
      formData.append('type', 'series');

      const response = await fetch("/api/documents/create", {
        method: "POST",
        body: formData,
        duplex: 'half'
      } as RequestInit);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create document record');
      }

      toast({
        title: "Document uploaded successfully",
      });
      
      setDocumentName("");
      e.target.value = "";
      await fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error uploading document",
        description: error instanceof Error ? error.message : "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!documentName) {
      toast({
        title: "Please enter a document name",
        variant: "destructive",
      });
      return;
    }

    if (documentType === "link" && !documentUrl) {
      toast({
        title: "Please enter a document URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      if (documentType === "link") {
        try {
          new URL(documentUrl);
        } catch (e) {
          toast({
            title: "Invalid URL format",
            description: "Please enter a valid URL starting with http:// or https://",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch("/api/documents/series/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: documentName,
          url: documentUrl,
          seriesId,
          order: documents.length,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add document');
      }

      toast({
        title: "Document added successfully",
      });
      setDocumentName("");
      setDocumentUrl("");
      await fetchDocuments();
    } catch (error) {
      toast({
        title: "Error adding document",
        description: error instanceof Error ? error.message : "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      toast({
        title: "Document deleted successfully",
      });
      await fetchDocuments();
    } catch (error) {
      toast({
        title: "Error deleting document",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (documentId: string, direction: 'up' | 'down') => {
    const currentIndex = documents.findIndex(doc => doc.id === documentId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === documents.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newDocuments = [...documents];
    const [movedItem] = newDocuments.splice(currentIndex, 1);
    newDocuments.splice(newIndex, 0, movedItem);

    const updatedDocuments = newDocuments.map((doc, index) => ({
      ...doc,
      order: index,
    }));

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: newIndex,
        }),
      });

      if (!response.ok) throw new Error('Failed to update document order');

      setDocuments(updatedDocuments);
    } catch (error) {
      toast({
        title: "Error updating document order",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Series Documents</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="documentName">Document Name</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
            />
          </div>
          <RadioGroup
            value={documentType}
            onValueChange={setDocumentType}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="file" id="file" />
              <Label htmlFor="file">Upload File</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="link" id="link" />
              <Label htmlFor="link">Provide Link</Label>
            </div>
          </RadioGroup>

          {documentType === "file" ? (
            <>
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={isLoading}
                accept="application/pdf"
              />
              <p className="text-sm text-gray-500">Only PDF files are supported</p>
            </>
          ) : (
            <Input
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="Enter document URL"
              disabled={isLoading}
            />
          )}

          {documentType === "link" && (
            <Button onClick={handleAddDocument} disabled={isLoading}>
              Add Document
            </Button>
          )}
        </div>

        <div className="mt-6">
          <h4 className="mb-4 font-medium">Existing Documents</h4>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents added yet</p>
            ) : (
              documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {doc.name}
                      </a>
                    </div>
                    <span className="text-xs text-gray-500">
                      Added: {formatDate(doc.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(doc.id, 'up')}
                        disabled={index === 0}
                        className="h-6 px-2"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(doc.id, 'down')}
                        disabled={index === documents.length - 1}
                        className="h-6 px-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}