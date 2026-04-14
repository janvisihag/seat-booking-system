"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Lock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    const authData = getAuth();
    if (!authData || authData.role !== "admin") {
      router.push("/login");
      return;
    }
    setAuth(authData);
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleManualTrigger = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Call the auto-lock API directly (no secret needed for this endpoint)
      const res = await fetch("/api/auto-lock", {
        method: "POST",
      });

      const data = await res.json();

      setResult({
        success: res.ok,
        message: data.message || data.error || "Unknown response",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error triggering allocation:", error);
      setResult({
        success: false,
        message: "Failed to trigger allocation",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestCronEndpoint = async () => {
    try {
      setLoading(true);
      setResult(null);

      // This would normally be called by the cron service
      // For testing, we'll call it with a secret
      const secret = prompt("Enter CRON_SECRET (or leave empty for default):");

      const res = await fetch("/api/cron/daily-allocation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secret || "your-secret-key-here",
        }),
      });

      const data = await res.json();

      setResult({
        success: res.ok,
        message: data.message || data.error || "Unknown response",
        timestamp: data.timestamp,
      });
    } catch (error) {
      console.error("Error testing cron:", error);
      setResult({
        success: false,
        message: "Failed to test cron endpoint",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage seat allocations and system operations
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Auto-Lock Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Daily Allocation Lock
                </h2>
                <p className="text-sm text-gray-600">
                  Trigger next day seat allocation (normally runs at 3 PM daily)
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Automatically allocates seats for next working day</li>
                    <li>Assigns designated seats to scheduled squads</li>
                    <li>Blocks seats for non-scheduled squads</li>
                    <li>Creates auto-lock record to prevent changes</li>
                    <li>Scheduled to run daily at 3 PM via cron job</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleManualTrigger}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Trigger Allocation Now
                  </>
                )}
              </Button>

              <Button
                onClick={handleTestCronEndpoint}
                disabled={loading}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Cron Endpoint
                  </>
                )}
              </Button>
            </div>

            {/* Result Display */}
            {result && (
              <div
                className={`mt-4 p-4 rounded-lg border-2 ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        result.success ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {result.success ? "Success!" : "Error"}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        result.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.timestamp && (
                      <p className="text-xs text-gray-600 mt-2 font-mono">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cron Setup Instructions */}
         
        </div>
      </main>
    </div>
  );
}
