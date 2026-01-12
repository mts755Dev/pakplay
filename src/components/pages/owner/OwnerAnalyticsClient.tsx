"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { TrendingUp, Building2, Calendar, DollarSign, Users } from "lucide-react";

interface OwnerAnalyticsClientProps {
  initialData: {
    venues: any[];
    totalBookings: number;
    totalRevenue: number;
    recentBookings: any[];
  };
}

export function OwnerAnalyticsClient({ initialData }: OwnerAnalyticsClientProps) {
  // Calculate analytics from initial data
  const totalVenues = initialData.venues.length;
  const approvedVenues = initialData.venues.filter(v => v.status === 'approved').length;
  const pendingVenues = initialData.venues.filter(v => v.status === 'pending').length;
  
  // Map venues to include bookings and revenue for display
  const venueStats = initialData.venues.map(venue => ({
    id: venue.id,
    name: venue.name,
    city: venue.city,
    sport: venue.sport_type,
    bookings: venue.total_bookings || 0,
    revenue: 0 // Revenue calculation would need booking prices
  }));
  
  const [analytics] = useState({
    totalVenues,
    approvedVenues,
    pendingVenues,
    totalBookings: initialData.totalBookings,
    totalRevenue: initialData.totalRevenue,
    venueStats: venueStats,
    recentBookings: initialData.recentBookings.length,
  });

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Performance insights for your venues</p>
          </div>

          {/* Overview Stats */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Venues</p>
                        <h3 className="text-3xl font-bold mt-2">{analytics.totalVenues}</h3>
                        <p className="text-xs text-green-500 mt-1">{analytics.approvedVenues} approved</p>
                      </div>
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                        <h3 className="text-3xl font-bold mt-2">{analytics.totalBookings}</h3>
                        <p className="text-xs text-green-500 mt-1">+{analytics.recentBookings} this month</p>
                      </div>
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <h3 className="text-2xl font-bold mt-2">PKR {analytics.totalRevenue.toLocaleString()}</h3>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg per Venue</p>
                        <h3 className="text-2xl font-bold mt-2">
                          PKR {analytics.totalVenues > 0 
                            ? Math.round(analytics.totalRevenue / analytics.totalVenues).toLocaleString() 
                            : 0}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Revenue</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Venue Performance */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Venue Performance</h2>
                <Card className="p-6">
                  {analytics.venueStats.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No venues added yet</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.venueStats.map((venue: any) => (
                        <div key={venue.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-bold">{venue.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {venue.city} • {venue.sport ? venue.sport.replace('-', ' ') : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Bookings</p>
                              <p className="text-2xl font-bold">{venue.bookings}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Revenue</p>
                              <p className="text-2xl font-bold text-primary">
                                PKR {venue.revenue.toLocaleString()}
                              </p>
                            </div>
                            <div className="w-32 bg-muted rounded-full h-3">
                              <div 
                                className="bg-primary h-3 rounded-full transition-all" 
                                style={{ 
                                  width: `${analytics.totalRevenue > 0 
                                    ? (venue.revenue / analytics.totalRevenue) * 100 
                                    : 0}%` 
                                }}
                              />
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
    </div>
  );
}

