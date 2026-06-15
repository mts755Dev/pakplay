"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getAdminSession, fetchAdminNotifications } from "@/lib/server-actions";
import { Bell, Loader2, UserPlus, Building2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'user_signup' | 'venue_request';
  title: string;
  message: string;
  created_at: string;
  data?: any;
}

export function AdminNotificationsClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

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
      fetchNotifications();
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await fetchAdminNotifications();
      if (error) throw new Error(error);
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const past = new Date(dateString).getTime();
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'venue_request':
        return <Building2 className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

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
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">New user signups and venue approval requests</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New User Signups</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {notifications.filter(n => n.type === 'user_signup').length}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </div>
                <UserPlus className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Venues</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {notifications.filter(n => n.type === 'venue_request').length}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                </div>
                <Building2 className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>
          </div>

          {/* Notifications List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <Badge variant="secondary">{notifications.length} notifications</Badge>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! No new activity in the last 7 days.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

