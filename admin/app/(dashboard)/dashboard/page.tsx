import { supabaseAdmin } from "@/lib/supabase/server";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Activity,
  Heart,
  MessageSquare,
  Flag,
  DollarSign,
} from "lucide-react";
import { formatCurrency, formatRelativeTime, getStatusColor } from "@/lib/utils";

async function getDashboardStats() {
  try {
    const { data, error } = await supabaseAdmin.rpc("admin_get_dashboard_stats", {
      days_back: 30,
    });

    if (error) {
      console.error("[getDashboardStats] Error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[getDashboardStats] Error:", error);
    return null;
  }
}

async function getLatestSignups() {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, first_name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[getLatestSignups] Error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[getLatestSignups] Exception:", error);
    return [];
  }
}

async function getLatestReports() {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_reports")
      .select("id, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[getLatestReports] Error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[getLatestReports] Exception:", error);
    return [];
  }
}

async function getLatestPayments() {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("id, amount_cents, currency, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[getLatestPayments] Error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[getLatestPayments] Exception:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const [stats, latestSignups, latestReports, latestPayments] = await Promise.all([
    getDashboardStats(),
    getLatestSignups(),
    getLatestReports(),
    getLatestPayments(),
  ]);

  const kpis = stats || {
    new_signups: 0,
    active_users: 0,
    total_matches: 0,
    total_messages: 0,
    open_reports: 0,
    total_revenue_cents: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-gray-500 mt-1">
          Dashboard analytics and recent activity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="New Signups (30d)"
          value={kpis.new_signups}
          icon={Users}
          description="Users registered in last 30 days"
        />
        <KPICard
          title="Active Users (30d)"
          value={kpis.active_users}
          icon={Activity}
          description="Users who sent messages"
        />
        <KPICard
          title="Matches (30d)"
          value={kpis.total_matches}
          icon={Heart}
          description="New matches created"
        />
        <KPICard
          title="Messages (30d)"
          value={kpis.total_messages}
          icon={MessageSquare}
          description="Total messages sent"
        />
        <KPICard
          title="Open Reports"
          value={kpis.open_reports}
          icon={Flag}
          description="Reports awaiting review"
        />
        <KPICard
          title="Revenue (30d)"
          value={formatCurrency(kpis.total_revenue_cents)}
          icon={DollarSign}
          description="Total revenue"
        />
      </div>

      {/* Latest Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Latest Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Signups</CardTitle>
            <CardDescription>Most recent user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestSignups.length === 0 ? (
                <p className="text-sm text-gray-500">No recent signups</p>
              ) : (
                latestSignups.map((signup) => (
                  <div
                    key={signup.user_id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {signup.first_name || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(signup.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(signup.status)}>
                      {signup.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Reports</CardTitle>
            <CardDescription>Recent user reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestReports.length === 0 ? (
                <p className="text-sm text-gray-500">No recent reports</p>
              ) : (
                latestReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{report.reason || 'Report'}</p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(report.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Payments</CardTitle>
            <CardDescription>Recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestPayments.length === 0 ? (
                <p className="text-sm text-gray-500">No recent payments</p>
              ) : (
                latestPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(payment.amount_cents, payment.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(payment.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

