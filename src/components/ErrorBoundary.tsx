import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production, you would send this to an error reporting service
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>

            <p className="text-muted-foreground mb-8">
              We encountered an unexpected error. Please try reloading the app.
            </p>

            <Button
              variant="scanner"
              size="lg"
              onClick={this.handleReload}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4" />
              Reload App
            </Button>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 p-4 rounded-lg bg-secondary text-left">
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
