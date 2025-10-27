import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users as UsersIcon } from "lucide-react";
import { UsersTable } from "@/components/dashboard/users-table";

async function getUsers() {
  try {
    console.log('[getUsers] Fetching users from database...');
    
    // First, get all auth users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    console.log(`[getUsers] Found ${authUsers?.users?.length || 0} auth users`);

    if (!authUsers?.users || authUsers.users.length === 0) {
      console.log('[getUsers] No users found in authentication');
      return [];
    }

    // Get profiles for these users
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(`
        user_id,
        first_name,
        gender,
        city,
        country,
        date_of_birth,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (profileError) {
      console.error("[getUsers] Profile error:", profileError);
    }

    console.log(`[getUsers] Found ${profiles?.length || 0} profiles`);

    // Get user status from users table
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, status")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("[getUsers] Users table error:", usersError);
    }

    console.log(`[getUsers] Found ${usersData?.length || 0} users in users table`);

    // Create maps
    const profileMap = new Map(
      profiles?.map(p => [p.user_id, p]) || []
    );
    const statusMap = new Map(
      usersData?.map(u => [u.id, u.status]) || []
    );

    // Combine all data
    const combinedUsers = authUsers.users.map(authUser => {
      const profile = profileMap.get(authUser.id);
      const status = statusMap.get(authUser.id) || 'active';

      return {
        user_id: authUser.id,
        email: authUser.email || 'N/A',
        first_name: profile?.first_name || 'N/A',
        gender: profile?.gender || 'N/A',
        city: profile?.city || 'N/A',
        country: profile?.country || 'N/A',
        date_of_birth: profile?.date_of_birth || null,
        status: status,
        created_at: authUser.created_at,
        updated_at: profile?.updated_at || authUser.created_at,
      };
    });

    console.log(`[getUsers] Returning ${combinedUsers.length} combined users`);
    return combinedUsers;
  } catch (error) {
    console.error("[getUsers] Exception:", error);
    return [];
  }
}

async function getUserStats() {
  try {
    const { data: stats } = await supabaseAdmin.rpc("admin_get_dashboard_stats", {
      days_back: 30,
    });

    return {
      total: stats?.total_users || 0,
      new: stats?.new_signups || 0,
      active: stats?.active_users || 0,
    };
  } catch (error) {
    return { total: 0, new: 0, active: 0 };
  }
}

export default async function UsersPage() {
  const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-gray-500 mt-1">
          Manage user accounts, permissions, and moderation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New (30d)</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
            <p className="text-xs text-muted-foreground">Recent signups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active (30d)</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Sent messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Users Table */}
      <UsersTable users={users} />
    </div>
  );
}

