import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  onBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class HireViewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(
      "Hire View Error Boundary caught an error:",
      error,
      errorInfo,
    );
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Hire View Failed to Load
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                We're having trouble loading the hire view content. This might
                be due to:
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Database connection issues</li>
                <li>• Missing or corrupted data</li>
                <li>• Network connectivity problems</li>
                <li>• Server configuration errors</li>
              </ul>

              {this.state.error && (
                <details className="text-left">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
                    <div className="font-semibold mb-1">Error:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <>
                        <div className="font-semibold mb-1">Stack Trace:</div>
                        <div className="whitespace-pre-wrap">
                          {this.state.error.stack}
                        </div>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3 justify-center pt-4">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                {this.props.onBack && (
                  <Button
                    onClick={this.props.onBack}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HireViewErrorBoundary;
