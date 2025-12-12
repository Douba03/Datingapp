"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(`[LOGIN DEBUG] ${message}`);
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo([]);

    try {
      addDebug(`Starting login for email: ${email.trim().toLowerCase()}`);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        addDebug(`❌ Sign in error: ${signInError.message}`);
        addDebug(`Error code: ${signInError.status || 'N/A'}`);
        addDebug(`Error details: ${JSON.stringify(signInError)}`);
        setError(signInError.message);
        return;
      }

      addDebug(`✅ Sign in successful!`);
      addDebug(`User ID: ${data.user?.id}`);
      addDebug(`User email: ${data.user?.email}`);
      addDebug(`Session exists: ${!!data.session}`);

      if (data.session) {
        addDebug(`Checking admin status...`);
        
        const response = await fetch("/api/auth/check-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        });

        addDebug(`Admin check response status: ${response.status}`);
        
        const result = await response.json();
        addDebug(`Admin check result: ${JSON.stringify(result)}`);

        if (!result.isAdmin) {
          addDebug(`❌ User is not admin`);
          addDebug(`User metadata: ${JSON.stringify(data.user.app_metadata)}`);
          setError("You do not have admin access. Check console for details.");
          await supabase.auth.signOut();
          return;
        }

        addDebug(`✅ User is admin! Redirecting to dashboard...`);
        router.push("/dashboard");
        router.refresh();
      } else {
        addDebug(`❌ No session created`);
        setError("No session created. Please try again.");
      }
    } catch (err: any) {
      addDebug(`❌ Exception caught: ${err.message}`);
      addDebug(`Stack: ${err.stack}`);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            {debugInfo.length > 0 && (
              <div className="text-xs bg-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
                <div className="font-semibold mb-2">Debug Log:</div>
                {debugInfo.map((info, i) => (
                  <div key={i} className="font-mono text-gray-700 mb-1">
                    {info}
                  </div>
                ))}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

