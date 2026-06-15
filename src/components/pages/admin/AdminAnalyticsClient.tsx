"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getAdminSession, fetchAdminAnalyticsPage } from "@/lib/server-actions";
import { TrendingUp, Building2, Users, Calendar, DollarSign, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AdminAnalyticsClientProps {
  initialData?: any;
}

export function AdminAnalyticsClient({ initialData }: AdminAnalyticsClientProps = {}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(initialData || {
    totalVenues: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    venuesBySport: [],
    venuesByCity: [],
    recentActivity: [],
    growthStats: {
      venuesThisMonth: 0,
      usersThisMonth: 0,
      bookingsThisMonth: 0,
      revenueThisMonth: 0,
    }
  });
  const [loading, setLoading] = useState(!initialData);
  const [authChecking, setAuthChecking] = useState(true);

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
      if (!initialData) {
        fetchAnalytics();
      }
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await fetchAdminAnalyticsPage();
      if (error || !data) throw new Error(error || "Failed to load analytics");
      setAnalytics(data);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Platform insights and statistics</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Overall Stats */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Venues</p>
                        <h3 className="text-3xl font-bold mt-2">{analytics.totalVenues || 0}</h3>
                        <p className="text-xs text-green-500 mt-1">+{analytics.growthStats?.venuesThisMonth || 0} this month</p>
                      </div>
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <h3 className="text-3xl font-bold mt-2">{analytics.totalUsers || 0}</h3>
                        <p className="text-xs text-green-500 mt-1">+{analytics.growthStats?.usersThisMonth || 0} this month</p>
                      </div>
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                        <h3 className="text-3xl font-bold mt-2">{analytics.totalBookings || 0}</h3>
                        <p className="text-xs text-green-500 mt-1">+{analytics.growthStats?.bookingsThisMonth || 0} this month</p>
                      </div>
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <h3 className="text-2xl font-bold mt-2">PKR {(analytics.totalRevenue || 0).toLocaleString()}</h3>
                        <p className="text-xs text-green-500 mt-1">+PKR {(analytics.growthStats?.revenueThisMonth || 0).toLocaleString()} this month</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Venues by Sport */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Venues by Sport</h2>
                <Card className="p-6">
                  {!analytics.venuesBySport || analytics.venuesBySport.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data available</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.venuesBySport.map((item: any) => (
                        <div key={item.sport} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium capitalize">{item.sport.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-64 bg-muted rounded-full h-3">
                              <div 
                                className="bg-primary h-3 rounded-full transition-all" 
                                style={{ width: `${(item.count / analytics.totalVenues) * 100}%` }}
                              />
                            </div>
                            <span className="font-bold text-lg min-w-[3rem] text-right">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Venues by City */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Venues by City</h2>
                <Card className="p-6">
                  {!analytics.venuesByCity || analytics.venuesByCity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data available</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.venuesByCity.map((item: any) => (
                        <div key={item.city} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="font-medium capitalize">{item.city}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-64 bg-muted rounded-full h-3">
                              <div 
                                className="bg-green-500 h-3 rounded-full transition-all" 
                                style={{ width: `${(item.count / analytics.totalVenues) * 100}%` }}
                              />
                            </div>
                            <span className="font-bold text-lg min-w-[3rem] text-right">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

