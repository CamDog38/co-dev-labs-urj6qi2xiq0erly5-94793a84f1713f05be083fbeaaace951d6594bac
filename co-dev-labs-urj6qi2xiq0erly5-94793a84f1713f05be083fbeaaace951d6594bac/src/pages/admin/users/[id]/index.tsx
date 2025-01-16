import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface UserDetails {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  signupDate: string;
  lastLogin: string;
  eventsCreated: number;
}

export default function UserDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/admin/users/${id}`);
        if (!response.ok) throw new Error('Failed to fetch user details');
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div>User not found</div>
      </AdminLayout>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'N/A';
    }
  };

  const toggleStatus = async () => {
    if (!user || updating) return;
    
    setUpdating(true);
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      const response = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const updatedUser = await response.json();
      
      // Update the user state with the new data
      setUser(prevUser => ({
        ...prevUser!,
        status: updatedUser.status
      }));
      
      toast({
        title: "Success",
        description: `User status has been changed to ${newStatus}`,
      });

      // Refresh the user data from the server
      const refreshResponse = await fetch(`/api/admin/users/${id}`);
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setUser(refreshedData);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/users')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Details</CardTitle>
            <Button
              onClick={toggleStatus}
              disabled={updating}
              variant={user.status === 'active' ? 'destructive' : 'default'}
            >
              {updating ? 'Updating...' : user.status === 'active' ? 'Block User' : 'Activate User'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1">{user.name || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <div className="mt-1">
                  <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'moderator' ? 'warning' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Signup Date</h3>
                <p className="mt-1">{formatDate(user.signupDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
                <p className="mt-1">{formatDate(user.lastLogin)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Events Created</h3>
                <p className="mt-1">{user.eventsCreated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}