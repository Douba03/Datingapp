import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleLeft, ToggleRight, Plus, Edit } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

async function getFeatureFlags() {
  try {
    const { data, error } = await supabaseAdmin
      .from("feature_flags")
      .select(`
        key,
        value,
        environment,
        version,
        description,
        updated_at,
        updated_by
      `)
      .order("key", { ascending: true });

    if (error) {
      console.error("[getFeatureFlags] Error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[getFeatureFlags] Exception:", error);
    return [];
  }
}

export default async function FeatureFlagsPage() {
  const flags = await getFeatureFlags();

  const activeFlags = flags.filter(f => f.value === true || f.value === "true");
  const inactiveFlags = flags.filter(f => f.value === false || f.value === "false");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-gray-500 mt-1">
            Control feature rollouts and A/B testing
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          New Flag
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flags.length}</div>
            <p className="text-xs text-muted-foreground">All environments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <ToggleRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeFlags.length}</div>
            <p className="text-xs text-muted-foreground">Enabled features</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <ToggleLeft className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{inactiveFlags.length}</div>
            <p className="text-xs text-muted-foreground">Disabled features</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags List */}
      <Card>
        <CardHeader>
          <CardTitle>All Feature Flags</CardTitle>
          <CardDescription>
            Showing {flags.length} feature flags
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ToggleLeft className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No feature flags yet</p>
              <p className="text-sm">Create your first feature flag to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => {
                const isEnabled = flag.value === true || flag.value === "true";
                return (
                  <div
                    key={flag.key}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{flag.key}</h3>
                          <Badge
                            className={
                              isEnabled
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {isEnabled ? (
                              <>
                                <ToggleRight className="h-3 w-3 mr-1" />
                                Enabled
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-3 w-3 mr-1" />
                                Disabled
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline">{flag.environment}</Badge>
                        </div>
                        {flag.description && (
                          <p className="text-sm text-gray-600 mb-2">{flag.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Version: {flag.version}</span>
                          <span>Updated {formatRelativeTime(flag.updated_at)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant={isEnabled ? "destructive" : "default"}
                          disabled
                        >
                          {isEnabled ? (
                            <>
                              <ToggleLeft className="h-3 w-3 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-3 w-3 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {flags.length > 0 && (
            <div className="mt-6 text-sm text-gray-500">
              <p>
                💡 <strong>Note:</strong> Feature flag actions (Enable, Disable, Edit) will be
                implemented with confirmation dialogs in the next update.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <ul className="list-disc list-inside space-y-1">
            <li>Control feature rollouts without deploying new code</li>
            <li>Run A/B tests and experiments</li>
            <li>Enable features for specific environments</li>
            <li>Quickly disable problematic features</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

