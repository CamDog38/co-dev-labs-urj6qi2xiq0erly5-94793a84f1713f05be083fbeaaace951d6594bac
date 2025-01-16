import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { useAppearance } from './AppearanceProvider';
import { ImageUpload } from './ImageUpload';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export function BioSettings() {
  const { settings, updateSettings } = useAppearance();
  const { user } = useAuth();
  const [bio, setBio] = useState(settings.bio || '');
  const [username, setUsername] = useState(user?.username || '');
  const [profileImage, setProfileImage] = useState(settings.profileImage || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setBio(settings.bio || '');
    setProfileImage(settings.profileImage || '');
  }, [settings.bio, settings.profileImage]);

  // Debounced save effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (bio !== settings.bio) {
        handleSave(bio, profileImage);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [bio]);

  const handleImageUpload = async (imageUrl: string) => {
    setProfileImage(imageUrl);
    // Update settings immediately for preview
    updateSettings({ ...settings, profileImage: imageUrl });
    // Save to backend
    await handleSave(bio, imageUrl);
  };

  const handleSave = async (bioText = bio, image = profileImage) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: bioText, profileImage: image }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bio');
      }

      const data = await response.json();
      updateSettings({ ...settings, bio: data.bio, profileImage: data.profileImage });
      
      toast({
        title: 'Success',
        description: 'Profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBio = e.target.value;
    setBio(newBio);
    // Update settings immediately for preview
    updateSettings({ ...settings, bio: newBio });
  };

  const handleBioBlur = () => {
    if (bio !== settings.bio) {
      handleSave();
    }
  };

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    setUsername(newUsername);
  };

  const handleUsernameSave = async () => {
    if (!username) {
      toast({
        title: 'Error',
        description: 'Username cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update username');
      }

      toast({
        title: 'Success',
        description: 'Username has been updated successfully.',
      });

      // Fetch updated user data to refresh the context
      const userResponse = await fetch('/api/user');
      const userData = await userResponse.json();
      
      if (user) {
        Object.assign(user, { username: userData.username });
      }

      // Reload the page to ensure all components are updated
      window.location.reload();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update username. It might be already taken.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardContent className="space-y-6 p-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <div className="flex gap-2">
              <Input
                placeholder="Choose your username"
                value={username}
                onChange={handleUsernameChange}
                className="flex-1"
              />
              <Button 
                onClick={handleUsernameSave}
                disabled={isSaving || !username}
              >
                Save Username
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your public profile will be available at: {username ? `${window.location.origin}/${username}` : 'Choose a username'}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Profile Picture
            </label>
            <div className="flex justify-start">
              <ImageUpload
                value={profileImage}
                onChange={handleImageUpload}
                className="w-48"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              About You
            </label>
            <Textarea
              id="bio"
              placeholder="Tell your visitors about yourself..."
              value={bio}
              onChange={handleBioChange}
              onBlur={handleBioBlur}
              className="min-h-[200px]"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={() => handleSave()} 
            className="w-full sm:w-auto"
            disabled={isSaving}
            variant="default"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}