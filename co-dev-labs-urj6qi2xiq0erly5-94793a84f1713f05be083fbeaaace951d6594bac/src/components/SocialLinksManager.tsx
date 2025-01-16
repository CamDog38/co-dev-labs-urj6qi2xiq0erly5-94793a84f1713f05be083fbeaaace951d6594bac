import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EditSocialLinkDialog } from "./EditSocialLinkDialog";
import { Card, CardContent } from "./ui/card";
import { toast } from "./ui/use-toast";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface SocialLinksManagerProps {
  onSocialLinkAdd: (platform: string, url: string) => Promise<void>;
  existingSocialLinks: SocialLink[];
}

const SOCIAL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'github', label: 'GitHub' },
];

export function SocialLinksManager({ onSocialLinkAdd, existingSocialLinks }: SocialLinksManagerProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
  };

  const handleAddSocialLink = async () => {
    if (!selectedPlatform || !url) return;

    setIsSubmitting(true);
    try {
      await onSocialLinkAdd(selectedPlatform, url);
      setSelectedPlatform(null);
      setUrl("");
      toast({
        title: "Success",
        description: "Social link added successfully",
      });
    } catch (error) {
      console.error('Error adding social link:', error);
      toast({
        title: "Error",
        description: "Failed to add social link",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSocialLink = async (platform: string, newUrl: string) => {
    try {
      const existingLink = existingSocialLinks.find(link => link.platform === platform);
      if (!existingLink) throw new Error('Link not found');

      const response = await fetch(`/api/links/${existingLink.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: platform,
          url: newUrl,
          platform: platform,
          type: 'social'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update link');
      }

      const updatedLink = await response.json();
      if (!updatedLink) {
        throw new Error('No data received after update');
      }

      // Refresh the page to get updated links
      window.location.reload();
      setEditingLink(null);
    } catch (error) {
      console.error('Error updating social link:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              Add Social Link
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {SOCIAL_PLATFORMS.map((platform) => (
              <DropdownMenuItem
                key={platform.id}
                onClick={() => handlePlatformSelect(platform.id)}
                disabled={existingSocialLinks.some(link => link.platform === platform.id)}
              >
                {platform.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedPlatform && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={`Enter ${selectedPlatform} URL`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
          />
          <Button 
            onClick={handleAddSocialLink} 
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {existingSocialLinks.map((link) => {
          const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
          if (!platform) return null;
          
          return (
            <Card key={link.platform} className="relative">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{platform.label}</div>
                  <div className="text-sm text-muted-foreground truncate">{link.url}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingLink(link)}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingLink && (
        <EditSocialLinkDialog
          open={true}
          onOpenChange={() => setEditingLink(null)}
          platform={editingLink.platform}
          url={editingLink.url}
          onSave={handleEditSocialLink}
        />
      )}
    </div>
  );
}