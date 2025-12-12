import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, CreditCard, Users, RefreshCw } from "lucide-react";
import { formatCurrency, formatRelativeTime, getStatusColor } from "@/lib/utils";

async function getPayments() {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        user_id,
        amount_cents,
        currency,
        status,
        provider,
        product,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[getPayments] Error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[getPayments] Exception:", error);
    return [];
  }
}

async function getSubscriptions() {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        user_id,
        plan,
        status,
        started_at,
        current_period_end,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[getSubscriptions] Error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[getSubscriptions] Exception:", error);
    return [];
  }
}

async function getRevenueStats(payments: any[], subscriptions: any[]) {
  const totalRevenue = payments
    .filter(p => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const revenueThisMonth = payments
    .filter(p => p.status === "succeeded" && new Date(p.created_at) >= last30Days)
    .reduce((sum, p) => sum + p.amount_cents, 0);

  return {
    total: totalRevenue,
    thisMonth: revenueThisMonth,
    transactions: payments.length,
    activeSubscriptions: subscriptions.filter(s => s.status === "active").length,
  };
}

export default async function RevenuePage() {
  const [payments, subscriptions] = await Promise.all([
    getPayments(),
    getSubscriptions(),
  ]);
  const stats = await getRevenueStats(payments, subscriptions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Analytics</h1>
        <p className="text-gray-500 mt-1">
          Track payments, subscriptions, and revenue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.thisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions}</div>
            <p className="text-xs text-muted-foreground">Total payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Paying users</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            Showing {payments.length} transactions (most recent first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No payments yet</p>
              <p className="text-sm">Payment transactions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Provider
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold">
                          {formatCurrency(payment.amount_cents, payment.currency)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{payment.product || "N/A"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm capitalize">{payment.provider}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {formatRelativeTime(payment.created_at)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refund
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>
            Showing {subscriptions.length} subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No subscriptions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Started
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Renews
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium capitalize">{sub.plan}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(sub.status)}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {formatRelativeTime(sub.started_at)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {sub.current_period_end
                            ? formatRelativeTime(sub.current_period_end)
                            : "N/A"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <div className="text-sm text-gray-500">
          <p>
            💡 <strong>Note:</strong> Payment actions (Refund) will be implemented with
            confirmation dialogs in the next update.
          </p>
        </div>
      )}
    </div>
  );
}

