"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getAdminSession, fetchAdminUsersWithVenueCounts } from "@/lib/server-actions";
import { Users as UsersIcon, Search, Loader2, Phone, Building2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AdminUsersClientProps {
  initialUsers?: any[];
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps = {}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>(initialUsers || []);
  const [filteredUsers, setFilteredUsers] = useState<any[]>(initialUsers || []);
  const [loading, setLoading] = useState(!initialUsers);
  const [authChecking, setAuthChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const checkUser = async () => {
    try {
      const session = await getAdminSession();
      if (!session.success || !session.user) {
        if (session.error && session.error !== 'Not authenticated') {
          toast.error("Access denied. Admin only.");
          router.push('/');
          return;
        }
        router.push('/admin');
        return;
      }

      setUser(session.user);
      if (!initialUsers) {
        fetchUsers();
      }
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await fetchAdminUsersWithVenueCounts();
      if (error) throw new Error(error);
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    // Filter out admin users first
    let filtered = users.filter(u => u.role !== 'admin');

    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-500 text-white' 
      : 'bg-blue-500 text-white';
  };

  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage all users on the platform</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <h3 className="text-3xl font-bold mt-2">{nonAdminUsers.length}</h3>
                </div>
                <UsersIcon className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Venue Owners</p>
                  <h3 className="text-3xl font-bold mt-2 text-green-500">
                    {nonAdminUsers.filter(u => u.venue_count > 0).length}
                  </h3>
                </div>
                <Building2 className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </Card>

          {/* Users List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">All Users ({filteredUsers.length})</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {users.length === 0 ? "No users registered yet" : "Try adjusting your search"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((userData) => (
                  <Card key={userData.id} className="p-4 border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <UsersIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{userData.full_name || 'No Name'}</h3>
                            <Badge className={getRoleBadge(userData.role)}>
                              {userData.role === 'admin' ? 'Admin' : 'Owner'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{userData.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>{userData.venue_count} venues ({userData.approved_venues} approved)</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {new Date(userData.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

