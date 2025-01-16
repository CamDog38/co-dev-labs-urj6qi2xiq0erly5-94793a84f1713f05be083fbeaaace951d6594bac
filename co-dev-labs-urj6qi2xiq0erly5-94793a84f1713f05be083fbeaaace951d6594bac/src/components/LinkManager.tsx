import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TwoColumnLayout from "./TwoColumnLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import { SocialLinksManager } from "./SocialLinksManager";
import AppearanceSettings from "./AppearanceSettings";
import { BioSettings } from "./BioSettings";
import { SocialMediaGroup } from "./SocialMediaGroup";
import { GenerateLinkOptions } from "./GenerateLinkOptions";
import { Plus, Link as LinkIcon, Image, Video, Calendar, Users, Folder, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableLink } from "./SortableLink";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import PreviewFrame from "./PreviewFrame";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Link {
  id: string;
  title: string;
  url: string;
  type: string;
  createdAt: string;
  platform?: string;
}

const LINK_TYPES = [
  { id: 'link', label: 'Link', icon: <LinkIcon className="h-4 w-4" /> },
  { id: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
  { id: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
  { id: 'results', label: 'Results', icon: <Trophy className="h-4 w-4" /> },
  { id: 'social', label: 'Social Links', icon: <Users className="h-4 w-4" /> },
  { id: 'folder', label: 'Folder', icon: <Folder className="h-4 w-4" /> },
];

export { LINK_TYPES };

export default function LinkManager() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [theme, setTheme] = useState('default');
  const [origin, setOrigin] = useState('');
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const fetchLinks = async () => {
    try {
      console.log('Fetching links...');
      const response = await fetch('/api/links');
      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view your links",
            variant: "destructive",
          });
          // Optionally redirect to login page
          window.location.href = '/login';
          return;
        }
        throw new Error(data.error || data.message || 'Failed to fetch links');
      }

      console.log('Links fetched successfully:', data);
      setLinks(data);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast({
        title: "Error fetching links",
        description: error instanceof Error ? error.message : "Failed to fetch links. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const [selectedLinkType, setSelectedLinkType] = useState('link');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    
    if (!title?.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!url?.trim() && selectedLinkType !== 'calendar' && selectedLinkType !== 'results') {
      toast({
        title: "Error",
        description: "URL is required",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const linkData = {
      title: title.trim(),
      type: selectedLinkType || formData.get('type') || 'link',
      url: selectedLinkType === 'calendar' ? '/calendar' : 
          selectedLinkType === 'results' ? '/results' : url.trim(),
      platform: editingLink?.platform // Preserve the platform for social links
    };

    try {
      const endpoint = editingLink 
        ? `/api/links/${editingLink.id}`
        : '/api/links/create';
      
      const method = editingLink ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save link');
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: editingLink ? "Link updated successfully" : "Link added successfully",
      });
      setIsDialogOpen(false);
      fetchLinks();
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save link",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setLinks((items) => {
        // Find all social links
        const socialLinks = items.filter(item => item.type === 'social');
        const nonSocialLinks = items.filter(item => item.type !== 'social');

        // If we're dragging the social media group
        if (active.id === 'social-media-group') {
          const oldIndex = items.findIndex(item => item.type === 'social');
          const newIndex = items.findIndex(item => item.id === over.id);
          
          // Remove social links from their current position and insert them at the new position
          const result = [...nonSocialLinks];
          result.splice(newIndex, 0, ...socialLinks);
          return result;
        }
        
        // If we're dragging a regular link
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link);
    setSelectedLinkType(link.type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
      fetchLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      // Validate links before sending
      if (!Array.isArray(links) || links.length === 0) {
        toast({
          title: "Warning",
          description: "No links to save",
          variant: "default",
        });
        return;
      }

      // Ensure all links have required properties
      const invalidLinks = links.filter(link => !link.id);
      if (invalidLinks.length > 0) {
        toast({
          title: "Error",
          description: "Some links are invalid",
          variant: "destructive",
        });
        return;
      }

      // Show loading toast
      toast({
        title: "Saving",
        description: "Updating link order...",
      });

      const response = await fetch('/api/links/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          links: links.map((link, index) => ({ 
            id: link.id,
            order: index 
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to save link order';
        let details = '';
        
        // Handle specific error cases
        if (response.status === 401) {
          errorMessage = 'Please log in to save link order';
        } else if (response.status === 400) {
          errorMessage = data.message || 'Invalid link data';
          if (data.details) {
            details = JSON.stringify(data.details);
            console.error('Validation details:', data.details);
          }
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred while saving link order';
          if (data.error) {
            details = data.error;
            console.error('Server error details:', data.error);
          }
        }
        
        throw new Error(`${errorMessage}${details ? `: ${details}` : ''}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to save link order');
      }

      toast({
        title: "Success",
        description: data.message || "Link order saved successfully",
      });
      
      // Refresh links to ensure we have the latest order
      await fetchLinks();
    } catch (error) {
      console.error('Error saving link order:', error);
      
      toast({
        title: "Error Saving Order",
        description: error instanceof Error 
          ? error.message 
          : "There was a problem saving the link order. Please try again.",
        variant: "destructive",
      });

      // Refresh links to ensure we're in sync with server
      await fetchLinks();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          <div className="flex flex-col gap-8">
            <div className="flex-1">
              <Tabs defaultValue="links" className="space-y-6">
                <TabsList className="w-full">
                  <TabsTrigger value="links" className="flex-1">Links</TabsTrigger>
                  <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
                  <TabsTrigger value="bio" className="flex-1">Bio</TabsTrigger>
                  <TabsTrigger value="generate" className="flex-1">Generate Link</TabsTrigger>
                </TabsList>

          <TabsContent value="links">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Manage Links</h2>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" onClick={handleSaveOrder}>
                      Save Order
                    </Button>
                    <Dialog 
                      open={isDialogOpen} 
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingLink(null);
                          setSelectedLinkType('link');
                        }
                        setIsDialogOpen(open);
                      }}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="type">Link Type</Label>
                            <Select 
                              name="type" 
                              defaultValue={editingLink?.type || "link"}
                              onValueChange={(value) => setSelectedLinkType(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select link type" />
                              </SelectTrigger>
                              <SelectContent>
                                {LINK_TYPES.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    <div className="flex items-center gap-2">
                                      {type.icon}
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="title">Link Title</Label>
                            <Input 
                              id="title" 
                              name="title" 
                              defaultValue={editingLink?.title || ''}
                              required 
                            />
                          </div>
                          {selectedLinkType === 'image' ? (
                            <div className="space-y-2">
                              <Label>Image Upload</Label>
                              <ImageUpload
                                onImageSelect={(url) => {
                                  const urlInput = document.querySelector('input[name="url"]') as HTMLInputElement;
                                  if (urlInput) {
                                    urlInput.value = url;
                                  }
                                }}
                              />
                              <Input id="url" name="url" type="url" className="hidden" required />
                            </div>
                          ) : selectedLinkType === 'social' ? (
                            <div className="space-y-4">
                              <SocialLinksManager
                                onSocialLinkAdd={async (platform, url) => {
                                  try {
                                    const response = await fetch('/api/links/create', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        title: platform,
                                        url,
                                        type: 'social',
                                        platform,
                                      }),
                                    });

                                    if (!response.ok) {
                                      throw new Error('Failed to add social link');
                                    }

                                    toast({
                                      title: "Success",
                                      description: "Social link added successfully",
                                    });
                                    fetchLinks();
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to add social link",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                existingSocialLinks={links
                                  .filter(link => link.type === 'social')
                                  .map(link => ({
                                    platform: link.platform || '',
                                    url: link.url
                                  }))}
                              />
                            </div>
                          ) : selectedLinkType !== 'calendar' && selectedLinkType !== 'results' && (
                            <div className="space-y-2">
                              <Label htmlFor="url">URL</Label>
                              <Input 
                                id="url" 
                                name="url" 
                                type="url" 
                                defaultValue={editingLink?.url || ''}
                                required 
                              />
                            </div>
                          )}
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting 
                                ? (editingLink ? "Saving..." : "Adding...") 
                                : (editingLink ? "Save Changes" : "Add Link")}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {isLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center p-6">
                        <p className="text-muted-foreground">Loading links...</p>
                      </CardContent>
                    </Card>
                  ) : links.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center p-6">
                        <p className="text-muted-foreground">No links added yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={[
                          ...links
                            .filter(link => link.type !== 'social')
                            .map(link => link.id),
                          'social-media-group'
                        ]}
                        strategy={verticalListSortingStrategy}
                      >
                        {/* Regular links */}
                        {links
                          .filter(link => link.type !== 'social')
                          .map((link) => (
                            <SortableLink
                              key={link.id}
                              link={link}
                              onEdit={() => handleEdit(link)}
                              onDelete={() => handleDelete(link.id)}
                            />
                          ))}
                        
                        {/* Social Media Group */}
                        {links.some(link => link.type === 'social') && (
                          <SocialMediaGroup
                            links={links.filter(link => link.type === 'social')}
                            onEdit={(linkId) => {
                              const link = links.find(l => l.id === linkId);
                              if (link) handleEdit(link);
                            }}
                            onDelete={handleDelete}
                            onReorder={(reorderedSocialLinks) => {
                              const otherLinks = links.filter(link => link.type !== 'social');
                              const socialGroupIndex = links.findIndex(link => link.type === 'social');
                              const newLinks = [
                                ...links.slice(0, socialGroupIndex),
                                ...reorderedSocialLinks,
                                ...links.slice(socialGroupIndex + reorderedSocialLinks.length)
                              ];
                              setLinks(newLinks);
                            }}
                          />
                        )}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Appearance</h2>
              <AppearanceSettings />
            </div>
          </TabsContent>

          <TabsContent value="bio">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Bio</h2>
              <BioSettings />
            </div>
          </TabsContent>

          <TabsContent value="generate">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Generate Link</h2>
              <div className="space-y-4">
                <GenerateLinkOptions 
                  onSelect={(type) => {
                    const baseUrl = origin;
                    let link = '';
                    switch(type) {
                      case 'bio':
                        link = `${baseUrl}/${user?.username}`;
                        break;
                      case 'results':
                        link = `${baseUrl}/${user?.username}/results`;
                        break;
                      case 'calendar':
                        link = `${baseUrl}/${user?.username}/calendar`;
                        break;
                    }
                    if (link) {
                      navigator.clipboard.writeText(link);
                      toast({
                        title: "Link copied",
                        description: "The link has been copied to your clipboard",
                      });
                    }
                  }} 
                />
                <p className="text-sm text-muted-foreground mt-4">
                  Select the type of link you want to generate. The preview will automatically update when you make changes to your profile.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
        </div>
        </div>
        <div className="hidden lg:block sticky top-4">
          <h3 className="text-lg font-semibold mb-4">Mobile Preview</h3>
          <PreviewFrame links={links} bio={bio} theme={theme} />
        </div>
      </div>
    </div>
  );
}