import AdminLayout from "@/components/admin/AdminLayout";
import AnalyticsManager from "@/components/AnalyticsManager";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  Users,
  Activity,
  Calendar,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  openTickets: number;
  userGrowth: number;
  systemHealth: "healthy" | "warning" | "critical";
}

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    openTickets: 0,
    userGrowth: 0,
    systemHealth: "healthy",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
      
      // Update stats based on user data
      const activeUsers = data.filter(user => user.status === 'active').length;
      const totalEvents = data.reduce((sum, user) => sum + (user.eventsCreated || 0), 0);
      setStats(prev => ({
        ...prev,
        totalUsers: data.length,
        activeUsers: activeUsers,
        totalEvents: totalEvents,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh user list
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "admin" ? "destructive" : "default"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "success" : "destructive"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        try {
          return row.original.createdAt ? format(new Date(row.original.createdAt), 'PPp') : 'N/A';
        } catch (e) {
          return 'Invalid date';
        }
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        try {
          return row.original.lastLogin ? format(new Date(row.original.lastLogin), 'PPp') : 'Never';
        } catch (e) {
          return 'Invalid date';
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.status === "active" ? (
                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "suspended")}>
                  Block User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")}>
                  Activate User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchUsers();
      // Fetch other stats here when APIs are available
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-green-600",
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "Open Tickets",
      value: stats.openTickets,
      icon: MessageSquare,
      color: "text-yellow-600",
    },
    {
      title: "User Growth",
      value: `${stats.userGrowth}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
    {
      title: "System Health",
      value: stats.systemHealth,
      icon: AlertCircle,
      color: "text-emerald-600",
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your SailLink platform
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
              <DataTable columns={columns} data={users} />
            </div>
          </Card>
        </div>
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Integration</h2>
              <AnalyticsManager />
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}