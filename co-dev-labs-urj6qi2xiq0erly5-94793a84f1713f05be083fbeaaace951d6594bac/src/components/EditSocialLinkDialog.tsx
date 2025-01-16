import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";

interface EditSocialLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  url: string;
  onSave: (platform: string, url: string) => Promise<void>;
}

export function EditSocialLinkDialog({
  open,
  onOpenChange,
  platform,
  url,
  onSave,
}: EditSocialLinkDialogProps) {
  const [linkUrl, setLinkUrl] = useState(url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!linkUrl.trim()) {
        throw new Error("URL is required");
      }

      // Basic URL validation
      try {
        new URL(linkUrl);
      } catch {
        throw new Error("Please enter a valid URL");
      }

      await onSave(platform, linkUrl);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Social link updated successfully",
      });
    } catch (error) {
      console.error('Error updating social link:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update social link";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {platform} Link</DialogTitle>
          {error && (
            <DialogDescription className="text-red-500">
              {error}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="platform">Platform</Label>
            <Input
              id="platform"
              value={platform}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={`Enter ${platform} URL`}
              required
              pattern="https?://.*"
              title="Please enter a valid URL starting with http:// or https://"
            />
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}