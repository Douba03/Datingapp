"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail } from "lucide-react";
import { formatRelativeTime, getStatusColor } from "@/lib/utils";
import { UserActions } from "./user-actions";

interface User {
  user_id: string;
  first_name: string | null;
  email: string;
  gender: string | null;
  city: string | null;
  country: string | null;
  status: string | null;
  created_at: string;
}

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const name = (user.first_name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const city = (user.city || "").toLowerCase();
      const country = (user.country || "").toLowerCase();
      const gender = (user.gender || "").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        city.includes(query) ||
        country.includes(query) ||
        gender.includes(query)
      );
    });
  }, [users, searchQuery]);

  return (
    <>
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users by name, email, or location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or location..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} matching "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery ? "Search Results" : "All Users"}
          </CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} (most recent first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                    User
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                    Joined
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {searchQuery ? `No users found matching "${searchQuery}"` : "No users found"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">
                            {user.first_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-500">{user.gender}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">
                          {user.city && user.country
                            ? `${user.city}, ${user.country}`
                            : user.country || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(user.status || "active")}>
                          {user.status || "active"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {formatRelativeTime(user.created_at)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <UserActions
                          userId={user.user_id}
                          userName={user.first_name || user.email}
                          onSuccess={() => router.refresh()}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

