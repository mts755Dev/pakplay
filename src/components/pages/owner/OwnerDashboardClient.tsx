"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Building2, Calendar, DollarSign, Plus, Eye } from "lucide-react";
import Link from "next/link";

interface OwnerDashboardClientProps {
  initialVenues: any[];
  initialStats: {
    totalVenues: number;
    approvedVenues: number;
    pendingVenues: number;
    totalBookings: number;
  };
}

export function OwnerDashboardClient({ initialVenues, initialStats }: OwnerDashboardClientProps) {
  // Use initial data from server - no loading states needed!
  const [venues] = useState(initialVenues);
  const [stats] = useState(initialStats);

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-500',
      approved: 'bg-green-500/10 text-green-500',
      rejected: 'bg-red-500/10 text-red-500',
      inactive: 'bg-gray-500/10 text-gray-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />
      
      <div className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 md:p-8 pt-20 lg:pt-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
            </div>
            <Link href="/owner/list-venue" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Add New Venue
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Venues</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalVenues}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-green-500">{stats.approvedVenues}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Approval</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-yellow-500">{stats.pendingVenues}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Bookings</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalBookings}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          {/* Venues List */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Your Venues</h2>
            </div>

            {venues.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No venues yet</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Start by adding your first venue
                </p>
                <Link href="/owner/list-venue">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Venue
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {venues.map((venue) => (
                  <div key={venue.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      {/* Image */}
                      <div className="w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {venue.venue_photos?.[0]?.photo_url ? (
                          <img 
                            src={venue.venue_photos[0].photo_url} 
                            alt={venue.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{venue.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                              {venue.city} • {venue.sport_type}
                            </p>
                          </div>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusBadge(venue.status)}`}>
                            {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm">PKR {venue.price_per_hour}/hr</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm">{venue.total_bookings || 0} bookings</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3 sm:mt-4">
                          {venue.status === 'approved' && (
                            <Link href={`/venue/${venue.slug}`} target="_blank" className="w-full sm:w-auto">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                View Page
                              </Button>
                            </Link>
                          )}
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

