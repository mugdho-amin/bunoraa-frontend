"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logger } from "@/lib/logger";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`[ErrorBoundary:${this.props.name || "Global"}] caught an error:`, {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle size={40} />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="mb-8 max-w-md text-muted-foreground">
            An unexpected error occurred in this part of the application. 
            We have been notified and are working on a fix.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCw size={18} />
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="gap-2">
                <Home size={18} />
                Go Home
              </Link>
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono">
              <p className="font-bold text-destructive mb-2">{this.state.error.name}: {this.state.error.message}</p>
              <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
