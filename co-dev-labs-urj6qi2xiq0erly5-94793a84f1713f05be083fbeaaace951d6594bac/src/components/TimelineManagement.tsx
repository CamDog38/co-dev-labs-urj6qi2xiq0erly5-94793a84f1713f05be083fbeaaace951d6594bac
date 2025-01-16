import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimelineSettings {
  isActive: boolean;
  requireApproval: boolean;
  allowPublicViewing: boolean;
  allowParticipantPosting: boolean;
}

interface User {
  id: string;
  username: string;
  role: 'skipper' | 'viewer';
}

interface Post {
  id: string;
  content: string;
  author: {
    username: string;
    role: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function TimelineManagement({ eventId }: { eventId: string }) {
  const [settings, setSettings] = useState<TimelineSettings>({
    isActive: false,
    requireApproval: true,
    allowPublicViewing: false,
    allowParticipantPosting: true,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [timelineUrl, setTimelineUrl] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'skipper' | 'viewer'>('viewer');
  const [eventSlug, setEventSlug] = useState<string>('');
  const [isUrlCopied, setIsUrlCopied] = useState(false);

  // Fetch event details and set the timeline URL when component mounts
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        console.log('No eventId provided');
        setTimelineUrl('');
        return;
      }
      
      try {
        const baseUrl = window.location.origin;
        
        // Fetch event details including the slug
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          // Set fallback URL using eventId
          setTimelineUrl(`${baseUrl}/race/${eventId}`);
          return;
        }
        
        const data = await response.json();
        console.log('Event data received:', data);
        
        // If we have a slug, use it; otherwise fall back to the ID
        if (data && data.slug) {
          setEventSlug(data.slug);
          setTimelineUrl(`${baseUrl}/race/${data.slug}`);
        } else {
          // Generate a slug from the name if available
          if (data && data.name) {
            const generatedSlug = data.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
            
            // Update the event with the generated slug
            const updateResponse = await fetch(`/api/events/${eventId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ slug: generatedSlug }),
            });
            
            if (updateResponse.ok) {
              setEventSlug(generatedSlug);
              setTimelineUrl(`${baseUrl}/race/${generatedSlug}`);
            } else {
              // Fall back to ID if slug update fails
              setTimelineUrl(`${baseUrl}/race/${eventId}`);
            }
          } else {
            // Fall back to ID if no name is available
            setTimelineUrl(`${baseUrl}/p/${eventId}`);
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        // Keep the fallback URL (using eventId) if there's an error
        const baseUrl = window.location.origin;
        setTimelineUrl(`${baseUrl}/race/${eventId}`);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    fetchTimelineData();
  }, [eventId]);

  const fetchTimelineData = async () => {
    try {
      const response = await fetch(`/api/timeline/${eventId}/settings`);
      const data = await response.json();
      if (data) {
        setSettings({
          isActive: data.isActive ?? false,
          requireApproval: data.requireApproval ?? true,
          allowPublicViewing: data.allowPublicViewing ?? false,
          allowParticipantPosting: data.allowParticipantPosting ?? true,
        });
      }
      // Fetch users and posts in separate requests if needed
      // For now, we'll focus on settings
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    }
  };

  const handleSettingChange = async (setting: keyof TimelineSettings) => {
    const newSettings = { ...settings, [setting]: !settings[setting] };
    try {
      await fetch(`/api/timeline/${eventId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/timeline/${eventId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, role: newUserRole }),
      });
      const newUser = await response.json();
      setUsers([...users, newUser]);
      setNewUserEmail('');
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await fetch(`/api/timeline/${eventId}/users/${userId}`, {
        method: 'DELETE',
      });
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handlePostModeration = async (postId: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/timeline/${eventId}/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setPendingPosts(pendingPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error moderating post:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="moderation">Post Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Timeline Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Timeline Active</Label>
                <Switch
                  id="isActive"
                  checked={settings.isActive}
                  onCheckedChange={() => handleSettingChange('isActive')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireApproval">Require Post Approval</Label>
                <Switch
                  id="requireApproval"
                  checked={settings.requireApproval}
                  onCheckedChange={() => handleSettingChange('requireApproval')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowPublicViewing">Allow Public Viewing</Label>
                <Switch
                  id="allowPublicViewing"
                  checked={settings.allowPublicViewing}
                  onCheckedChange={() => handleSettingChange('allowPublicViewing')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowParticipantPosting">Allow Participant Posting</Label>
                <Switch
                  id="allowParticipantPosting"
                  checked={settings.allowParticipantPosting}
                  onCheckedChange={() => handleSettingChange('allowParticipantPosting')}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Timeline Link</h3>
            <div className="flex items-center space-x-2">
              <Input 
                value={timelineUrl || 'No timeline URL available'} 
                readOnly 
                className="bg-muted flex-1"
                placeholder="Timeline URL will appear here"
              />
              <Button
                onClick={async () => {
                  if (timelineUrl) {
                    await navigator.clipboard.writeText(timelineUrl);
                    setIsUrlCopied(true);
                    setTimeout(() => setIsUrlCopied(false), 2000);
                  }
                }}
                variant="outline"
                disabled={!timelineUrl}
              >
                {isUrlCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
            {!timelineUrl && (
              <p className="text-sm text-muted-foreground mt-2">
                Unable to generate timeline link. Please ensure the event exists and has a valid slug.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Manage Access</h3>
            <form onSubmit={handleAddUser} className="flex items-end space-x-2 mb-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value) => setNewUserRole(value as 'skipper' | 'viewer')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="skipper">Skipper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Add User</Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'skipper' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Pending Posts</h3>
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{post.author.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge>{post.author.role}</Badge>
                  </div>
                  <p className="mb-4">{post.content}</p>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePostModeration(post.id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePostModeration(post.id, 'reject')}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
              {pendingPosts.length === 0 && (
                <p className="text-center text-muted-foreground">No pending posts</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}