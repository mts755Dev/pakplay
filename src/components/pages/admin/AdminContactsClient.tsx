"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import {
  getAdminSession,
  fetchAdminContacts,
  updateAdminContactSubmission,
} from "@/lib/server-actions";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Calendar, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type ContactSubmission = Tables<'contact_submissions'>;

const statusColors = {
  new: "bg-blue-500",
  in_progress: "bg-yellow-500",
  resolved: "bg-green-500",
  archived: "bg-gray-500"
};

const statusLabels = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
  archived: "Archived"
};

export function AdminContactsClient() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ContactSubmission['status']>("new");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await getAdminSession();
      if (!session.success || !session.user) {
        if (session.error && session.error !== 'Not authenticated') {
          toast({
            title: "Access Denied",
            description: "Admin credentials required.",
            variant: "destructive",
          });
          window.location.href = "/";
          return;
        }
        window.location.href = "/admin";
        return;
      }

      setUser(session.user);
      fetchContacts();
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await fetchAdminContacts();
      if (error) throw new Error(error);
      setContacts(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load contact submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewContact = (contact: ContactSubmission) => {
    setSelectedContact(contact);
    setAdminNotes(contact.admin_notes || "");
    setSelectedStatus(contact.status);
    setDialogOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    try {
      const result = await updateAdminContactSubmission(
        selectedContact.id,
        selectedStatus,
        adminNotes
      );
      if (!result.success) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Contact submission updated successfully",
      });

      setDialogOpen(false);
      fetchContacts();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update contact submission",
        variant: "destructive",
      });
    }
  };

  const filteredContacts = filterStatus === "all" 
    ? contacts 
    : contacts.filter(c => c.status === filterStatus);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userRole="admin" />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Contact Submissions</h1>
              <p className="text-muted-foreground mt-1">
                Manage and respond to customer inquiries
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">{contacts.filter(c => c.status === 'new').length}</div>
              <div className="text-sm text-muted-foreground">New</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{contacts.filter(c => c.status === 'in_progress').length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{contacts.filter(c => c.status === 'resolved').length}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{contacts.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </Card>
          </div>

          {/* Filter */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="status">Filter by Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submissions</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No contact submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(contact.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="text-sm">{contact.email}</TableCell>
                      <TableCell>{contact.subject}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[contact.status]}>
                          {statusLabels[contact.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewContact(contact)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Submission Details</DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium mt-1">{selectedContact.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Select value={selectedStatus} onValueChange={(value: ContactSubmission['status']) => setSelectedStatus(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{selectedContact.email}</span>
              </div>

              {selectedContact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{selectedContact.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedContact.created_at)}</span>
              </div>

              <div>
                <Label>Subject</Label>
                <p className="mt-1 font-medium">{selectedContact.subject}</p>
              </div>

              <div>
                <Label>Message</Label>
                <Card className="p-4 mt-1 bg-muted/30">
                  <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                </Card>
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this submission..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateContact}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

