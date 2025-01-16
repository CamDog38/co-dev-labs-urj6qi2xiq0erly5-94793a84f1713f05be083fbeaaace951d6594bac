import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash, Upload, Link as LinkIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Result {
  id?: string;
  dateRange: string;
  documentUrl: string;
  documentName: string;
  boatClass: string;
}

interface ManageEventResultsDialogProps {
  eventId: string;
  existingResults?: Result[];
  onResultsUpdate?: (results: Result[]) => void;
}

export function ManageEventResultsDialog({
  eventId,
  existingResults = [],
  onResultsUpdate,
}: ManageEventResultsDialogProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [uploadType, setUploadType] = useState<{ [key: number]: "link" | "file" }>({});

  // Load initial results when dialog opens
  useEffect(() => {
    const loadResults = async () => {
      if (open && !initialLoadDone) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/events/${eventId}/results`);
          if (response.ok) {
            const data = await response.json();
            setResults(data || []);
            // Initialize upload types for existing results
            const types: { [key: number]: "link" | "file" } = {};
            data.forEach((result: Result, index: number) => {
              types[index] = result.documentUrl.startsWith("http") ? "link" : "file";
            });
            setUploadType(types);
          }
        } catch (error) {
          console.error("Error loading results:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
          setInitialLoadDone(true);
        }
      }
    };

    if (open) {
      loadResults();
    }
  }, [open, eventId, initialLoadDone]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInitialLoadDone(false);
      setResults([]);
      setUploadType({});
    }
  }, [open]);

  const handleAddResult = () => {
    const newIndex = results.length;
    setResults([
      ...results,
      { dateRange: "", documentUrl: "", documentName: "", boatClass: "" },
    ]);
    setUploadType({ ...uploadType, [newIndex]: "link" });
  };

  const handleRemoveResult = (index: number) => {
    const newResults = results.filter((_, i) => i !== index);
    const newUploadType = { ...uploadType };
    delete newUploadType[index];
    // Reindex the remaining upload types
    Object.keys(newUploadType).forEach((key) => {
      const numKey = parseInt(key);
      if (numKey > index) {
        newUploadType[numKey - 1] = newUploadType[numKey];
        delete newUploadType[numKey];
      }
    });
    setResults(newResults);
    setUploadType(newUploadType);
  };

  const handleResultChange = (
    index: number,
    field: keyof Result,
    value: string
  ) => {
    const newResults = [...results];
    newResults[index] = {
      ...newResults[index],
      [field]: value,
    };
    setResults(newResults);
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are supported",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', results[index].documentName || file.name.replace(/\.[^/.]+$/, ""));
      formData.append('eventId', eventId);
      formData.append('type', 'result');
      formData.append('order', index.toString());

      const response = await fetch('/api/documents/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update the results state with the new file information
      const newResults = [...results];
      newResults[index] = {
        ...newResults[index],
        documentUrl: data.url,
        documentName: data.name,
      };
      setResults(newResults);
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        throw new Error("Failed to save results");
      }

      const updatedResults = await response.json();
      if (onResultsUpdate) {
        onResultsUpdate(updatedResults);
      }
      setOpen(false);
      
      toast({
        title: "Success",
        description: "Results saved successfully",
      });
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: "Failed to save results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Manage Results
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Event Results</DialogTitle>
          <DialogDescription>
            Add, edit, or remove event results and their associated documents.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-4">Loading results...</div>
          ) : (
            <>
              {results.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No results added yet. Click "Add Result" to get started.
                </div>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="space-y-4 border rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Input
                          placeholder="e.g. 2022-2023"
                          value={result.dateRange}
                          onChange={(e) =>
                            handleResultChange(index, "dateRange", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Document Name</Label>
                        <Input
                          placeholder="Results PDF"
                          value={result.documentName}
                          onChange={(e) =>
                            handleResultChange(index, "documentName", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Boat Class</Label>
                        <Select
                          value={result.boatClass}
                          onValueChange={(value) =>
                            handleResultChange(index, "boatClass", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="laser">Laser</SelectItem>
                            <SelectItem value="optimist">Optimist</SelectItem>
                            <SelectItem value="420">420</SelectItem>
                            <SelectItem value="49er">49er</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <RadioGroup
                        className="flex items-center space-x-4"
                        value={uploadType[index]}
                        onValueChange={(value: "link" | "file") => {
                          setUploadType({ ...uploadType, [index]: value });
                          // Reset the document URL when switching types
                          handleResultChange(index, "documentUrl", "");
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="link" id={`link-${index}`} />
                          <Label htmlFor={`link-${index}`} className="flex items-center">
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Provide Link
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="file" id={`file-${index}`} />
                          <Label htmlFor={`file-${index}`} className="flex items-center">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload File
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      {uploadType[index] === "link" ? (
                        <div>
                          <Label>Document URL</Label>
                          <Input
                            placeholder="https://..."
                            value={result.documentUrl}
                            onChange={(e) =>
                              handleResultChange(index, "documentUrl", e.target.value)
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <Label>Upload PDF</Label>
                          {result.documentUrl ? (
                            <div className="flex items-center space-x-2 mb-2 p-2 bg-slate-50 rounded">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="text-sm flex-1 truncate">{result.documentName || 'Uploaded PDF'}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  handleResultChange(index, "documentUrl", "");
                                  handleResultChange(index, "documentName", "");
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(index, file);
                                }
                              }}
                            />
                          )}
                          <p className="text-sm text-gray-500 mt-1">Only PDF files are supported</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveResult(index)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleAddResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Result
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSave} 
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}