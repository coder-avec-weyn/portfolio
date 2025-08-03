import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { AlertTriangle, CheckCircle, Database, RefreshCw } from "lucide-react";

interface DatabaseStatusProps {
  onRetry?: () => void;
}

export function DatabaseStatus({ onRetry }: DatabaseStatusProps) {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking",
  );
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkDatabase = async () => {
    try {
      setStatus("checking");
      setError(null);

      // Test connection to each required table
      const requiredTables = [
        "hire_sections",
        "hire_skills",
        "hire_experience",
        "hire_contact_fields",
      ];

      const checks = await Promise.all(
        requiredTables.map(async (table) => {
          const { error } = await supabase.from(table).select("id").limit(1);
          return { table, error };
        }),
      );

      const failedChecks = checks.filter((check) => check.error);

      if (failedChecks.length > 0) {
        const errorMessages = failedChecks
          .map((check) => `${check.table}: ${check.error?.message}`)
          .join(", ");
        throw new Error(`Database errors: ${errorMessages}`);
      }

      setStatus("connected");
      setLastCheck(new Date());
    } catch (e: any) {
      console.error("Database connection error:", e);
      setStatus("error");
      setError(e.message || "Unknown database error");
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkDatabase();

    // Check every 30 seconds
    const interval = setInterval(checkDatabase, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    checkDatabase();
    onRetry?.();
  };

  return (
    <Card
      className={`border-2 ${
        status === "connected"
          ? "border-green-200 bg-green-50"
          : status === "error"
            ? "border-red-200 bg-red-50"
            : "border-yellow-200 bg-yellow-50"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database
              className={`w-5 h-5 ${
                status === "connected"
                  ? "text-green-600"
                  : status === "error"
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  Database Status
                </span>
                <Badge
                  variant={
                    status === "connected"
                      ? "default"
                      : status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {status === "checking" && "Checking..."}
                  {status === "connected" && (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  )}
                  {status === "error" && (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Error
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last checked: {lastCheck.toLocaleTimeString()}
              </p>
              {error && (
                <p className="text-xs text-red-600 mt-1 max-w-md">{error}</p>
              )}
            </div>
          </div>
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            disabled={status === "checking"}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${status === "checking" ? "animate-spin" : ""}`}
            />
            {status === "checking" ? "Checking..." : "Retry"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseStatus;
