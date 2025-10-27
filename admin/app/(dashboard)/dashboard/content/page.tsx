import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, Clock, Image as ImageIcon } from "lucide-react";
import { formatRelativeTime, getStatusColor } from "@/lib/utils";
import { ContentActions } from "@/components/content/ContentActions";

async function getContentAssets() {
  try {
    const { data, error } = await supabaseAdmin
      .from("content_assets")
      .select(`
        id,
        user_id,
        type,
        url,
        status,
        reason,
        uploaded_at,
        reviewed_at,
        reviewed_by,
        review_note
      `)
      .order("uploaded_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[getContentAssets] Error:", error);
      return [];
    }

    // Get user names
    const userIds = data?.map(a => a.user_id) || [];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, first_name")
      .in("user_id", userIds);

    const nameMap = new Map(
      profiles?.map(p => [p.user_id, p.first_name || "Anonymous"]) || []
    );

    return data?.map(asset => ({
      ...asset,
      user_name: nameMap.get(asset.user_id) || "Unknown",
    })) || [];
  } catch (error) {
    console.error("[getContentAssets] Exception:", error);
    return [];
  }
}

async function getContentStats(assets: any[]) {
  return {
    total: assets.length,
    pending: assets.filter(a => a.status === "pending").length,
    approved: assets.filter(a => a.status === "approved").length,
    rejected: assets.filter(a => a.status === "rejected").length,
  };
}

export default async function ContentPage() {
  const assets = await getContentAssets();
  const stats = await getContentStats(assets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-gray-500 mt-1">
          Review and moderate user-uploaded content
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All uploads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Passed review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Violations found</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Content Queue</CardTitle>
          <CardDescription>
            Showing {assets.length} items (most recent first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No content to review</p>
              <p className="text-sm">User uploads will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Content Preview */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {asset.type === "photo" ? (
                      <img
                        src={asset.url}
                        alt="Content"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">{asset.type}</p>
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(asset.uploaded_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      Uploaded by: {asset.user_name}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Type: {asset.type}
                    </p>

                    {asset.reason && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800">
                          Reason: {asset.reason}
                        </p>
                      </div>
                    )}

                    {asset.review_note && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-800">{asset.review_note}</p>
                      </div>
                    )}

                    {asset.status === "pending" && (
                      <ContentActions
                        assetId={asset.id}
                        userName={asset.user_name}
                        contentType={asset.type}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

