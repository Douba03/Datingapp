import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatRelativeTime, getStatusColor } from "@/lib/utils";
import { ReportActions } from "@/components/reports/ReportActions";

async function getReports() {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_reports")
      .select(`
        id,
        reporter_user_id,
        reported_user_id,
        reason,
        details,
        status,
        created_at,
        closed_at,
        resolution
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[getReports] Error:", error);
      return [];
    }

    // Get user names
    const userIds = [
      ...new Set([
        ...(data?.map(r => r.reporter_user_id) || []),
        ...(data?.map(r => r.reported_user_id) || []),
      ]),
    ];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, first_name")
      .in("user_id", userIds);

    const nameMap = new Map(
      profiles?.map(p => [p.user_id, p.first_name || "Anonymous"]) || []
    );

    return data?.map(report => ({
      ...report,
      reporter_name: nameMap.get(report.reporter_user_id) || "Unknown",
      reported_name: nameMap.get(report.reported_user_id) || "Unknown",
    })) || [];
  } catch (error) {
    console.error("[getReports] Exception:", error);
    return [];
  }
}

async function getReportStats(reports: any[]) {
  return {
    total: reports.length,
    open: reports.filter(r => r.status === "open").length,
    closed: reports.filter(r => r.status === "closed").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };
}

export default async function ReportsPage() {
  const reports = await getReports();
  const stats = await getReportStats(reports);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trust & Safety Reports</h1>
        <p className="text-gray-500 mt-1">
          Review and manage user reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Action taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">No action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            Showing {reports.length} reports (most recent first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No reports yet</p>
                <p className="text-sm">User reports will appear here</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(report.created_at)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{report.reason}</h3>
                      {report.details && (
                        <p className="text-sm text-gray-600 mb-3">{report.details}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Reporter:</span>{" "}
                          <span className="font-medium">{report.reporter_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reported:</span>{" "}
                          <span className="font-medium">{report.reported_name}</span>
                        </div>
                      </div>
                      {report.resolution && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm font-medium text-green-800 mb-1">
                            Resolution:
                          </p>
                          <p className="text-sm text-green-700">{report.resolution}</p>
                          {report.closed_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Closed {formatRelativeTime(report.closed_at)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {report.status === "open" && (
                      <div className="ml-4">
                        <ReportActions
                          reportId={report.id}
                          reportedName={report.reported_name}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

