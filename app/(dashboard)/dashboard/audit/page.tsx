import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Download, Filter, Shield } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

async function getAuditLogs() {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_actions")
      .select(`
        id,
        admin_id,
        action,
        target_type,
        target_id,
        payload,
        ip_address,
        user_agent,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[getAuditLogs] Error:", error);
      return [];
    }

    // Get admin names
    const adminIds = [...new Set(data?.map(log => log.admin_id) || [])];
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const emailMap = new Map(
      authUsers?.users.map(u => [u.id, u.email]) || []
    );

    return data?.map(log => ({
      ...log,
      admin_email: emailMap.get(log.admin_id) || "Unknown",
    })) || [];
  } catch (error) {
    console.error("[getAuditLogs] Exception:", error);
    return [];
  }
}

async function getAuditStats(logs: any[]) {
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);

  const last7d = new Date();
  last7d.setDate(last7d.getDate() - 7);

  return {
    total: logs.length,
    today: logs.filter(l => new Date(l.created_at) >= last24h).length,
    thisWeek: logs.filter(l => new Date(l.created_at) >= last7d).length,
    uniqueAdmins: new Set(logs.map(l => l.admin_id)).size,
  };
}

function getActionColor(action: string) {
  if (action.includes("ban") || action.includes("delete")) {
    return "bg-red-100 text-red-800 hover:bg-red-100";
  }
  if (action.includes("warn") || action.includes("reject")) {
    return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
  }
  if (action.includes("approve") || action.includes("create")) {
    return "bg-green-100 text-green-800 hover:bg-green-100";
  }
  return "bg-blue-100 text-blue-800 hover:bg-blue-100";
}

export default async function AuditLogPage() {
  const logs = await getAuditLogs();
  const stats = await getAuditStats(logs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-gray-500 mt-1">
            Track all admin actions and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <FileCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueAdmins}</div>
            <p className="text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {logs.length} actions (most recent first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No audit logs yet</p>
              <p className="text-sm">Admin actions will be logged here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(log.created_at)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-gray-500">Admin:</span>{" "}
                          <span className="font-medium">{log.admin_email}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Target:</span>{" "}
                          <span className="font-medium">
                            {log.target_type} ({log.target_id.substring(0, 8)}...)
                          </span>
                        </p>
                        {log.ip_address && (
                          <p>
                            <span className="text-gray-500">IP:</span>{" "}
                            <span className="font-mono text-xs">{log.ip_address}</span>
                          </p>
                        )}
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                              View payload
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">About Audit Logs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-purple-800">
          <ul className="list-disc list-inside space-y-1">
            <li>All admin actions are automatically logged</li>
            <li>Logs include timestamp, admin, action, and target</li>
            <li>IP addresses and user agents are recorded for security</li>
            <li>Logs are immutable and cannot be deleted</li>
            <li>Export functionality coming soon</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

