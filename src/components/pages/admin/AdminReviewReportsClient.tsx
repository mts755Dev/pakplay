"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminSession,
  fetchAdminReviewReports,
  resolveAdminReviewReport,
} from "@/lib/server-actions";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";

export function AdminReviewReportsClient() {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, filterStatus]);

  const checkUser = async () => {
    const session = await getAdminSession();

    if (!session.success || !session.user) {
      if (session.error && session.error !== 'Not authenticated') {
        toast.error("Access denied. Admins only.");
        router.push('/');
        return;
      }
      router.push('/admin');
      return;
    }

    setUser(session.user);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);

      const { data, error } = await fetchAdminReviewReports(filterStatus);
      if (error) throw new Error(error);
      setReports(data);
    } catch {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = (action: 'approved' | 'rejected') => {
    setProcessing(true);
    handleAction(selectedReport.id, action);
  };

  const handleAction = async (reportId: string, action: 'approved' | 'rejected') => {
    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) throw new Error('Report not found');

      const result = await resolveAdminReviewReport(reportId, action, report.review_id);
      if (!result.success) throw new Error(result.error);

      if (action === 'approved') {
        toast.success("Review deleted successfully");
      } else {
        toast.success("Report rejected");
      }

      fetchReports();
      setSelectedReport(null);
    } catch {
      toast.error("Failed to process report");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userRole="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Review Reports</h1>
            <div className="space-y-2">
              <Label htmlFor="status">Filter by Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status" className="w-48">
                  <SelectValue placeholder="All Reports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No reports found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{report.venue?.name}</h3>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reported by: {report.reporter?.full_name} ({report.reporter?.email})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-accent/10 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Review Details:</h4>
                    <p className="text-sm mb-1"><strong>Customer:</strong> {report.review?.customer_name}</p>
                    <p className="text-sm mb-1"><strong>Rating:</strong> {report.review?.rating}/5</p>
                    <p className="text-sm mb-2"><strong>Review:</strong> {report.review?.review_text}</p>
                    {report.review?.photo_urls && report.review.photo_urls.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">Photos:</p>
                        <div className="grid grid-cols-5 gap-2">
                          {report.review.photo_urls.map((photo: string, photoIndex: number) => (
                            <img
                              key={photoIndex}
                              src={photo}
                              alt={`Review photo ${photoIndex + 1}`}
                              className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(photo, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4 border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold mb-2 text-red-700 dark:text-red-400">Report Reason:</h4>
                    <p className="text-sm">{report.reason}</p>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setSelectedReport(report)}
                        variant="default"
                      >
                        Review Report
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose to approve (delete review) or reject (keep review) this report.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setSelectedReport(null)}
              variant="outline"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleReviewReport('rejected')}
              variant="outline"
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject Report
            </Button>
            <Button
              onClick={() => handleReviewReport('approved')}
              variant="destructive"
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Approve & Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

