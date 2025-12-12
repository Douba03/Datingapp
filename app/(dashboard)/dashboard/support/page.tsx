'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TicketIcon, 
  UserIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  first_name: string;
  email: string;
  photos: string[];
  message_count: number;
  last_message_at: string | null;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');

  useEffect(() => {
    fetchTickets();
    
    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(() => {
      fetchTickets();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/admin/support-tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      });

      if (!response.ok) throw new Error('Failed to update ticket');
      
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      open: { variant: 'default', label: 'Open' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      resolved: { variant: 'outline', label: 'Resolved' },
      closed: { variant: 'outline', label: 'Closed' },
    };

    const config = variants[status] || variants.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[priority] || colors.normal}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      technical: '🐛',
      account: '👤',
      billing: '💳',
      safety: '🛡️',
      feedback: '💬',
      other: '❓',
    };

    return icons[category] || icons.other;
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-gray-600 mt-2">Manage user support requests and tickets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ClockIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>View and manage all support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({stats.in_progress})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tickets found</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {ticket.photos && ticket.photos.length > 0 ? (
                                <img
                                  src={ticket.photos[0]}
                                  alt={ticket.first_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserIcon className="h-4 w-4 text-gray-600" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{ticket.first_name}</div>
                                <div className="text-sm text-gray-600">{ticket.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium truncate">{ticket.subject}</div>
                              <div className="text-sm text-gray-600 truncate">{ticket.message}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span>{getCategoryIcon(ticket.category)}</span>
                              <span className="capitalize">{ticket.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(ticket.created_at).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {ticket.status === 'open' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                >
                                  Start
                                </Button>
                              )}
                              {ticket.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                >
                                  Resolve
                                </Button>
                              )}
                              {ticket.status === 'resolved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTicketStatus(ticket.id, 'closed')}
                                >
                                  Close
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

