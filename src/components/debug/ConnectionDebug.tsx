import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { testSupabaseConnection, testAllTables } from "@/lib/connection-test";
import { RefreshCw, Database, AlertTriangle, CheckCircle } from "lucide-react";

export default function ConnectionDebug() {
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [tableResults, setTableResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const connResult = await testSupabaseConnection();
      setConnectionResult(connResult);

      const tablesResult = await testAllTables();
      setTableResults(tablesResult);
    } catch (error) {
      console.error("Debug test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connection Debug
            <Button
              onClick={runTests}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="ml-auto"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Test Again
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hardcoded Configuration */}
          <div>
            <h4 className="font-semibold mb-2">Configuration Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span>Supabase URL:</span>
                <Badge variant="destructive">PLACEHOLDER</Badge>
                <span className="text-xs text-red-500">
                  You need to replace with actual URL
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Supabase Anon Key:</span>
                <Badge variant="destructive">PLACEHOLDER</Badge>
                <span className="text-xs text-red-500">
                  You need to replace with actual key
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Gemini API Key:</span>
                <Badge variant="destructive">PLACEHOLDER</Badge>
                <span className="text-xs text-red-500">
                  You need to replace with actual key
                </span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Action Required:</strong> The hardcoded values are
                placeholders. You need to replace them with your actual Supabase
                and Gemini credentials in:
              </p>
              <ul className="text-xs text-yellow-700 mt-2 ml-4 list-disc">
                <li>supabase/supabase.ts</li>
                <li>src/lib/gemini.ts</li>
              </ul>
            </div>
          </div>

          {/* Connection Test */}
          {connectionResult && (
            <div>
              <h4 className="font-semibold mb-2">Connection Test</h4>
              <div className="flex items-center gap-2">
                {connectionResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <Badge
                  variant={connectionResult.success ? "default" : "destructive"}
                >
                  {connectionResult.success ? "Connected" : "Failed"}
                </Badge>
                {connectionResult.error && (
                  <span className="text-sm text-red-600">
                    {connectionResult.error}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Table Tests */}
          {tableResults.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Table Access Tests</h4>
              <div className="grid grid-cols-2 gap-2">
                {tableResults.map((result) => (
                  <div
                    key={result.table}
                    className="flex items-center gap-2 text-sm"
                  >
                    {result.success ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                    <span>{result.table}</span>
                    <Badge
                      variant={result.success ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {result.success
                        ? result.hasData
                          ? "Has Data"
                          : "Empty"
                        : "Error"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
